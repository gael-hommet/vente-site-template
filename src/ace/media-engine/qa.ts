import type { AceContinuityReport, AceMediaQaReport, AceMediaQaScores, AceShotPlan } from "./types";

/**
 * ACE 0.2 — Media QA & continuity.
 *
 * HONNÊTETÉ : évaluer visuellement un rendu IA (déformations, artefacts, « trop
 * IA », raccords) n'est PAS résoluble automatiquement sans modèle de vision.
 * Cette couche fournit :
 *   1) un CADRE de scoring structuré (continuité / réalisme / narration /
 *      intégrabilité / valeur perçue) rempli par une revue humaine ou un futur
 *      juge de vision ;
 *   2) des HEURISTIQUES sur les métadonnées du plan (durée, raccords déclarés,
 *      refs manquantes) qui, elles, sont vérifiables ici.
 * Le rapport porte toujours `requiresHumanReview: true`. Aucun « ✓ vendable »
 * n'est jamais accordé automatiquement à partir de pixels non inspectés.
 */

/** Poids de la moyenne pondérée (la valeur perçue prime, puis la continuité). */
const WEIGHTS: Record<keyof AceMediaQaScores, number> = {
  perceivedValue: 3,
  continuity: 3,
  realism: 2,
  integrability: 2,
  narration: 1,
};

/** Seuil d'acceptation : sous ce score global, le plan est rejeté (non vendable). */
export const QA_ACCEPT_THRESHOLD = 0.7;

function weightedOverall(scores: AceMediaQaScores): number {
  let num = 0;
  let den = 0;
  (Object.keys(WEIGHTS) as (keyof AceMediaQaScores)[]).forEach((k) => {
    num += WEIGHTS[k] * scores[k];
    den += WEIGHTS[k];
  });
  return Number((num / den).toFixed(3));
}

/** Heuristiques vérifiables sur la structure du plan (pas sur les pixels). */
export function structuralIssues(shot: AceShotPlan): string[] {
  const issues: string[] = [];
  if (shot.durationS <= 0) issues.push("Durée cible non définie (<= 0).");
  if (shot.durationS > 12)
    issues.push("Plan très long (>12 s) : risque de dérive de continuité IA.");
  if (!shot.focusPoint.trim()) issues.push("Point d'attention absent (composition floue).");
  if (shot.refIn === null && shot.narrativeRole.toLowerCase().includes("raccord")) {
    issues.push("Plan de raccord sans référence amont (refIn).");
  }
  return issues;
}

/**
 * Assemble un rapport QA à partir de scores (revue) + heuristiques structurelles.
 * `scores` par défaut = tout à 0 (rien n'est validé sans revue explicite).
 */
export function assessMedia(
  shot: AceShotPlan,
  scores: AceMediaQaScores = {
    continuity: 0,
    realism: 0,
    narration: 0,
    integrability: 0,
    perceivedValue: 0,
  },
): AceMediaQaReport {
  const overall = weightedOverall(scores);
  const issues = structuralIssues(shot);
  return {
    shotId: shot.id,
    scores,
    overall,
    accepted: overall >= QA_ACCEPT_THRESHOLD && issues.length === 0,
    issues,
    requiresHumanReview: true,
  };
}

/**
 * Continuité entre deux plans. `perceptualScore` (0..1) vient d'une revue ou
 * d'un futur juge de vision ; les ruptures STRUCTURELLES (refs manquantes) sont
 * détectées ici.
 */
export function assessContinuity(
  from: AceShotPlan,
  to: AceShotPlan,
  perceptualScore = 0,
): AceContinuityReport {
  const breaks: string[] = [];
  if (from.refOut === null) breaks.push(`Plan "${from.id}" sans référence de sortie (refOut).`);
  if (to.refIn === null) breaks.push(`Plan "${to.id}" sans référence d'entrée (refIn).`);
  if (from.refOut && to.refIn && from.refOut !== to.refIn) {
    breaks.push(
      `Raccord incohérent : refOut de "${from.id}" (${from.refOut}) ≠ refIn de "${to.id}" (${to.refIn}).`,
    );
  }
  const structuralPenalty = Math.min(0.5, breaks.length * 0.25);
  const continuityScore = Number(Math.max(0, perceptualScore - structuralPenalty).toFixed(3));
  return {
    fromShot: from.id,
    toShot: to.id,
    continuityScore,
    breaks,
    acceptable: continuityScore >= QA_ACCEPT_THRESHOLD && breaks.length === 0,
  };
}
