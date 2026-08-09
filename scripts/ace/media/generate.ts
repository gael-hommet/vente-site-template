/**
 * ace:media:generate — pipeline de GÉNÉRATION réel (jamais simulé).
 *
 * Enchaîne : plan → provider → catalogue de modèles RÉEL → routage → estimation
 * de coût → confirmation → génération → récupération → QA technique → verdict →
 * retry borné → manifeste.
 *
 * Usage :
 *   pnpm ace:media:generate --brief <brief.json> --out <dir>
 *        [--subject <id>] [--max-spend N] [--max-attempts N]
 *        [--yes]     # confirme la dépense sans invite
 *        [--dry-run] # s'arrête après l'estimation, ne génère rien
 *        [--json]
 *
 * Codes de sortie honnêtes :
 *   0  génération effectuée (au moins un plan approuvé)
 *   1  aucun plan approuvé / échec
 *   2  erreur d'usage
 *   3  PROVIDER_NOT_CONFIGURED  (CLI officiel `hf-api` absent)
 *   4  PROVIDER_AUTH_PENDING    (CLI présent, pas d'authentification)
 *   5  PROVIDER_CONTRACT_UNVERIFIED (catalogue/réponse non exploitable)
 *
 * Aucune sortie n'est inventée : sans provider utilisable, la commande explique
 * ce qui manque et s'arrête.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildMediaPlan,
  createBudget,
  createReferenceLock,
  orchestrateGeneration,
  routeModel,
  outputKindForShot,
  summarizeBudget,
  summarizeManifest,
  getProvider,
  type AceReferenceLock,
  type MediaBriefInput,
  type ModelRoutingDecision,
  type RoutableModel,
} from "@/ace/media-engine";
import { wireProviders } from "@/ace/media-engine/node/provider-runtime";
import { assessTechnical } from "@/ace/media-engine/node/technical-qa";
import { extractModels, hfEstimate, hfModels } from "@/ace/media-engine/node/hf-cli";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const opt = (f: string): string | undefined => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
// Déclaration de fonction (et non arrow const) : TypeScript ne restreint le
// type après un appel `never` que dans ce cas.
function die(msg: string, code = 2): never {
  console.error(`✗ ${msg}`);
  process.exit(code);
}
const say = (m: string): void => {
  if (!asJson) console.log(m);
};

/* ----------------------------- 1. brief + plan ---------------------------- */
const briefPath = opt("--brief");
if (!briefPath) die("argument requis : --brief <brief.json>");
if (!existsSync(briefPath)) die(`brief introuvable : ${briefPath}`, 2);

let brief: MediaBriefInput;
try {
  brief = JSON.parse(readFileSync(briefPath, "utf8")) as MediaBriefInput;
} catch (e) {
  die(`brief illisible : ${e instanceof Error ? e.message : String(e)}`);
  throw e;
}

const outDir = opt("--out") ?? path.join(ROOT, "research/media/output");
mkdirSync(outDir, { recursive: true });

/* --------------------- 2. capacités RÉELLES du provider ------------------- */
const tools = wireProviders(ROOT);
say("ACE 0.2 — génération média\n");
say(`  CLI officiel hf-api : ${tools.hfCli ? "présent ✓" : "ABSENT ✗"}`);
say(`  Authentification    : ${tools.hfAuthenticated ? "active ✓" : "absente ✗"}`);
say(`  ${tools.hfAuthNote}\n`);

if (!tools.hfCli) {
  console.error(
    "✗ PROVIDER_NOT_CONFIGURED — le CLI officiel `hf-api` n'est pas installé.\n" +
      "  Installer : npm i -g @higgsfield/cloud-cli\n" +
      "  Puis      : hf-api auth login\n" +
      "  Voir docs/ACE-HIGGSFIELD-SETUP.md. Aucune génération n'est simulée.",
  );
  process.exit(3);
}
if (!tools.hfAuthenticated) {
  console.error(
    "✗ PROVIDER_AUTH_PENDING — CLI installé mais aucune authentification active.\n" +
      "  Exécuter : hf-api auth login   (ou définir HIGGSFIELD_API_KEY=<id>:<secret>)\n" +
      "  Aucune génération n'est simulée.",
  );
  process.exit(4);
}

