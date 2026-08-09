#!/usr/bin/env node
/**
 * ace:media:capabilities — audit HONNÊTE des capacités média réellement
 * disponibles ICI (pas des capacités théoriques).
 *
 * Vérifie : binaires (ffmpeg), packages (sharp, @gltf-transform/cli), providers
 * de génération configurés via env, et techniques runtime présentes (composants
 * scroll-cinéma). Ne prétend jamais qu'un provider fonctionne s'il n'est pas
 * configuré.
 *
 * Sortie : rapport lisible + JSON (--json). Script interne au moteur.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const asJson = process.argv.includes("--json");

function hasBinary(bin) {
  const res = spawnSync(bin, ["-version"], { stdio: "ignore" });
  return res.status === 0 || res.status === 1;
}

function hasPackage(name) {
  return existsSync(path.join(ROOT, "node_modules", name));
}

/**
 * Providers connus (miroir de config.ts, sans importer TS ici).
 * Higgsfield se pilote par son CLI OFFICIEL `hf-api` : la présence du binaire
 * ET une authentification active sont deux faits distincts, tous deux vérifiés
 * en exécutant réellement le CLI.
 */
const KNOWN_PROVIDERS = [
  { name: "higgsfield", bin: "hf-api", envBin: "HF_API_BIN", requiredEnv: "HIGGSFIELD_API_KEY" },
];

/** Localise le binaire d'un provider (env explicite, puis PATH). */
function resolveProviderBin(p) {
  const fromEnv = (process.env[p.envBin] ?? "").trim();
  if (fromEnv) return existsSync(fromEnv) ? fromEnv : null;
  return spawnSync(p.bin, ["--version"], { stdio: "ignore" }).error ? null : p.bin;
}

/** `hf-api auth status` : exit 0 = authentifié, exit 2 = non authentifié. */
function providerAuthenticated(bin) {
  const res = spawnSync(bin, ["auth", "status", "--json"], { stdio: "ignore" });
  return !res.error && res.status === 0;
}

function runtimeStrategies() {
  const strategies = [];
  const c = (rel) => existsSync(path.join(ROOT, rel));
  if (c("src/components/media/ScrollVideo.tsx")) strategies.push("video-scroll");
  if (c("src/components/media/ScrollImageSequence.tsx")) strategies.push("image-sequence");
  if (c("src/components/photo/DepthParallax.tsx")) strategies.push("2.5d");
  if (c("src/components/three/AdaptiveCanvas.tsx")) strategies.push("webgl");
  if (c("src/components/media/MediaFallback.tsx")) strategies.push("editorial-fallback");
  return strategies;
}

const ffmpeg = hasBinary("ffmpeg");
const ffprobe = hasBinary("ffprobe");
const sharp = hasPackage("sharp");
const gltfTransform = hasPackage("@gltf-transform/cli") || hasPackage("@gltf-transform/functions");

const providerDetails = KNOWN_PROVIDERS.map((p) => {
  const bin = resolveProviderBin(p);
  const authenticated = bin ? providerAuthenticated(bin) : false;
  return {
    name: p.name,
    cliInstalled: bin !== null,
    authenticated,
    status: !bin ? "PROVIDER_NOT_CONFIGURED" : authenticated ? "READY" : "PROVIDER_AUTH_PENDING",
  };
});
const configured = providerDetails.filter((p) => p.status === "READY").map((p) => p.name);
const unconfigured = providerDetails.filter((p) => p.status !== "READY").map((p) => p.name);

const notes = [];
if (!ffmpeg) notes.push("ffmpeg absent : assemblage/extraction de frames indisponibles.");
if (!ffprobe) notes.push("ffprobe absent : QA technique réelle indisponible.");
for (const p of providerDetails) {
  if (p.status === "PROVIDER_NOT_CONFIGURED") {
    notes.push(
      `${p.name} : CLI officiel absent → PROVIDER_NOT_CONFIGURED. Installer : npm i -g @higgsfield/cloud-cli (voir docs/ACE-HIGGSFIELD-SETUP.md).`,
    );
  } else if (p.status === "PROVIDER_AUTH_PENDING") {
    notes.push(
      `${p.name} : CLI installé mais non authentifié → PROVIDER_AUTH_PENDING. Exécuter : hf-api auth login.`,
    );
  }
}
if (!configured.length)
  notes.push(
    "Aucun provider de génération IA PRÊT : ACE ne génère pas d'images/vidéos ici. Il DÉCIDE, PLANIFIE, ASSEMBLE, OPTIMISE et CONTRÔLE ; la génération requiert un provider authentifié (ou un asset fourni).",
  );

const report = {
  ffmpeg,
  ffprobe,
  sharp,
  gltfTransform,
  configuredProviders: configured,
  unconfiguredProviders: unconfigured,
  providerDetails,
  runtimeStrategies: runtimeStrategies(),
  notes,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const ok = (b) => (b ? "✓" : "✗");
  console.log("ACE 0.2 — Capacités média réelles\n");
  console.log(`  ${ok(ffmpeg)} ffmpeg (assemblage/frames)`);
  console.log(`  ${ok(ffprobe)} ffprobe (QA technique réelle)`);
  console.log(`  ${ok(sharp)} sharp (traitement d'images)`);
  console.log(`  ${ok(gltfTransform)} @gltf-transform (optimisation glTF)`);
  console.log(
    `  Providers PRÊTS        : ${configured.length ? configured.join(", ") : "(aucun)"}`,
  );
  for (const p of providerDetails) {
    console.log(
      `    - ${p.name} : ${p.status} (CLI ${p.cliInstalled ? "installé" : "absent"}, ` +
        `${p.authenticated ? "authentifié" : "non authentifié"})`,
    );
  }
  console.log(`  Stratégies runtime     : ${report.runtimeStrategies.join(", ")}`);
  if (notes.length) {
    console.log("\n  Notes :");
    for (const n of notes) console.log(`   - ${n}`);
  }
}

// Version moteur (info, pas d'assertion).
try {
  const v = readFileSync(path.join(ROOT, "src/ace/core/version.ts"), "utf8");
  const m = v.match(/ACE_VERSION = "([^"]+)"/);
  if (m && !asJson) console.log(`\n  ACE v${m[1]}`);
} catch {
  /* non bloquant */
}
