#!/usr/bin/env node
/**
 * ace:media:capabilities — audit HONNÊTE des capacités média réellement
 * disponibles ICI (pas des capacités théoriques).
 *
 * Vérifie : binaires (ffmpeg, ffprobe), packages (sharp, @gltf-transform) et
 * techniques runtime présentes (composants scroll-cinéma).
 *
 * ACE ne génère AUCUN média via un service payant : il n'y a donc aucun
 * « provider » à vérifier. Coût média = 0 €.
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

const notes = [];
if (!ffmpeg) notes.push("ffmpeg absent : assemblage/extraction de frames indisponibles.");
if (!ffprobe) notes.push("ffprobe absent : QA technique réelle indisponible.");

const report = {
  ffmpeg,
  ffprobe,
  sharp,
  gltfTransform,
  runtimeStrategies: runtimeStrategies(),
  notes,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const ok = (b) => (b ? "✓" : "✗");
  console.log("ACE — Capacités média réelles\n");
  console.log(`  ${ok(ffmpeg)} ffmpeg (assemblage/frames)`);
  console.log(`  ${ok(ffprobe)} ffprobe (QA technique réelle)`);
  console.log(`  ${ok(sharp)} sharp (traitement d'images)`);
  console.log(`  ${ok(gltfTransform)} @gltf-transform (optimisation glTF)`);
  console.log(`  Stratégies runtime     : ${report.runtimeStrategies.join(", ")}`);
  console.log("");
  console.log("  Aucun service de génération n'est requis : ACE travaille à partir");
  console.log("  des médias réels (coût média 0 €).");
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
