import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { setLocalToolAvailability } from "../providers/local";
import { setHiggsfieldRuntime } from "../providers/higgsfield";
import type { GenerateRequest, ProviderResult } from "../providers/types";
import {
  extractOutputUrls,
  hfAuthStatus,
  hfGenerate,
  isHfCliAvailable,
  type HfCliResult,
} from "./hf-cli";

/**
 * ACE 0.2 — Câblage Node des providers sur leurs capacités RÉELLES.
 *
 * Module **Node uniquement**. Il interroge l'environnement (binaires présents,
 * authentification du CLI officiel) et injecte l'état vérifié dans les adapters
 * isomorphes. Rien n'est supposé : ce qui n'est pas prouvé est déclaré absent.
 */

function hasBinary(bin: string): boolean {
  const res = spawnSync(bin, ["-version"], { stdio: "ignore" });
  // ffmpeg/ffprobe renvoient 0 ou 1 selon la version ; une erreur d'exec = absent.
  return !res.error && (res.status === 0 || res.status === 1);
}

function hasPackage(root: string, name: string): boolean {
  return existsSync(path.join(root, "node_modules", name));
}

export interface DetectedTools {
  ffmpeg: boolean;
  ffprobe: boolean;
  sharp: boolean;
  gltfTransform: boolean;
  hfCli: boolean;
  hfAuthenticated: boolean;
  /** Message honnête quand l'authentification est absente/indéterminée. */
  hfAuthNote: string;
}

/** Télécharge une URL vers un fichier local (Node 18+ : fetch global). */
async function downloadTo(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`téléchargement échoué (HTTP ${String(res.status)}) : ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
}

/** Devine une extension raisonnable depuis l'URL (sinon `.bin`). */
function extensionFor(url: string): string {
  const clean = url.split("?")[0] ?? url;
  const ext = path.extname(clean).toLowerCase();
  return /^\.(jpg|jpeg|png|webp|avif|mp4|webm|mov|m4v|gif)$/.test(ext) ? ext : ".bin";
}

/**
 * Pilote de génération RÉEL : délègue au CLI officiel `hf-api`, attend l'état
 * terminal, puis télécharge les sorties dans `outDir`.
 *
 * Aucune simulation : toute anomalie remonte en erreur typée.
 */
async function higgsfieldGenerate(req: GenerateRequest): Promise<ProviderResult> {
  if (!req.model) {
    return {
      ok: false,
      code: "MEDIA_ASSET_REQUIRED",
      message:
        "Aucun modèle résolu pour cette génération. Le model router doit choisir un " +
        "slug dans le catalogue réel (`hf-api models`) — ACE n'invente pas de modèle.",
    };
  }

  const params: Record<string, unknown> = { prompt: req.prompt, ...(req.params ?? {}) };
  if (req.referenceImage) params["reference_image"] = req.referenceImage;

  const result: HfCliResult<unknown> = hfGenerate(req.model, params, { wait: true });
  if (!result.ok) {
    // Les codes du CLI sont remontés tels quels : pas de reclassement flatteur.
    const code =
      result.code === "PROVIDER_AUTH_PENDING"
        ? "PROVIDER_AUTH_PENDING"
        : result.code === "HF_CLI_MISSING"
          ? "PROVIDER_NOT_CONFIGURED"
          : result.code === "HF_SCHEMA_UNVERIFIED"
            ? "PROVIDER_CONTRACT_UNVERIFIED"
            : "GENERATION_FAILED";
    return { ok: false, code, message: result.message };
  }

  const urls = extractOutputUrls(result.data);
  if (urls.length === 0) {
    return {
      ok: false,
      code: "PROVIDER_CONTRACT_UNVERIFIED",
      message:
        "Génération terminée mais aucune URL de sortie n'a pu être extraite de la réponse. " +
        "Confirmer le schéma de réponse (`hf-api status <id> --json`) avant usage automatisé.",
    };
  }

  const outputs: string[] = [];
  for (const [i, url] of urls.entries()) {
    const dest = path.join(
      req.outDir,
      `${req.shot.id}-${String(i + 1).padStart(2, "0")}${extensionFor(url)}`,
    );
    try {
      await downloadTo(url, dest);
      outputs.push(dest);
    } catch (e) {
      return {
        ok: false,
        code: "GENERATION_FAILED",
        message: `Sortie générée mais non récupérable : ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  return { ok: true, outputs, meta: { model: req.model, sourceUrls: urls } };
}

/**
 * Détecte l'outillage réel et câble les providers. À appeler une fois au début
 * de chaque commande CLI média.
 */
export function wireProviders(root: string): DetectedTools {
  const ffmpeg = hasBinary("ffmpeg");
  const ffprobe = hasBinary("ffprobe");
  const sharp = hasPackage(root, "sharp");
  const gltfTransform =
    hasPackage(root, "@gltf-transform/cli") || hasPackage(root, "@gltf-transform/functions");

  setLocalToolAvailability({ ffmpeg, sharp, gltfTransform });

  const hfCli = isHfCliAvailable();
  let hfAuthenticated = false;
  let hfAuthNote = "CLI officiel `hf-api` absent : provider non configuré.";
  if (hfCli) {
    const auth = hfAuthStatus();
    hfAuthenticated = auth.ok;
    hfAuthNote = auth.ok
      ? "Authentification Higgsfield active."
      : `Authentification absente : ${auth.message}`;
  }

  setHiggsfieldRuntime({
    cliAvailable: hfCli,
    authenticated: hfAuthenticated,
    generate: higgsfieldGenerate,
  });

  return { ffmpeg, ffprobe, sharp, gltfTransform, hfCli, hfAuthenticated, hfAuthNote };
}
