import type { AceQualityBar } from "./types";
import type { TechnicalVerdict } from "./qa-verdict";

/**
 * ACE 0.2 — ART DIRECTOR LOOP.
 *
 * ACE doit pouvoir dire : « techniquement valide mais visuellement insuffisant
 * → REJECT ». Un média peut passer toute la QA technique (bonnes dimensions,
 * bon codec, non corrompu) et rester invendable.
 *
 * HONNÊTETÉ CENTRALE : juger la composition, le réalisme ou le « premium feel »
 * exige de REGARDER l'image. Ce module ne prétend pas le faire tout seul : il
 * fournit la STRUCTURE du jugement (axes, seuils, verdict) que remplit soit une
 * revue humaine, soit un inspecteur visuel disposant réellement de la vision.
 * Sans scores fournis, aucun média n'est promu : l'absence de jugement n'est
 * jamais interprétée comme une approbation.
 */

export interface AceArtDirectionScores {
  /** 0..1 chacun. */
  composition: number;
  realism: number;
  brandFit: number;
  continuity: number;
  premiumFeel: number;
  /** Intégrabilité réelle dans la page (cadrage, zones de texte, respiration). */
  usability: number;
}

export type ArtDirectionVerdict = "APPROVE" | "REVIEW_REQUIRED" | "REJECT";

export interface AceArtDirectionReview {
  shotId: string;
  scores: AceArtDirectionScores | null;
  /** Moyenne pondérée 0..1, ou null si aucun score fourni. */
  overall: number | null;
  verdict: ArtDirectionVerdict;
  reasons: string[];
  /** Vrai tant qu'aucun inspecteur visuel fiable n'a réellement vu le média. */
  requiresHumanReview: boolean;
  /** Origine du jugement : qui a regardé ? */
  source: "none" | "human" | "vision-model";
}

/** Le premium se joue d'abord sur la valeur perçue et la continuité. */
const WEIGHTS: Record<keyof AceArtDirectionScores, number> = {
  premiumFeel: 3,
  composition: 2,
  continuity: 2,
  realism: 2,
  usability: 2,
  brandFit: 1,
};

/** Seuil d'approbation pour une barre premium. */
export const ART_APPROVE_THRESHOLD = 0.72;
/** En dessous, le média est refusé quelle que soit sa validité technique. */
export const ART_REJECT_THRESHOLD = 0.5;

function weighted(scores: AceArtDirectionScores): number {
  let num = 0;
  let den = 0;
  (Object.keys(WEIGHTS) as (keyof AceArtDirectionScores)[]).forEach((k) => {
    num += WEIGHTS[k] * scores[k];
    den += WEIGHTS[k];
  });
  return Number((num / den).toFixed(3));
}

export interface ArtDirectionInput {
  shotId: string;
  qualityBar: AceQualityBar;
  /** Verdict technique déjà établi (ffprobe). */
  technicalVerdict: TechnicalVerdict;
  /** Scores de revue, si un humain ou un modèle de vision a réellement jugé. */
  scores?: AceArtDirectionScores;
  source?: "human" | "vision-model";
  /** Observations libres du relecteur (déformations, artefacts…). */
  observations?: string[];
}

/**
 * Produit la revue de direction artistique.
 *
 * Règles :
 *  - un REJECT technique reste un REJECT (inutile de juger l'esthétique) ;
 *  - sans scores, le verdict est REVIEW_REQUIRED — jamais APPROVE ;
 *  - avec scores, les seuils tranchent, et une barre premium est plus exigeante.
 */
export function reviewArtDirection(input: ArtDirectionInput): AceArtDirectionReview {
  const reasons: string[] = [...(input.observations ?? [])];

  if (input.technicalVerdict === "REJECT") {
    return {
      shotId: input.shotId,
      scores: input.scores ?? null,
      overall: input.scores ? weighted(input.scores) : null,
      verdict: "REJECT",
      reasons: [
        "Rejet technique préalable (média absent, corrompu ou hors contrainte) : " +
          "l'esthétique n'entre pas en jeu.",
        ...reasons,
      ],
      requiresHumanReview: false,
      source: input.source ?? "none",
    };
  }

  if (!input.scores) {
    return {
      shotId: input.shotId,
      scores: null,
      overall: null,
      verdict: "REVIEW_REQUIRED",
      reasons: [
        "Aucun jugement visuel disponible : personne n'a regardé ce média. " +
          "ACE ne promeut jamais un rendu qu'il n'a pas évalué.",
        ...reasons,
      ],
      requiresHumanReview: true,
      source: "none",
    };
  }

  const overall = weighted(input.scores);
  const highBar = input.qualityBar === "photoreal" || input.qualityBar === "stylized-premium";
  const approveAt = highBar ? ART_APPROVE_THRESHOLD : ART_APPROVE_THRESHOLD - 0.1;

  let verdict: ArtDirectionVerdict;
  if (overall < ART_REJECT_THRESHOLD) {
    verdict = "REJECT";
    reasons.push(
      `Score global ${String(overall)} < ${String(ART_REJECT_THRESHOLD)} : ` +
        "techniquement exploitable peut-être, mais visuellement insuffisant.",
    );
  } else if (overall < approveAt) {
    verdict = "REVIEW_REQUIRED";
    reasons.push(
      `Score global ${String(overall)} sous le seuil d'approbation ${String(approveAt)} : ` +
        "à réexaminer ou régénérer.",
    );
  } else {
    verdict = "APPROVE";
    reasons.push(`Score global ${String(overall)} ≥ ${String(approveAt)} : conforme à l'ambition.`);
  }

  // Un axe critique effondré disqualifie, même avec une bonne moyenne.
  const critical: (keyof AceArtDirectionScores)[] = ["premiumFeel", "continuity", "realism"];
  for (const axis of critical) {
    if (input.scores[axis] < 0.4 && verdict !== "REJECT") {
      verdict = "REJECT";
      reasons.push(`Axe critique « ${axis} » effondré (${String(input.scores[axis])}) : rejet.`);
    }
  }

  return {
    shotId: input.shotId,
    scores: input.scores,
    overall,
    verdict,
    reasons,
    // Un modèle de vision reste faillible : on ne prétend jamais l'infaillibilité.
    requiresHumanReview: input.source !== "human",
    source: input.source ?? "human",
  };
}
