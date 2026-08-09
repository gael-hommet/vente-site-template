import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * ACE 0.2 — Pilote du CLI OFFICIEL Higgsfield (`hf-api`).
 *
 * Module **Node uniquement** (spawn de binaire) : il n'est JAMAIS exporté par le
 * barrel `@/ace/media-engine` et ne doit jamais atteindre le bundle client.
 *
 * CONTRAT VÉRIFIÉ (obtenu en exécutant réellement `hf-api --help` et chaque
 * sous-commande, binaire officiel `@higgsfield/cloud-cli` v0.1.2 —
 * github.com/higgsfield-ai/cloud-cli) :
 *
 *   hf-api auth login --key <id>:<secret> | auth status | auth logout
 *   hf-api models [slug] [--search s] [--output-type image|video|audio|3d_model]
 *                        [--operation-type text2image|image2video]
 *   hf-api estimate <slug> [--param k=v]... [--input params.json]
 *   hf-api generate <slug> [--param k=v]... [--input params.json]
 *                          [--wait] [--wait-interval d] [--wait-timeout d]
 *   hf-api status <request_id>
 *   hf-api wait <request_id> [--interval d] [--timeout d]
 *   hf-api usage [--timeframe hour|day|week|month] [--model s] [--start] [--end]
 *   Flag global : --json (réponses JSON brutes sur stdout)
 *
 * CODES DE SORTIE VÉRIFIÉS : 0 = succès · 1 = erreur d'usage · 2 = non
 * authentifié. Les erreurs sortent en TEXTE sur stderr (pas en JSON, même avec
 * `--json`).
 *
 * HONNÊTETÉ : le *contrat de commande* est vérifié, mais le *schéma JSON des
 * réponses* ne l'est pas (aucune authentification disponible dans cet
 * environnement). On ne devine donc aucun chemin de champ : les réponses sont
 * rendues telles quelles (`unknown`) et les extracteurs signalent
 * `HF_SCHEMA_UNVERIFIED` plutôt que d'inventer une structure.
 *
 * SÉCURITÉ : la clé n'est JAMAIS passée en argument (elle fuiterait dans la
 * table des processus) ni lue depuis un fichier `.env`. On s'appuie sur
 * `HIGGSFIELD_API_KEY` déjà présente dans l'environnement, ou sur un
 * `hf-api auth login` effectué par l'utilisateur. Aucune valeur n'est loguée.
 */

/** Variable d'environnement optionnelle pour pointer un binaire hors PATH. */
const BIN_ENV = "HF_API_BIN";
const DEFAULT_BIN = "hf-api";

export type HfCliErrorCode =
  /** Binaire `hf-api` introuvable : provider non installé. */
  | "HF_CLI_MISSING"
  /** Binaire présent mais aucune authentification (exit 2). */
  | "PROVIDER_AUTH_PENDING"
  /** Erreur d'usage du CLI (exit 1) — mauvais slug/param. */
  | "HF_USAGE_ERROR"
  /** Le CLI n'a pas répondu dans le délai imparti. */
  | "HF_TIMEOUT"
  /** Sortie 0 mais JSON illisible / structure non reconnue. */
  | "HF_SCHEMA_UNVERIFIED"
  /** Échec non classé (réseau, quota, erreur serveur…). */
  | "HF_FAILED";

export interface HfCliOk<T> {
  ok: true;
  data: T;
}

export interface HfCliErr {
  ok: false;
  code: HfCliErrorCode;
  message: string;
}

export type HfCliResult<T> = HfCliOk<T> | HfCliErr;

/** Localise le binaire `hf-api` (env explicite, puis PATH). */
export function resolveHfApiBinary(): string | null {
  const fromEnv = process.env[BIN_ENV]?.trim();
  if (fromEnv) return existsSync(fromEnv) ? fromEnv : null;
  const probe = spawnSync(DEFAULT_BIN, ["--version"], { stdio: "ignore" });
  return probe.error ? null : DEFAULT_BIN;
}

/** true si le CLI officiel est installé et exécutable ici. */
export function isHfCliAvailable(): boolean {
  return resolveHfApiBinary() !== null;
}

interface RunOptions {
  /** Délai max en ms (une génération `--wait` peut être longue). */
  timeoutMs?: number;
}

/**
 * Exécute `hf-api <args> --json` et mappe la sortie sur un résultat typé.
 * Aucune simulation : si le CLI échoue, on remonte son code et son message.
 */
