#!/usr/bin/env tsx
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { assessSpatialQuality } from "../../../src/ace/spatial-cinema/spatial-quality";
import { SPATIAL_FIXTURE } from "../../../src/ace/spatial-cinema/fixture";
import type { SpatialManifest } from "../../../src/ace/spatial-cinema/types";

/**
 * ACE SPATIAL — verify (Spatial Quality Gate).
 *
 * Refuse ce qui serait un diaporama déguisé. Ce contrôle est MESURABLE : il ne
 * juge pas le goût, il vérifie des faits (caméra qui bouge, relief non nul,
 * raccords spatiaux, continuité, timeline).
 *
 * Il ne peut PAS conclure seul à PASS : personne n'a encore regardé le rendu.
 * Le verdict maximal atteignable en ligne de commande est REVIEW_REQUIRED.
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
const report = assessSpatialQuality(manifest);

console.log(`\nACE SPATIAL — contrôle qualité (${source})\n`);

for (const m of report.measured) console.log(`  ✔ ${m}`);

if (report.issues.length > 0) {
  console.log("");
  for (const issue of report.issues) {
    console.log(`  ✘ [${issue.violation}] ${issue.scene} : ${issue.message}`);
  }
}

console.log(`\n  Verdict : ${report.verdict}`);
if (report.requiresVisualReview) {
  console.log(
    "  Une revue visuelle réelle reste obligatoire : capturez la page et\n" +
      "  REGARDEZ-la avant de conclure. Aucun PASS ne s'obtient sans cela.",
  );
}
console.log("");

process.exit(report.verdict === "REJECT" ? 1 : 0);