/* ------------------- 3. catalogue de modèles RÉEL (jamais inventé) -------- */
const catalogRes = hfModels();
if (!catalogRes.ok) {
  console.error(`✗ Catalogue de modèles indisponible : ${catalogRes.message}`);
  process.exit(catalogRes.code === "PROVIDER_AUTH_PENDING" ? 4 : 5);
}
const parsed = extractModels(catalogRes.data);
if (!parsed.ok) {
  console.error(`✗ PROVIDER_CONTRACT_UNVERIFIED — ${parsed.message}`);
  process.exit(5);
}
const catalog: RoutableModel[] = parsed.data.map((m) => ({
  provider: "higgsfield",
  slug: m.slug,
  outputType: m.outputType,
  operationTypes: m.operationTypes,
}));
say(`  Modèles réellement disponibles : ${String(catalog.length)}`);

/* ------------------------------ 4. plan média ----------------------------- */
const plan = buildMediaPlan({ ...brief, configuredProviders: ["higgsfield"] });
say(`  Stratégie : ${plan.decision.strategy} · ${String(plan.shots.length)} plan(s)\n`);
if (plan.decision.blocker) {
  console.error(`✗ ${plan.decision.blocker} — ${plan.decision.rationale}`);
  process.exit(1);
}

/* ------------------------------ 5. routage -------------------------------- */
const routingCache = new Map<string, ModelRoutingDecision>();
const routingFor = (shot: (typeof plan.shots)[number]): ModelRoutingDecision => {
  const cached = routingCache.get(shot.id);
  if (cached) return cached;
  const { outputKind, continuityRequired } = outputKindForShot(shot, plan.decision.strategy);
  const decision = routeModel({
    intent: plan.intent,
    qualityBar: plan.qualityBar,
    outputKind,
    hasReferenceImage: Boolean(brief.subject),
    continuityRequired,
    durationS: shot.durationS,
    catalog,
  });
  routingCache.set(shot.id, decision);
  return decision;
};

const routings = plan.shots.map((s) => ({ shot: s.id, d: routingFor(s) }));
for (const r of routings) {
  say(`  ${r.shot} → ${r.d.model ?? "(aucun modèle)"} [${r.d.mode ?? "—"}]`);
}
if (routings.every((r) => r.d.blocker !== null)) {
  console.error(
    "\n✗ Aucun modèle du catalogue ne couvre les besoins de ce plan. " +
      "ACE ne route jamais vers un modèle supposé.",
  );
  process.exit(5);
}

/* ------------------------- 6. estimation de coût -------------------------- */
const estimateFor = (model: string, params: Record<string, unknown>): number | null => {
  const res = hfEstimate(model, params);
  if (!res.ok) return null;
  // Le schéma de l'estimation n'est pas vérifiable sans authentification :
  // on cherche un nombre plausible sans inventer de chemin de champ.
  const findNumber = (node: unknown): number | null => {
    if (typeof node === "number" && Number.isFinite(node)) return node;
    if (node && typeof node === "object") {
      for (const v of Object.values(node as Record<string, unknown>)) {
        const n = findNumber(v);
        if (n !== null) return n;
      }
    }
    return null;
  };
  return findNumber(res.data);
};

const firstModel = routings.find((r) => r.d.model)?.d.model;
const sampleCost = firstModel ? estimateFor(firstModel, { prompt: "estimation" }) : null;
say(
  `\n  Coût estimé par génération : ${sampleCost === null ? "non communiqué par le provider" : String(sampleCost)}`,
);

