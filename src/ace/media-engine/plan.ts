import type {
  AceAvailableAssets,
  AceMediaConstraints,
  AceMediaIntent,
  AceMediaPlan,
  AceQualityBar,
} from "./types";
import { chooseStrategy } from "./strategy";
import { buildShotPlan } from "./shot-planner";

/**
 * ACE 0.2 — Media plan builder (pur, testable).
 *
 * Assemble un plan média complet à partir d'un brief structuré : décision de
 * stratégie (avec doctrine anti-low-poly), storyboard, coût estimé, risques,
 * références à verrouiller, sortie attendue. Aucun fait client inventé ; les
 * coûts viennent d'un tarif fourni (sinon non chiffrés).
 */

export interface MediaBriefInput {
  intent: AceMediaIntent;
  qualityBar: AceQualityBar;
  emotionalGoal: string;
  assets: AceAvailableAssets;
  constraints: AceMediaConstraints;
  /** Sujet à garder cohérent entre les plans (identité visuelle). */
  subject?: string;
}

const EXPECTED_OUTPUT: Record<string, string> = {
  webgl: "scène glTF compressée + poster de fallback + budgets par tier",
  "video-scroll": "mp4 + webm + poster + version mobile allégée",
  "image-sequence": "séquence webp optimisée + poster de fallback",
  "2.5d": "images premium + depth maps + fallback statique",
  "editorial-fallback": "poster/composition typographique premium (aucune 3D cheap)",
};

export function buildMediaPlan(input: MediaBriefInput): AceMediaPlan {
  const { intent, qualityBar, emotionalGoal, assets, constraints } = input;

  const decision = chooseStrategy({ intent, qualityBar, assets, constraints });
  const shots = buildShotPlan(intent, decision.strategy);

  const referenceLocks: string[] = [];
  if (input.subject) {
    referenceLocks.push(
      `Verrouiller l'identité de « ${input.subject} » (structure, palette, matériaux, ambiance, heure) sur tous les plans.`,
    );
  }

  const risks: string[] = [];
  if (decision.blocker === "MEDIA_ASSET_REQUIRED") {
    risks.push(
      "Aucun média réel exploitable : un visuel doit être fourni (ACE n'en fabrique pas).",
    );
  }
  if (qualityBar === "photoreal" && decision.strategy === "webgl") {
    risks.push(
      "Photoréalisme en WebGL temps réel : valider que le rendu tient la barre (sinon video-scroll).",
    );
  }

  return {
    intent,
    qualityBar,
    emotionalGoal,
    decision,
    shots,
    referenceLocks,
    risks,
    expectedOutput: EXPECTED_OUTPUT[decision.strategy] ?? "sortie à définir",
  };
}
