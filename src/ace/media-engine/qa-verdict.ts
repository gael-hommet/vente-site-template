/**
 * ACE 0.2 — Vocabulaire de verdict partagé (isomorphe).
 *
 * Extrait dans son propre module pour que les couches pures (manifeste,
 * premium gate, art direction) puissent typer un verdict sans dépendre du
 * module Node qui, lui, exécute réellement ffprobe.
 */

export type TechnicalVerdict =
  /** Conforme aux contraintes techniques vérifiables. */
  | "PASS"
  /** Lisible, mais un point mérite un contrôle humain. */
  | "REVIEW_REQUIRED"
  /** Fait bloquant : absent, vide, corrompu, hors contrainte dure. */
  | "REJECT";

/** REVIEW_REQUIRED est une sortie VALIDE : ACE ne tranche pas ce qu'il ne peut pas juger. */
export const TECHNICAL_VERDICTS: readonly TechnicalVerdict[] = [
  "PASS",
  "REVIEW_REQUIRED",
  "REJECT",
];