if (args.includes("--dry-run")) {
  say("\n▸ --dry-run : arrêt avant toute dépense. Aucune génération lancée.");
  process.exit(0);
}
if (!args.includes("--yes")) {
  console.error(
    "\n✗ Confirmation requise avant de dépenser. Relancer avec --yes " +
      "(ou --dry-run pour n'obtenir que l'estimation).",
  );
  process.exit(2);
}

/* --------------------------- 7. orchestration ----------------------------- */
const subjectId = opt("--subject") ?? brief.subject ?? "sujet";
const lockPath = path.join(ROOT, "research/media", subjectId, "reference-lock.json");
let lock: AceReferenceLock = createReferenceLock(subjectId, brief.subject ?? "");
if (existsSync(lockPath)) {
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf8")) as AceReferenceLock;
    say(`  Verrou de référence chargé : ${lockPath}`);
  } catch {
    say(`  ⚠ verrou illisible, un nouveau est créé : ${lockPath}`);
  }
}

const maxSpend = opt("--max-spend") ? Number(opt("--max-spend")) : null;
const budget = createBudget({
  maxSpend,
  maxAttemptsPerShot: Number(opt("--max-attempts") ?? "3"),
  currency: "provider",
});

// `tsx` compile ces scripts en CJS : pas de top-level await, on encapsule.
async function run(): Promise<number> {
  const result = await orchestrateGeneration(
    {
      project: path.basename(ROOT),
      engineVersion: "0.2.0",
      intent: plan.intent,
      qualityBar: plan.qualityBar,
      strategy: plan.decision.strategy,
      shots: plan.shots,
      routingFor,
      lock,
      outDir,
      budget,
    },
    {
      generate: async (req) => {
        const provider = getProvider("higgsfield");
        if (!provider?.generate) {
          return {
            ok: false as const,
            code: "PROVIDER_NOT_CONFIGURED" as const,
            message: "Provider higgsfield indisponible.",
          };
        }
        return provider.generate(req);
      },
      estimate: estimateFor,
      technicalQa: (file) => {
        const r = assessTechnical(file, { maxWeightKb: 8000 });
        return { verdict: r.verdict, issues: [...r.failures, ...r.warnings] };
      },
      now: () => new Date().toISOString(),
    },
  );

  /* ------------------------------ 8. sorties -------------------------------- */
  const manifestPath = path.join(outDir, "media-manifest.json");
  writeFileSync(manifestPath, JSON.stringify(result.manifest, null, 2) + "\n");
  mkdirSync(path.dirname(lockPath), { recursive: true });
  writeFileSync(lockPath, JSON.stringify(result.lock, null, 2) + "\n");

  const summary = summarizeManifest(result.manifest);
  const spend = summarizeBudget(result.budget);

  if (asJson) {
    console.log(
      JSON.stringify({ summary, spend, outcomes: result.outcomes, manifestPath }, null, 2),
    );
  } else {
    console.log("\n─── Résultat ───");
    for (const o of result.outcomes) {
      console.log(`  ${o.outcome.padEnd(18)} ${o.shotId} — ${o.detail}`);
    }
    console.log(
      `\n  ${String(summary.approved)}/${String(summary.total)} plan(s) approuvé(s) · ` +
        `${String(summary.totalAttempts)} tentative(s)`,
    );
    console.log(
      `  Dépense : ${String(spend.spent)} ${spend.currency}` +
        (spend.isLowerBound
          ? ` (minorant : ${String(spend.unknownCostCount)} coût(s) inconnu(s))`
          : ""),
    );
    if (result.stoppedEarly) console.log(`  ⚠ arrêt anticipé : ${result.stopReason ?? ""}`);
    console.log(`  Manifeste : ${manifestPath}`);
    console.log(`  Verrou    : ${lockPath}`);
    console.log("\n  → QA : pnpm ace:media:qa --manifest " + manifestPath);
  }

  return summary.approved > 0 ? 0 : 1;
}

run().then(
  (code) => process.exit(code),
  (e: unknown) => die(`génération interrompue : ${e instanceof Error ? e.message : String(e)}`, 1),
);
