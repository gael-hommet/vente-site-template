import type { AceMediaStrategy, AceQualityBar, AceAvailableAssets } from "./types";
import type { TechnicalVerdict } from "./qa-verdict";
import { evaluateLowPolyRisk } from "./anti-low-poly";

/**
 * ACE 0.2 — ACE PREMIUM OUTPUT GATE.
 *
 * Extension de la doctrine anti-low-poly à TOUTES les formes de médiocrité.
 * Le gate interdit qu'un média soit présenté comme la RÉALISATION de l'intention
 * premium demandée quand il n'en est qu'un pis-aller.
 *
 * Distinction fondamentale :
 *   - un site PEUT fonctionner avec un fallback (c'est même souhaitable) ;
 *   - un fallback NE PEUT PAS être présenté comme l'expérience premium promise.
 * Le gate ne casse donc pas le site : il refuse le MENSONGE sur le résultat.
 */

export type PremiumViolation =
  /** Substitution 3D procédurale pour un besoin photoréaliste. */
  | "LOW_POLY_SUBSTITUTION"
  /** Média absent alors qu'il est requis. */
  | "MISSING_MEDIA"
  /** Fichier corrompu / illisible. */
  | "CORRUPTED_MEDIA"
  /** Média rejeté par la QA mais malgré tout proposé. */
  | "QA_REJECTED_MEDIA"
  /** Asset de test/synthétique présenté comme livrable. */
  | "TEST_ASSET_AS_FINAL"
  /** Placeholder / poster générique présenté comme l'expérience. */
  | "PLACEHOLDER_AS_FINAL"
  /** Le verrou d'identité du sujet est rompu entre les plans. */
  | "SUBJECT_LOCK_BROKEN"
  /** Fallback présenté silencieusement comme la réalisation premium. */
  | "SILENT_FALLBACK";

export interface PremiumGateInput {
  /** Barre de qualité EXIGÉE par le besoin. */
  qualityBar: AceQualityBar;
  strategy: AceMediaStrategy;
  assets: AceAvailableAssets;
  /** Verdict de la QA technique du média retenu (null si aucun média). */
  technicalVerdict: TechnicalVerdict | null;
  /** Le média retenu existe-t-il réellement sur disque ? */
  mediaPresent: boolean;
  /** Le média est-il un asset synthétique/de test ? */
  isSyntheticTestAsset?: boolean;
  /** Le média est-il un simple placeholder/poster générique ? */
  isPlaceholder?: boolean;
  /** Le verrou d'identité du sujet est-il respecté ? (null = non évalué) */
  subjectLockIntact?: boolean | null;
  /**
   * Le repli est-il ASSUMÉ et déclaré à l'utilisateur ? Un fallback déclaré est
   * acceptable ; un fallback silencieux ne l'est pas.
   */
  fallbackDeclared?: boolean;
}

export interface PremiumGateVerdict {
  /** Le média peut-il être présenté comme la réalisation de l'intention ? */
  shippableAsPremium: boolean;
  violations: PremiumViolation[];
  reasons: string[];
  /**
   * Ce que le moteur doit faire : livrer, déclarer un repli, ou bloquer.
   *  - "SHIP"             : conforme à l'ambition.
   *  - "DECLARE_FALLBACK" : utilisable, mais doit être annoncé comme repli.
   *  - "BLOCK"            : ne pas présenter ce média du tout.
   */
  action: "SHIP" | "DECLARE_FALLBACK" | "BLOCK";
}

/** Barres qui engagent une promesse premium. */
const HIGH_BAR: readonly AceQualityBar[] = ["photoreal", "stylized-premium"];

/**
 * Évalue si une sortie peut être présentée comme la réalisation de l'intention
 * premium. Ne juge pas l'esthétique (voir `art-direction.ts`) : il applique des
 * règles factuelles et non négociables.
 */
export function evaluatePremiumOutput(input: PremiumGateInput): PremiumGateVerdict {
  const violations: PremiumViolation[] = [];
  const reasons: string[] = [];
  const highBar = HIGH_BAR.includes(input.qualityBar);

  // 1) Doctrine anti-low-poly (réutilisée, jamais dupliquée).
  const lowPoly = evaluateLowPolyRisk(input.strategy, input.qualityBar, input.assets);
  if (lowPoly.wouldViolate) {
    violations.push("LOW_POLY_SUBSTITUTION");
    reasons.push(lowPoly.reason);
  }

  // 2) Faits bloquants sur le média lui-même.
  if (!input.mediaPresent) {
    violations.push("MISSING_MEDIA");
    reasons.push("Aucun média produit : l'intention n'est pas réalisée.");
  }
  if (input.technicalVerdict === "REJECT") {
    violations.push("CORRUPTED_MEDIA");
    reasons.push("La QA technique rejette ce média (absent, vide, corrompu ou hors contrainte).");
  }
  if (input.isSyntheticTestAsset === true) {
    violations.push("TEST_ASSET_AS_FINAL");
    reasons.push(
      "Média synthétique de TEST : il valide le pipeline, il ne constitue jamais un livrable premium.",
    );
  }
  if (input.isPlaceholder === true && highBar) {
    violations.push("PLACEHOLDER_AS_FINAL");
    reasons.push("Placeholder/poster générique : insuffisant pour une promesse premium.");
  }
  if (input.subjectLockIntact === false) {
    violations.push("SUBJECT_LOCK_BROKEN");
    reasons.push(
      "Le sujet change d'identité entre les plans : la continuité premium n'est pas tenue.",
    );
  }

  // 3) Un repli non déclaré présenté comme l'expérience premium.
  const isFallbackStrategy = input.strategy === "editorial-fallback";
  if (isFallbackStrategy && highBar && input.fallbackDeclared !== true) {
    violations.push("SILENT_FALLBACK");
    reasons.push(
      "Repli éditorial pour un besoin premium sans déclaration explicite : " +
        "le repli est acceptable, le présenter comme la réalisation promise ne l'est pas.",
    );
  }

  if (violations.length === 0) {
    return {
      shippableAsPremium: true,
      violations,
      reasons: ["Conforme à l'ambition : média présent, techniquement valide, identité tenue."],
      action: "SHIP",
    };
  }

  // Un repli honnêtement déclaré, sans faute technique, reste livrable — mais
  // étiqueté comme repli, jamais comme la réalisation premium.
  const onlySilentFallback = violations.length === 1 && violations[0] === "SILENT_FALLBACK";
  if (onlySilentFallback) {
    return {
      shippableAsPremium: false,
      violations,
      reasons,
      action: "DECLARE_FALLBACK",
    };
  }

  return { shippableAsPremium: false, violations, reasons, action: "BLOCK" };
}

/** Garde stricte : lève si la sortie ne peut pas être présentée comme premium. */
export function assertPremiumOutput(input: PremiumGateInput): void {
  const verdict = evaluatePremiumOutput(input);
  if (verdict.action === "BLOCK") {
    throw new Error(`[ACE premium-gate] ${verdict.reasons.join(" ")}`);
  }
}
