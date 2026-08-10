#!/usr/bin/env node
/**
 * ace:media:report — rapport média consolidé et HONNÊTE.
 *
 * Combine : capacités locales (ffmpeg/ffprobe/sharp/gltf), stratégies runtime,
 * et ce qu'ACE peut / ne peut PAS faire ici. Point d'entrée « où en est-on ? ».
 * Ne prétend aucune capacité non installée. Aucun service payant n'intervient.
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

const ok = (b) => (b ? "disponible ✓" : "ABSENT ✗");

console.log("═══════════════════════════════════════════════");
console.log(" ACE — Rapport média consolidé");
console.log("═══════════════════════════════════════════════\n");

console.log("Traitement local (assemblage / QA / frames / optimisation) :");
console.log(`  ffmpeg          : ${ok(cap.ffmpeg)}`);
console.log(`  ffprobe         : ${ok(cap.ffprobe)}`);
console.log(`  sharp           : ${ok(cap.sharp)}`);
console.log(`  @gltf-transform : ${ok(cap.gltfTransform)}\n`);

console.log("Génération d'images / vidéos :");
console.log("  Aucun service de génération n'est utilisé — coût média 0 €.");
console.log("  Les visuels viennent du réel : fournis, officiels, ou apportés par vous.\n");

console.log("\nStratégies d'expérience disponibles (runtime) :");
console.log(`  ${(cap.runtimeStrategies ?? []).join(", ")}`);

console.log("\nCe qu'ACE peut faire ICI, maintenant :");
console.log("  ✓ Décider la stratégie média (anti-low-poly appliqué)");
console.log("  ✓ Planifier plans/storyboard, verrouiller l'identité du sujet");
console.log("  ✓ Importer et valider des visuels officiels (provenance + droits)");
if (cap.ffprobe) console.log("  ✓ Contrôler techniquement un média (ffprobe réel)");
if (cap.ffmpeg) {
  console.log("  ✓ Extraire des frames, assembler un master, optimiser desktop/mobile");
}
console.log("  ✓ Appliquer le premium output gate (aucun repli déguisé en premium)");
console.log("  ✓ Intégrer un média en scroll-cinéma (CinematicScroll)");

console.log("\nCe qu'ACE NE fait PAS :");
console.log("  ✗ Générer une image ou une vidéo (par choix : coût média 0 €)");
console.log("  ✗ Inventer un média premium à partir de rien (→ MEDIA_ASSET_REQUIRED)");
console.log("  ✗ Substituer un besoin photoréaliste par une 3D low-poly (interdit)");
console.log("  ✗ Juger seul la qualité VISUELLE d'un rendu (→ REVIEW_REQUIRED)");

if ((cap.notes ?? []).length) {
  console.log("\nNotes :");
  for (const n of cap.notes) console.log(`  - ${n}`);
}

console.log("\nCommandes disponibles :");
console.log("  pnpm ace:media:capabilities          # audit de l'environnement");
console.log("  pnpm ace:media:plan <brief.json>     # décision + storyboard");
console.log("  pnpm ace:media:qa --manifest <f>     # QA technique réelle (ffprobe)");
console.log("  pnpm ace:media:assemble <in...> --out <d>");
console.log("  pnpm ace:media:optimize <master> --out <d>");
console.log("  pnpm ace:media:frames <video> --out <d>");
