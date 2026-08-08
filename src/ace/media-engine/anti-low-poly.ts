import type { AceAvailableAssets, AceMediaStrategy, AceQualityBar } from "./types";

/**
 * ACE 0.2 — DOCTRINE ANTI-LOW-POLY (règle moteur non négociable).
 *
 * Quand le besoin visuel est photoréaliste ou architectural haut de gamme, ACE
 * n'a JAMAIS le droit de produire une substitution low-poly procédurale (cubes,
 * cônes, montagnes triangulaires, primitive « produit ») comme SORTIE
 * PRINCIPALE. Il doit :
 *   - produire le bon média (provider/assets réels), OU
 *   - déclarer honnêtement qu'un asset externe est requis (MEDIA_ASSET_REQUIRED
 *     / PROVIDER_NOT_CONFIGURED), OU
 *   - utiliser un fallback ÉDITORIAL premium explicite.
 * Jamais dégrader silencieusement l'ambition.
 *
 * Ce module fournit la garde utilisée par la strategy layer (et testée).
 */

/** Barres de qualité qui INTERDISENT une substitution procédurale primitive. */
const HIGH_BAR: readonly AceQualityBar[] = ["photoreal", "stylized-premium"];

export interface LowPolyVerdict {
  /** true si l'usage de WebGL procédural violerait la doctrine. */
  wouldViolate: boolean;
  reason: string;
}

/**
 * Une stratégie `webgl` n'est légitime pour une barre haute QUE si un VRAI
 * modèle 3D (glTF) est disponible — jamais avec des primitives. Sans modèle
 * réel, retomber sur WebGL procédural pour un besoin photoréaliste viole la
 * doctrine.
 */
export function evaluateLowPolyRisk(
  strategy: AceMediaStrategy,
  qualityBar: AceQualityBar,
  assets: AceAvailableAssets,
): LowPolyVerdict {
  if (strategy !== "webgl") {
    return { wouldViolate: false, reason: "Stratégie non-WebGL : pas de risque de primitive." };
  }
  if (!HIGH_BAR.includes(qualityBar)) {
    return {
      wouldViolate: false,
      reason: `Barre "${qualityBar}" : un rendu WebGL graphique/éditorial est assumé, pas une substitution cheap.`,
    };
  }
  if (assets.realModel3d) {
    return {
      wouldViolate: false,
      reason: "WebGL avec un VRAI modèle 3D (glTF) : conforme à la barre haute.",
    };
  }
  return {
    wouldViolate: true,
    reason:
      `Barre "${qualityBar}" sans modèle 3D réel : un WebGL procédural (primitives) serait une ` +
      "substitution low-poly interdite. Fournir un modèle/média réel, générer via un provider, " +
      "ou utiliser un fallback éditorial premium.",
  };
}

/**
 * Garde stricte : lève une erreur si la combinaison viole la doctrine. À
 * utiliser aux frontières où une sortie serait réellement produite.
 */
export function assertNoLowPolySubstitution(
  strategy: AceMediaStrategy,
  qualityBar: AceQualityBar,
  assets: AceAvailableAssets,
): void {
  const verdict = evaluateLowPolyRisk(strategy, qualityBar, assets);
  if (verdict.wouldViolate) {
    throw new Error(`[ACE anti-low-poly] ${verdict.reason}`);
  }
}
