/**
 * ace:media:plan — construit un PLAN MÉDIA typé à partir d'un brief JSON.
 *
 * Exécuté via `pnpm exec tsx` (résout l'alias @/). Importe le media-engine (LA
 * source de vérité) : décision de stratégie (avec doctrine anti-low-poly),
 * storyboard, coût, risques, références à verrouiller. Ne duplique aucune
 * logique. Ne génère rien — il planifie.
 *
 * Usage :
 *   pnpm exec tsx scripts/ace/media/plan.ts <brief.json>
 *   pnpm exec tsx scripts/ace/media/plan.ts --demo
 *
 * Le brief JSON suit `MediaBriefInput` (intent, qualityBar, emotionalGoal,
 * assets, constraints, subject, pricing?). ACE ne génère aucun média :
 * la stratégie ne dépend que du matériau RÉEL déclaré dans `assets`.
 */
import { readFileSync } from "node:fs";
import { buildMediaPlan, type MediaBriefInput } from "@/ace/media-engine";

function demoBrief(): MediaBriefInput {
  return {
    intent: "room-tour",
    qualityBar: "photoreal",
    emotionalGoal: "faire ressentir l'espace et la lumière du lieu",
    assets: {
      continuousVideo: false,
      frameSequence: false,
      stillImages: false,
      realModel3d: false,
      depthMaps: false,
    },
    constraints: { minTier: "BALANCED", reducedMotionSafe: true, mobilePremium: true },
    subject: "le lieu à présenter",
  };
}

function main() {
  const arg = process.argv[2];
  let brief: MediaBriefInput;

  if (!arg || arg === "--demo") {
    brief = demoBrief();
  } else {
    try {
      brief = JSON.parse(readFileSync(arg, "utf8")) as MediaBriefInput;
    } catch (e) {
      console.error(`✗ brief illisible (${arg}) : ${e instanceof Error ? e.message : String(e)}`);
      process.exit(2);
      return;
    }
  }

  const plan = buildMediaPlan(brief);
  console.log(JSON.stringify(plan, null, 2));

  // Code de sortie explicite si un asset/provider manque (utile en CI).
  if (plan.decision.blocker) {
    console.error(`\n▸ ${plan.decision.blocker} — ${plan.decision.rationale}`);
    process.exit(1);
  }
}

main();
