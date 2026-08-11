#!/usr/bin/env tsx
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { chooseSpatialMode } from "../../../src/ace/spatial-cinema/strategy";
import { validateTimeline, distributeScenes } from "../../../src/ace/spatial-cinema/timeline";
import { sceneOrigins, worstCaseFraming } from "../../../src/ace/spatial-cinema/layout";
import { cameraAt } from "../../../src/ace/spatial-cinema/camera-path";
import { SPATIAL_FIXTURE } from "../../../src/ace/spatial-cinema/fixture";
import type { SpatialManifest } from "../../../src/ace/spatial-cinema/types";

/**
 * ACE SPATIAL — plan.
 *
 * Lit un manifeste et raconte, SANS lancer le site, ce que le voyage fera :
 * quelle stratégie, quelles scènes, quel trajet de caméra, quels raccords.
 *
 *   pnpm ace:spatial:plan                    → la fixture interne
 *   pnpm ace:spatial:plan --file <manifest>  → un manifeste de site
 */

function loadManifest(): { manifest: SpatialManifest; source: string } {
  const i = process.argv.indexOf("--file");
  if (i === -1) return { manifest: SPATIAL_FIXTURE, source: "fixture interne" };
  const file = process.argv[i + 1];
  if (!file || !existsSync(file)) {
    console.error(`Manifeste introuvable : ${String(file)}`);
    process.exit(2);
  }
  return {
    manifest: JSON.parse(readFileSync(file, "utf8")) as SpatialManifest,
    source: path.relative(process.cwd(), file),
  };
}

const { manifest, source } = loadManifest();

console.log(`\nACE SPATIAL CINEMA — plan (${source})\n`);

// 1. Quelle stratégie l'assemblage justifie-t-il ?
const decision = chooseSpatialMode({
  imageCount: manifest.scenes.length,
  depthMapCount: manifest.scenes.filter((s) => s.depthMap).length,
  hasRealModel3d: false,
  overlappingViews: false,
});
console.log(`  Stratégie retenue : ${decision.mode}`);
console.log(`  Raison            : ${decision.rationale}`);
if (decision.caveats.length > 0) {
  for (const c of decision.caveats) console.log(`  ⚠ ${c}`);
}

// 2. Le déroulé, scène par scène.
const origins = sceneOrigins(manifest);
console.log(
  `\n  Voyage : ${String(manifest.scenes.length)} scène(s), ${String(manifest.length ?? 0)} écrans de scroll\n`,
);
manifest.scenes.forEach((scene, i) => {
  const from = cameraAt(scene.camera, 0);
  const to = cameraAt(scene.camera, 1);
  const travel = Math.hypot(
    to.position.x - from.position.x,
    to.position.y - from.position.y,
    to.position.z - from.position.z,
  );
  const framing = worstCaseFraming(scene);
  console.log(
    `  ${String(i + 1)}. ${scene.id}  [${scene.start.toFixed(2)} → ${scene.end.toFixed(2)}]`,
  );
  console.log(
    `     mouvement   : ${scene.camera.move ?? "sur mesure"} — ${travel.toFixed(2)} unité(s)`,
  );
  console.log(
    `     focale      : ${String(scene.camera.fovFrom)}° → ${String(scene.camera.fovTo)}°`,
  );
  console.log(
    `     profondeur  : relief ${String(scene.depth.strength)}${scene.depthMap ? "" : "  ⚠ AUCUNE CARTE"}`,
  );
  console.log(
    `     implantation: z = ${(origins[i] ?? 0).toFixed(2)} · cadrage le plus large à ${framing.distance.toFixed(2)}`,
  );
  if (scene.transitionOut) {
    console.log(
      `     raccord     : ${scene.transitionOut.type} (${String(scene.transitionOut.duration)})`,
    );
  } else if (i < manifest.scenes.length - 1) {
    console.log(`     raccord     : ⚠ ABSENT — coupe franche`);
  }
});

// 3. Cohérence de la timeline.
const issues = validateTimeline(manifest);
if (issues.length === 0) {
  console.log(
    `\n  Timeline cohérente. Découpage régulier suggéré : ${JSON.stringify(distributeScenes(manifest.scenes.length).map((s) => [Number(s.start.toFixed(2)), Number(s.end.toFixed(2))]))}\n`,
  );
} else {
  console.log(`\n  ${String(issues.length)} problème(s) de timeline :`);
  for (const it of issues) console.log(`   ✘ ${it.scene} : ${it.message}`);
  console.log("");
  process.exit(1);
}
