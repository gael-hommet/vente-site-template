/**
 * ACE 0.2 — Choix du MODE DE DIFFUSION au scroll.
 *
 * Deux techniques donnent un scrub cinématique, avec des compromis opposés :
 *
 *  VIDEO_SCROLL    — une vidéo dont on pilote `currentTime`. Poids quasi
 *                    indépendant de la durée, mais la précision du seek dépend
 *                    des keyframes : le scrub peut « coller » sur un GOP long.
 *  IMAGE_SEQUENCE  — N images affichées à la demande. Scrub FRAME-PERFECT et
 *                    instantané, mais le poids croît linéairement avec le
 *                    nombre de frames.
 *
 * La décision se prend sur des CHIFFRES MESURÉS (poids réels, nombre de frames,
 * durée), pas sur une préférence esthétique. Fonction pure et testable.
 */

export type DeliveryMode = "VIDEO_SCROLL" | "IMAGE_SEQUENCE";

export interface DeliveryModeInput {
  durationS: number;
  /** Cadence de scrub visée (souvent plus basse que la source : 8–15 fps suffit). */
  scrubFps: number;
  /** Poids RÉEL du master vidéo web (Ko), mesuré après optimisation. */
  videoWeightKb: number;
  /** Poids moyen RÉEL d'une frame optimisée (Ko), mesuré sur un échantillon. */
  avgFrameWeightKb: number;
  /** Le scrub doit-il être image par image (produit qui tourne, révélation fine) ? */
  framePrecisionRequired: boolean;
  /** Cible mobile / connexion contrainte : le poids prime. */
  mobileConstrained: boolean;
  /** Budget de poids pour ce média (Ko). */
  weightBudgetKb?: number;
}

export interface DeliveryModeDecision {
  mode: DeliveryMode;
  rationale: string;
  frameCount: number;
  /** Poids estimé de la séquence d'images (Ko) = frames × poids moyen. */
  sequenceWeightKb: number;
  videoWeightKb: number;
  /** Stratégie de préchargement recommandée pour le mode retenu. */
  preload: "poster-then-full" | "progressive-batches";
  /** Réserves à connaître (jamais masquées). */
  caveats: string[];
}

/** Au-delà, une séquence d'images devient déraisonnable sur le web. */
export const SEQUENCE_MAX_WEIGHT_KB = 6000;
/** Au-delà, le nombre de requêtes/décodages devient pénalisant. */
export const SEQUENCE_MAX_FRAMES = 180;

/**
 * Choisit le mode. Règle directrice : la séquence d'images n'est retenue que si
 * elle apporte quelque chose (précision) ET reste raisonnable en poids ;
 * sinon la vidéo gagne, car elle passe mieux à l'échelle.
 */
export function chooseDeliveryMode(input: DeliveryModeInput): DeliveryModeDecision {
  const frameCount = Math.max(1, Math.round(input.durationS * input.scrubFps));
  const sequenceWeightKb = Number((frameCount * input.avgFrameWeightKb).toFixed(1));
  const caveats: string[] = [];

  const budget = input.weightBudgetKb;
  const sequenceOverBudget = budget !== undefined && sequenceWeightKb > budget;
  const videoOverBudget = budget !== undefined && input.videoWeightKb > budget;
  if (videoOverBudget) {
    caveats.push(
      `Le master vidéo (${String(input.videoWeightKb)} Ko) dépasse déjà le budget ` +
        `(${String(budget)} Ko) : ré-encoder ou raccourcir.`,
    );
  }

  const tooHeavy = sequenceWeightKb > SEQUENCE_MAX_WEIGHT_KB;
  const tooManyFrames = frameCount > SEQUENCE_MAX_FRAMES;

  // 1) Séquence disqualifiée par le poids ou le nombre de frames.
  if (tooHeavy || tooManyFrames || sequenceOverBudget) {
    const why = [
      tooHeavy
        ? `poids ${String(sequenceWeightKb)} Ko > ${String(SEQUENCE_MAX_WEIGHT_KB)} Ko`
        : null,
      tooManyFrames ? `${String(frameCount)} frames > ${String(SEQUENCE_MAX_FRAMES)}` : null,
      sequenceOverBudget ? `hors budget (${String(budget ?? 0)} Ko)` : null,
    ]
      .filter(Boolean)
      .join(", ");
    if (input.framePrecisionRequired) {
      caveats.push(
        "Précision image par image demandée mais impossible à ce poids : " +
          "réduire la durée ou la cadence de scrub pour y revenir.",
      );
    }
    return {
      mode: "VIDEO_SCROLL",
      rationale: `Séquence d'images écartée (${why}) : la vidéo passe mieux à l'échelle.`,
      frameCount,
      sequenceWeightKb,
      videoWeightKb: input.videoWeightKb,
      preload: "poster-then-full",
      caveats,
    };
  }

  // 2) Mobile contraint : le poids prime, sauf si la séquence est plus légère.
  if (input.mobileConstrained && sequenceWeightKb > input.videoWeightKb) {
    return {
      mode: "VIDEO_SCROLL",
      rationale:
        `Cible mobile contrainte : la vidéo (${String(input.videoWeightKb)} Ko) est plus légère ` +
        `que la séquence (${String(sequenceWeightKb)} Ko).`,
      frameCount,
      sequenceWeightKb,
      videoWeightKb: input.videoWeightKb,
      preload: "poster-then-full",
      caveats,
    };
  }

  // 3) Précision requise et séquence raisonnable → scrub frame-perfect.
  if (input.framePrecisionRequired) {
    return {
      mode: "IMAGE_SEQUENCE",
      rationale:
        `Scrub image par image requis et séquence raisonnable (${String(frameCount)} frames, ` +
        `${String(sequenceWeightKb)} Ko) : précision garantie, sans dépendre des keyframes vidéo.`,
      frameCount,
      sequenceWeightKb,
      videoWeightKb: input.videoWeightKb,
      preload: "progressive-batches",
      caveats,
    };
  }

  // 4) Sans exigence de précision, la plus légère gagne.
  const sequenceWins = sequenceWeightKb < input.videoWeightKb;
  return {
    mode: sequenceWins ? "IMAGE_SEQUENCE" : "VIDEO_SCROLL",
    rationale: sequenceWins
      ? `Séquence plus légère (${String(sequenceWeightKb)} Ko < ${String(input.videoWeightKb)} Ko) ` +
        "et scrub plus précis : elle l'emporte."
      : `Vidéo plus légère (${String(input.videoWeightKb)} Ko ≤ ${String(sequenceWeightKb)} Ko) : ` +
        "elle l'emporte, la précision n'étant pas critique ici.",
    frameCount,
    sequenceWeightKb,
    videoWeightKb: input.videoWeightKb,
    preload: sequenceWins ? "progressive-batches" : "poster-then-full",
    caveats,
  };
}
