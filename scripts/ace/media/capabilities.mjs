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

/** Providers connus + variable d'env requise (miroir de config.ts, sans importer TS). */
const KNOWN_PROVIDERS = [{ name: "higgsfield", requiredEnv: "HIGGSFIELD_API_KEY" }];

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
const sharp = hasPackage("sharp");
const gltfTransform = hasPackage("@gltf-transform/cli") || hasPackage("@gltf-transform/functions");

const configured = KNOWN_PROVIDERS.filter(
  (p) => (process.env[p.requiredEnv] ?? "").trim().length > 0,
).map((p) => p.name);
const unconfigured = KNOWN_PROVIDERS.filter((p) => !configured.includes(p.name)).map((p) => p.name);

const notes = [];
if (!ffmpeg) notes.push("ffmpeg absent : assemblage/extraction de frames indisponibles.");
if (unconfigured.length)
  notes.push(
    `Providers de génération NON configurés : ${unconfigured.join(", ")} → PROVIDER_NOT_CONFIGURED. Voir docs/ACE-HIGGSFIELD-SETUP.md.`,
  );
if (!configured.length)
  notes.push(
    "Aucun provider de génération IA configuré : ACE ne peut pas générer d'images/vidéos ici. Il DÉCIDE, PLANIFIE et ASSEMBLE ; la génération requiert un provider (ou un asset fourni).",
  );

const report = {
  ffmpeg,
  sharp,
  gltfTransform,
  configuredProviders: configured,
  unconfiguredProviders: unconfigured,
  runtimeStrategies: runtimeStrategies(),
  notes,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const ok = (b) => (b ? "✓" : "✗");
  console.log("ACE 0.2 — Capacités média réelles\n");
  console.log(`  ${ok(ffmpeg)} ffmpeg (assemblage/frames)`);
  console.log(`  ${ok(sharp)} sharp (traitement d'images)`);
  console.log(`  ${ok(gltfTransform)} @gltf-transform (optimisation glTF)`);
  console.log(
    `  Providers configurés   : ${configured.length ? configured.join(", ") : "(aucun)"}`,
  );
  console.log(`  Providers non configurés : ${unconfigured.join(", ") || "(aucun)"}`);
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
