import type {
  AceAvailableAssets,
  AceMediaConstraints,
  AceMediaIntent,
  AceMediaPlan,
  AceProviderPricing,
  AceQualityBar,
} from "./types";
import { chooseStrategy } from "./strategy";
import { buildShotPlan } from "./shot-planner";
import { estimateCost } from "./cost";

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
  configuredProviders: string[];
  constraints: AceMediaConstraints;
  /** Tarif du provider retenu (config) — sinon coût non chiffré. */
  pricing?: AceProviderPricing | null;
  /** Sujet à garder cohérent entre les plans (identité visuelle). */
  subject?: string;
}

const EXPECTED_OUTPUT: Record<string, string> = {
  webgl: "scène glTF compressée + poster de fallback + budgets par tier",
  "video-scroll": "mp4 + webm + poster + version mobile allégée",
  "image-sequence": "séquence webp optimisée + poster de fallback",
  "2.5d": "images premium + depth maps + fallback statique",
  hybrid: "médias générés (références → vidéo/frames) assemblés + fallback",
  "editorial-fallback": "poster/composition typographique premium (aucune 3D cheap)",
};

export function buildMediaPlan(input: MediaBriefInput): AceMediaPlan {
  const { intent, qualityBar, emotionalGoal, assets, configuredProviders, constraints } = input;

  const decision = chooseStrategy({ intent, qualityBar, assets, configuredProviders, constraints });
  const shots = buildShotPlan(intent, decision.strategy);

  const cost = estimateCost({
    strategy: decision.strategy,
    shotCount: shots.length,
    pricing: input.pricing ?? null,
  });

  const referenceLocks: string[] = [];
  if (input.subject) {
    referenceLocks.push(
      `Verrouiller l'identité de « ${input.subject} » (structure, palette, matériaux, ambiance, heure) sur tous les plans.`,
    );
  }

  const risks: string[] = [];
  if (decision.blocker === "PROVIDER_NOT_CONFIGURED") {
    risks.push("Aucun provider de génération configuré : média externe requis (voir setup).");
  }
  if (decision.blocker === "MEDIA_ASSET_REQUIRED") {
    risks.push("Aucun asset exploitable : fournir un média premium avant génération.");
  }
  if (qualityBar === "photoreal" && decision.strategy === "webgl") {
    risks.push(
      "Photoréalisme en WebGL temps réel : valider que le rendu tient la barre (sinon video-scroll).",
    );
  }
  if (decision.strategy === "hybrid") {
    risks.push(
      "Génération IA : surveiller la continuité inter-plans et les artefacts (QA + revue humaine).",
    );
  }
  if (cost.exceedsThreshold) {
    risks.push("Coût de génération au-dessus du seuil d'alerte : confirmer avant lot massif.");
  }

  return {
    intent,
    qualityBar,
    emotionalGoal,
    decision,
    candidateProviders: configuredProviders,
    shots,
    referenceLocks,
    risks,
    cost,
    expectedOutput: EXPECTED_OUTPUT[decision.strategy] ?? "sortie à définir",
  };
}
