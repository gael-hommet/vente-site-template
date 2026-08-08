import type { AceCostEstimate, AceMediaStrategy, AceProviderPricing } from "./types";

/**
 * ACE 0.2 — Cost guard (pur, testable).
 *
 * Estime le coût AVANT une génération massive. Les tarifs proviennent
 * EXCLUSIVEMENT de `AceProviderPricing` (config utilisateur, source déclarée) —
 * le moteur n'invente jamais un prix. Sans tarif fourni, l'estimation reste
 * nulle avec une note honnête. Trois stratégies de volume (minimale /
 * recommandée / prudente) et un seuil d'alerte au-delà duquel une confirmation
 * humaine est requise.
 */

export interface CostGuardInput {
  strategy: AceMediaStrategy;
  /** Nombre de plans à produire. */
  shotCount: number;
  /** Tarif du provider retenu (ou null si aucun / génération locale gratuite). */
  pricing: AceProviderPricing | null;
  /** Seuil d'alerte (même devise que le pricing). Défaut : 50. */
  alertThreshold?: number;
}

/** Sorties par plan selon la stratégie de volume. */
const OUTPUTS_PER_SHOT = {
  minimal: 1, // une génération par plan
  recommended: 2, // + une variante pour le choix
  cautious: 3, // + une itération de correction
} as const;

export function estimateCost(input: CostGuardInput): AceCostEstimate {
  const { strategy, shotCount, pricing, alertThreshold = 50 } = input;
  const shots = Math.max(0, Math.floor(shotCount));

  const minimalOutputs = shots * OUTPUTS_PER_SHOT.minimal;
  const recommendedOutputs = shots * OUTPUTS_PER_SHOT.recommended;
  const cautiousOutputs = shots * OUTPUTS_PER_SHOT.cautious;

  // Génération locale (ffmpeg/sharp) ou aucune stratégie payante : coût nul.
  const isLocalOnly =
    !pricing ||
    strategy === "image-sequence" ||
    strategy === "2.5d" ||
    strategy === "editorial-fallback";

  if (isLocalOnly) {
    return {
      provider: pricing?.provider ?? null,
      currency: pricing?.currency ?? "—",
      minimalOutputs,
      recommendedOutputs,
      cautiousOutputs,
      minimalCost: 0,
      recommendedCost: 0,
      cautiousCost: 0,
      alertThreshold,
      exceedsThreshold: false,
      note: pricing
        ? "Stratégie assemblée localement (ffmpeg/sharp) : aucun coût de génération."
        : "Aucun tarif fourni : coût de génération non chiffré (0). Fournir AceProviderPricing pour estimer.",
    };
  }

  const round = (n: number) => Number(n.toFixed(2));
  const minimalCost = round(minimalOutputs * pricing.unitCost);
  const recommendedCost = round(recommendedOutputs * pricing.unitCost);
  const cautiousCost = round(cautiousOutputs * pricing.unitCost);

  return {
    provider: pricing.provider,
    currency: pricing.currency,
    minimalOutputs,
    recommendedOutputs,
    cautiousOutputs,
    minimalCost,
    recommendedCost,
    cautiousCost,
    alertThreshold,
    exceedsThreshold: recommendedCost > alertThreshold,
    note:
      `Tarif ${pricing.unitCost} ${pricing.currency}/sortie (source : ${pricing.source}). ` +
      (recommendedCost > alertThreshold
        ? "⚠ La stratégie recommandée dépasse le seuil d'alerte : confirmation requise."
        : "Sous le seuil d'alerte."),
  };
}