function runJson(args: string[], opts: RunOptions = {}): HfCliResult<unknown> {
  const bin = resolveHfApiBinary();
  if (!bin) {
    return {
      ok: false,
      code: "HF_CLI_MISSING",
      message:
        "CLI officiel `hf-api` introuvable. Installer : npm i -g @higgsfield/cloud-cli " +
        `(ou pointer ${BIN_ENV} vers le binaire). Voir docs/ACE-HIGGSFIELD-SETUP.md.`,
    };
  }

  const res = spawnSync(bin, [...args, "--json"], {
    encoding: "utf8",
    timeout: opts.timeoutMs ?? 120_000,
    maxBuffer: 32 * 1024 * 1024,
  });

  if (res.error) {
    const timedOut = (res.error as NodeJS.ErrnoException).code === "ETIMEDOUT";
    return {
      ok: false,
      code: timedOut ? "HF_TIMEOUT" : "HF_FAILED",
      message: `Exécution de \`hf-api ${args[0] ?? ""}\` impossible : ${res.error.message}`,
    };
  }

  const stderr = (res.stderr ?? "").trim();
  if (res.status === 2) {
    return {
      ok: false,
      code: "PROVIDER_AUTH_PENDING",
      message:
        "Higgsfield : aucune authentification active. Exécuter `hf-api auth login` " +
        "ou définir HIGGSFIELD_API_KEY dans l'environnement. Aucune génération n'est simulée.",
    };
  }
  if (res.status === 1) {
    return {
      ok: false,
      code: "HF_USAGE_ERROR",
      message: stderr || "Erreur d'usage du CLI hf-api (arguments/slug invalides).",
    };
  }
  if (res.status !== 0) {
    return {
      ok: false,
      code: "HF_FAILED",
      message: stderr || `hf-api a terminé avec le code ${String(res.status)}.`,
    };
  }

  const stdout = (res.stdout ?? "").trim();
  if (!stdout) return { ok: true, data: null };
  try {
    return { ok: true, data: JSON.parse(stdout) as unknown };
  } catch {
    return {
      ok: false,
      code: "HF_SCHEMA_UNVERIFIED",
      message:
        "hf-api a réussi mais sa sortie n'est pas du JSON exploitable. " +
        "Le schéma de réponse doit être confirmé avant usage automatisé.",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Commandes                                                                  */
/* -------------------------------------------------------------------------- */

/** Statut d'authentification réel (jamais la valeur de la clé). */
export function hfAuthStatus(): HfCliResult<unknown> {
  return runJson(["auth", "status"]);
}

export interface HfModelsFilter {
  search?: string;
  /** image | video | audio | 3d_model */
  outputType?: string;
  /** ex. text2image, image2video */
  operationType?: string;
}

/**
 * Catalogue des modèles RÉELLEMENT utilisables par cette clé.
 * Le CLI documente « listed == usable » : c'est la seule source de vérité des
 * modèles. ACE n'invente jamais de slug.
 */
export function hfModels(filter: HfModelsFilter = {}): HfCliResult<unknown> {
  const args = ["models"];
  if (filter.search) args.push("--search", filter.search);
  if (filter.outputType) args.push("--output-type", filter.outputType);
  if (filter.operationType) args.push("--operation-type", filter.operationType);
  return runJson(args);
}

/** Schéma de paramètres d'un modèle (champs requis, enums, défauts). */
export function hfModelParams(slug: string): HfCliResult<unknown> {
  return runJson(["models", slug]);
}

/** Écrit les params dans un fichier temporaire (hors dépôt) pour `--input`. */
function withParamsFile<T>(params: Record<string, unknown>, fn: (file: string) => T): T {
  const dir = mkdtempSync(path.join(tmpdir(), "ace-hf-params-"));
  const file = path.join(dir, "params.json");
  writeFileSync(file, JSON.stringify(params));
  try {
    return fn(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Coût estimé AVANT génération (crédits/USD réels du provider, pas un tarif inventé). */
export function hfEstimate(slug: string, params: Record<string, unknown>): HfCliResult<unknown> {
  return withParamsFile(params, (file) => runJson(["estimate", slug, "--input", file]));
}

export interface HfGenerateOptions {
  /** Bloque jusqu'à l'état terminal et imprime les URLs de résultat. */
  wait?: boolean;
  /** Intervalle de polling (min 5s côté CLI). */
  waitInterval?: string;
  /** Délai max de polling (défaut CLI : 10m). */
  waitTimeout?: string;
  timeoutMs?: number;
}

/** Lance une génération réelle. Aucune simulation possible ici. */
export function hfGenerate(
  slug: string,
  params: Record<string, unknown>,
  opts: HfGenerateOptions = {},
): HfCliResult<unknown> {
  return withParamsFile(params, (file) => {
    const args = ["generate", slug, "--input", file];
    if (opts.wait) args.push("--wait");
    if (opts.waitInterval) args.push("--wait-interval", opts.waitInterval);
    if (opts.waitTimeout) args.push("--wait-timeout", opts.waitTimeout);
    // Une génération avec --wait peut durer : marge au-delà du timeout CLI.
    return runJson(args, { timeoutMs: opts.timeoutMs ?? 15 * 60_000 });
  });
}

export function hfStatus(requestId: string): HfCliResult<unknown> {
  return runJson(["status", requestId]);
}

export function hfWait(
  requestId: string,
  opts: { interval?: string; timeout?: string; timeoutMs?: number } = {},
): HfCliResult<unknown> {
  const args = ["wait", requestId];
  if (opts.interval) args.push("--interval", opts.interval);
  if (opts.timeout) args.push("--timeout", opts.timeout);
  return runJson(args, { timeoutMs: opts.timeoutMs ?? 15 * 60_000 });
}

/** Consommation réelle (quantité + coût par modèle) — alimente le cost guard. */
export function hfUsage(
  opts: { timeframe?: string; model?: string; start?: string; end?: string } = {},
): HfCliResult<unknown> {
  const args = ["usage"];
  if (opts.timeframe) args.push("--timeframe", opts.timeframe);
  if (opts.model) args.push("--model", opts.model);
  if (opts.start) args.push("--start", opts.start);
  if (opts.end) args.push("--end", opts.end);
  return runJson(args);
}

/* -------------------------------------------------------------------------- */
/* Extraction tolérante (le schéma JSON n'est pas vérifiable sans credential)  */
/* -------------------------------------------------------------------------- */

/** Un modèle tel qu'ACE le consomme (normalisé depuis la réponse du CLI). */
export interface HfModelInfo {
  slug: string;
  outputType?: string;
  operationTypes?: string[];
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function firstArray(v: unknown): unknown[] | null {
  if (Array.isArray(v)) return v;
  const rec = asRecord(v);
  if (!rec) return null;
  // Le nom du champ conteneur n'est pas documenté : on prend le premier tableau
  // d'objets rencontré plutôt que de deviner une clé précise.
  for (const value of Object.values(rec)) {
    if (Array.isArray(value) && value.some((e) => asRecord(e) !== null)) return value;
  }
  return null;
}

function pickString(rec: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

/**
 * Normalise la sortie de `hf-api models --json` en liste de modèles.
 *
 * Le schéma exact n'étant pas vérifiable sans authentification, l'extraction
 * est tolérante et ÉCHOUE explicitement (`HF_SCHEMA_UNVERIFIED`) si aucune
 * entrée exploitable n'est trouvée — plutôt que de renvoyer une liste vide
 * laissant croire « aucun modèle disponible ».
 */
export function extractModels(payload: unknown): HfCliResult<HfModelInfo[]> {
  const arr = firstArray(payload);
  if (!arr) {
    return {
      ok: false,
      code: "HF_SCHEMA_UNVERIFIED",
      message:
        "Réponse `models` reçue mais aucune liste exploitable n'y a été trouvée. " +
        "Confirmer le schéma avec `hf-api models --json` puis adapter l'extracteur.",
    };
  }
  const models: HfModelInfo[] = [];
  for (const entry of arr) {
    const rec = asRecord(entry);
    if (!rec) continue;
    const slug = pickString(rec, ["slug", "id", "name", "model", "model_slug"]);
    if (!slug) continue;
    const outputType = pickString(rec, ["output_type", "outputType", "type", "modality"]);
    const opsRaw = rec["operation_types"] ?? rec["operationTypes"] ?? rec["operations"];
    const operationTypes = Array.isArray(opsRaw)
      ? opsRaw.filter((o): o is string => typeof o === "string")
      : undefined;
    models.push({ slug, outputType, operationTypes });
  }
  if (models.length === 0) {
    return {
      ok: false,
      code: "HF_SCHEMA_UNVERIFIED",
      message:
        "Réponse `models` reçue mais aucun slug de modèle n'a pu en être extrait. " +
        "Le schéma doit être confirmé avant de router un modèle.",
    };
  }
  return { ok: true, data: models };
}

/** URLs de sortie d'une génération, extraites de façon tolérante et récursive. */
export function extractOutputUrls(payload: unknown): string[] {
  const urls: string[] = [];
  const seen = new Set<unknown>();
  const visit = (node: unknown): void => {
    if (node === null || typeof node !== "object") {
      if (typeof node === "string" && /^https?:\/\//.test(node)) urls.push(node);
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    Object.values(node as Record<string, unknown>).forEach(visit);
  };
  visit(payload);
  return [...new Set(urls)];
}
