#!/usr/bin/env node
/**
 * ace:media:report — rapport média consolidé et HONNÊTE.
 *
 * Combine : capacités locales (ffmpeg/sharp/gltf), statut des providers de
 * génération, stratégies runtime disponibles, et ce qu'ACE peut / ne peut PAS
 * faire ici. Sert de point d'entrée « où en est-on ? » avant de planifier ou de
 * générer. Ne prétend aucune capacité non installée.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

function runJson(script) {
  const res = spawnSync("node", [path.join(HERE, script), "--json"], { encoding: "utf8" });
  try {
    return JSON.parse(res.stdout);
  } catch {
    return null;
  }
}

const cap = runJson("capabilities.mjs");
if (!cap) {
  console.error("✗ impossible de lire les capacités (capabilities.mjs).");
  process.exit(2);
}

console.log("═══════════════════════════════════════════════");
console.log(" ACE 0.2 — Rapport média consolidé");
console.log("═══════════════════════════════════════════════\n");

console.log("Traitement local (assemblage / frames / optimisation) :");
console.log(`  ffmpeg          : ${cap.ffmpeg ? "disponible ✓" : "ABSENT ✗"}`);
console.log(`  sharp           : ${cap.sharp ? "disponible ✓" : "ABSENT ✗"}`);
console.log(`  @gltf-transform : ${cap.gltfTransform ? "disponible ✓" : "ABSENT ✗"}\n`);

console.log("Génération IA (images / vidéos) :");
if (cap.configuredProviders.length) {
  console.log(`  Providers PRÊTS : ${cap.configuredProviders.join(", ")} ✓`);
} else {
  console.log("  Aucun provider configuré ✗");
}
if (cap.unconfiguredProviders.length) {
  console.log(`  Non configurés  : ${cap.unconfiguredProviders.join(", ")}`);
}

console.log("\nStratégies d'expérience disponibles (runtime) :");
console.log(`  ${cap.runtimeStrategies.join(", ")}`);

console.log("\nCe qu'ACE peut faire ICI, maintenant :");
console.log("  ✓ Décider la stratégie média (anti-low-poly appliqué)");
console.log("  ✓ Planifier plans/storyboard + estimer le coût");
console.log("  ✓ Contrôler la QA structurelle + la continuité");
if (cap.ffmpeg) console.log("  ✓ Assembler / extraire des frames / optimiser (ffmpeg réel)");
console.log("  ✓ Intégrer un média en scroll-cinéma (CinematicScroll)");

console.log("\nCe qu'ACE NE peut PAS faire sans configuration/asset :");
if (!cap.configuredProviders.length)
  console.log("  ✗ Générer des images/vidéos IA (aucun provider configuré)");
console.log("  ✗ Inventer un média premium à partir de rien (→ MEDIA_ASSET_REQUIRED)");
console.log("  ✗ Substituer un besoin photoréaliste par une 3D low-poly (interdit par doctrine)");

if (cap.notes.length) {
  console.log("\nNotes :");
  for (const n of cap.notes) console.log(`  - ${n}`);
}

console.log("\nProchaines étapes suggérées :");
console.log("  pnpm ace:media:plan <brief.json>     # planifier une expérience");
console.log("  pnpm ace:provider:check              # statut des providers");
console.log("  pnpm ace:media:frames <video> --out  # extraire des frames (ffmpeg)");
