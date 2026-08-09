/**
 * ace:media:qa — QA MÉDIA RÉELLE (technique + cadre de revue).
 *
 * Exécuté via `pnpm exec tsx` (résout l'alias @/). Inspecte de VRAIS fichiers
 * avec ffprobe : existence, intégrité, dimensions, durée, fps, codec, poids,
 * audio. Vérifie aussi la cohérence d'un manifeste (sorties déclarées présentes,
 * raccords, verrou de référence) quand un manifeste est fourni.
 *
 * Usage :
 *   pnpm ace:media:qa --manifest <manifest.json>
 *   pnpm ace:media:qa <fichier...> [--min-width N] [--max-weight-kb N]
 *                                  [--expect-duration S] [--min-fps N]
 *   [--json]
 *
 * Verdicts : PASS · REVIEW_REQUIRED · REJECT.
 * REVIEW_REQUIRED est une sortie VALIDE : ACE ne tranche pas ce qu'il n'a pas
 * regardé. Aucune QA visuelle n'est simulée ici (voir --json + art-direction).
 *
 * Sortie : 0 si aucun REJECT · 1 si au moins un REJECT · 2 si erreur d'usage.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  assessTechnical,
  type TechnicalExpectations,
  type TechnicalQaReport,
} from "@/ace/media-engine/node/technical-qa";
import { reviewArtDirection } from "@/ace/media-engine";
import type { AceMediaManifest } from "@/ace/media-engine";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const opt = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const numOpt = (flag: string): number | undefined => {
  const v = opt(flag);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const die = (msg: string, code = 2): never => {
  console.error(`✗ ${msg}`);
  process.exit(code);
};

const expectations: TechnicalExpectations = {
  minWidth: numOpt("--min-width"),
  minHeight: numOpt("--min-height"),
  expectedDurationS: numOpt("--expect-duration"),
  minFps: numOpt("--min-fps"),
  maxWeightKb: numOpt("--max-weight-kb"),
  // Le scroll-cinéma est muet par défaut : une piste audio est signalée.
  expectAudio: args.includes("--expect-audio") ? true : false,
};

interface Inspected {
  file: string;
  shot?: string;
  report: TechnicalQaReport;
  artVerdict: string;
  requiresHumanReview: boolean;
}

function inspect(file: string, shot?: string): Inspected {
  const report = assessTechnical(file, expectations);
  // Sans scores de revue, la direction artistique renvoie REVIEW_REQUIRED :
  // aucun média n'est promu « vendable » sans avoir été regardé.
  const art = reviewArtDirection({
    shotId: shot ?? path.basename(file),
    qualityBar: "photoreal",
    technicalVerdict: report.verdict,
  });
  return {
    file,
    shot,
    report,
    artVerdict: art.verdict,
    requiresHumanReview: art.requiresHumanReview,
  };
}

/* -------------------------------------------------------------------------- */
/* Entrées : manifeste ou fichiers                                            */
/* -------------------------------------------------------------------------- */
const manifestPath = opt("--manifest");
const targets: { file: string; shot?: string }[] = [];
const manifestIssues: string[] = [];

if (manifestPath) {
  if (!existsSync(manifestPath)) die(`manifeste introuvable : ${manifestPath}`);
  let manifest: AceMediaManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as AceMediaManifest;
  } catch (e) {
    die(`manifeste illisible : ${e instanceof Error ? e.message : String(e)}`);
    throw e; // inatteignable (die exit) — satisfait le typage
  }
  const entries = manifest.entries ?? [];
  if (entries.length === 0) manifestIssues.push("Manifeste sans aucune entrée.");
  for (const entry of entries) {
    if (!entry.output) {
      manifestIssues.push(
        `Plan « ${entry.shot} » : aucune sortie retenue (approved=${String(entry.approved)}).`,
      );
      continue;
    }
    if (entry.approved && !existsSync(entry.output)) {
      manifestIssues.push(
        `Plan « ${entry.shot} » : sortie déclarée APPROUVÉE mais absente du disque (${entry.output}).`,
      );
    }
    targets.push({ file: entry.output, shot: entry.shot });
  }
} else {
  for (const a of args) {
    if (a.startsWith("--")) continue;
    // Ignore les valeurs d'options numériques/textuelles.
    const prevIdx = args.indexOf(a) - 1;
    const prev = prevIdx >= 0 ? args[prevIdx] : undefined;
    if (prev?.startsWith("--") && prev !== "--json" && prev !== "--expect-audio") continue;
    targets.push({ file: a });
  }
}

if (targets.length === 0 && manifestIssues.length === 0) {
  die("aucun fichier à contrôler. Usage : ace:media:qa --manifest <f> | <fichier...>");
}

const inspected = targets.map((t) => inspect(t.file, t.shot));
const rejects = inspected.filter((i) => i.report.verdict === "REJECT");
const reviews = inspected.filter((i) => i.report.verdict === "REVIEW_REQUIRED");
const passes = inspected.filter((i) => i.report.verdict === "PASS");

if (asJson) {
  console.log(
    JSON.stringify(
      {
        manifestIssues,
        results: inspected.map((i) => ({
          file: i.file,
          shot: i.shot,
          verdict: i.report.verdict,
          facts: i.report.facts,
          failures: i.report.failures,
          warnings: i.report.warnings,
          artDirectionVerdict: i.artVerdict,
          requiresHumanReview: i.requiresHumanReview,
        })),
        summary: {
          total: inspected.length,
          pass: passes.length,
          reviewRequired: reviews.length,
          reject: rejects.length,
        },
      },
      null,
      2,
    ),
  );
} else {
  console.log("ACE 0.2 — QA média (technique réelle via ffprobe)\n");
  if (manifestIssues.length > 0) {
    console.log("  Cohérence du manifeste :");
    for (const m of manifestIssues) console.log(`   ⚠ ${m}`);
    console.log("");
  }
  for (const i of inspected) {
    const mark = i.report.verdict === "PASS" ? "✓" : i.report.verdict === "REJECT" ? "✗" : "…";
    const f = i.report.facts;
    const dims = f.width && f.height ? `${String(f.width)}×${String(f.height)}` : "—";
    const dur = f.durationS !== undefined ? `${String(f.durationS)}s` : "—";
    const fps = f.fps !== undefined ? `${String(f.fps)}fps` : "—";
    console.log(`  ${mark} ${i.report.verdict.padEnd(15)} ${i.file}`);
    console.log(
      `      ${f.kind} · ${dims} · ${dur} · ${fps} · ${f.videoCodec ?? "—"} · ${(f.bytes / 1024).toFixed(0)} Ko`,
    );
    for (const x of i.report.failures) console.log(`      ✗ ${x}`);
    for (const x of i.report.warnings) console.log(`      ⚠ ${x}`);
  }
  console.log(
    `\n  Bilan : ${String(passes.length)} PASS · ${String(reviews.length)} REVIEW_REQUIRED · ${String(rejects.length)} REJECT`,
  );
  console.log(
    "  Note d'honnêteté : la QA VISUELLE (déformations, artefacts, « trop IA ») n'est pas\n" +
      "  automatisée ici. PASS = feu vert TECHNIQUE, pas une promesse de qualité artistique.",
  );
}

const hardFailure = rejects.length > 0 || manifestIssues.length > 0;
process.exit(hardFailure ? 1 : 0);
