import type { QualityTier } from "@/types";

/**
 * ACE 0.2 — Creative Media Autonomous Engine : contrats typés.
 *
 * Cette couche DÉCIDE, PLANIFIE et CONTRÔLE les médias premium. Elle ne rend
 * rien elle-même : elle produit des plans/rapports sérialisables que la CLI et
 * les composants runtime consomment. Aucune valeur n'est inventée (coûts,
 * capacités provider) : tout vient de la config ou d'un audit réel.
 */

/* -------------------------------------------------------------------------- */
/* Intentions & stratégies                                                    */
/* -------------------------------------------------------------------------- */

/** Ce que l'expérience média doit accomplir (émotion/rôle). */
export type AceMediaIntent =
  | "hero-cinematic"
  | "room-tour"
  | "project-reveal"
  | "scroll-film"
  | "photo-depth"
  | "image-sequence"
  | "ambient-loop";

/** Technique de rendu retenue. */
export type AceMediaStrategy =
  "webgl" | "video-scroll" | "image-sequence" | "2.5d" | "hybrid" | "editorial-fallback";

/** Exigence de qualité visuelle du besoin. `photoreal` interdit toute
 * substitution low-poly procédurale comme sortie principale (voir anti-low-poly). */
export type AceQualityBar = "photoreal" | "stylized-premium" | "graphic" | "editorial";

/* -------------------------------------------------------------------------- */
/* Assets & providers disponibles                                             */
/* -------------------------------------------------------------------------- */

/** Ce dont on dispose RÉELLEMENT en entrée (dicte les stratégies possibles). */
export interface AceAvailableAssets {
  /** Une vraie vidéo continue exploitable (visite, plan-séquence). */
  continuousVideo: boolean;
  /** Une séquence de frames prête au scrub. */
  frameSequence: boolean;
  /** Des images fixes premium (permet 2.5D/depth). */
  stillImages: boolean;
  /** Un modèle 3D réel (glTF), pas une primitive. */
  realModel3d: boolean;
  /** Cartes de profondeur (depth maps) pour la 2.5D. */
  depthMaps: boolean;
}

/** Résultat d'un audit des capacités réellement disponibles ici. */
export interface AceCapabilityReport {
  /** Binaire ffmpeg présent (assemblage/frames local). */
  ffmpeg: boolean;
  /** sharp présent (traitement d'images). */
  sharp: boolean;
  /** @gltf-transform présent (optimisation glTF). */
  gltfTransform: boolean;
  /** Providers de génération configurés (via env). */
  configuredProviders: string[];
  /** Providers connus mais NON configurés. */
  unconfiguredProviders: string[];
  /** Techniques runtime disponibles (composants présents). */
  runtimeStrategies: AceMediaStrategy[];
  notes: string[];
}

/* -------------------------------------------------------------------------- */
/* Contraintes                                                                */
/* -------------------------------------------------------------------------- */

export interface AceMediaConstraints {
  /** Tier de performance cible minimal. */
  minTier: QualityTier;
  /** Reduced-motion à honorer (fallback statique requis). */
  reducedMotionSafe: boolean;
  /** Budget de poids indicatif (Ko) pour le média principal, si connu. */
  weightBudgetKb?: number;
  /** Mobile doit rester premium. */
  mobilePremium: boolean;
}

/* -------------------------------------------------------------------------- */
/* Décision de stratégie                                                      */
/* -------------------------------------------------------------------------- */

export interface AceStrategyDecision {
  strategy: AceMediaStrategy;
  /** Justification lisible de la décision. */
  rationale: string;
  /** Prérequis à satisfaire (assets/providers) pour cette stratégie. */
  requirements: string[];
  /**
   * Signal HONNÊTE quand aucune stratégie premium n'est possible en l'état :
   * - "MEDIA_ASSET_REQUIRED" : il faut fournir un asset média externe ;
   * - "PROVIDER_NOT_CONFIGURED" : la génération est possible mais le provider
   *   n'est pas configuré ;
   * - null : une stratégie premium est réalisable maintenant.
   */
  blocker: "MEDIA_ASSET_REQUIRED" | "PROVIDER_NOT_CONFIGURED" | null;
  /** Repli premium explicite si `blocker` non null (jamais une maquette cheap). */
  premiumFallback: AceMediaStrategy | null;
}

/* -------------------------------------------------------------------------- */
/* Shot planning                                                              */
/* -------------------------------------------------------------------------- */

export interface AceShotPlan {
  id: string;
  /** Rôle narratif (ex. « établir le lieu », « révéler le produit »). */
  narrativeRole: string;
  startState: string;
  endState: string;
  cameraMove: "static" | "dolly" | "orbit" | "push-in" | "pull-out" | "pan" | "tilt";
  composition: string;
  focusPoint: string;
  /** Durée cible en secondes. */
  durationS: number;
  /** Référence amont (raccord depuis le plan précédent). */
  refIn: string | null;
  /** Référence aval (raccord vers le plan suivant). */
  refOut: string | null;
  expectedValidation: string;
}

/* -------------------------------------------------------------------------- */
/* Media plan                                                                 */
/* -------------------------------------------------------------------------- */

export interface AceMediaPlan {
  intent: AceMediaIntent;
  qualityBar: AceQualityBar;
  emotionalGoal: string;
  decision: AceStrategyDecision;
  shots: AceShotPlan[];
  /** Références visuelles à verrouiller (identité du sujet). */
  referenceLocks: string[];
  risks: string[];
  /** Sortie attendue (ex. « mp4 + webm + poster + séquence webp »). */
  expectedOutput: string;
}

/* -------------------------------------------------------------------------- */
/* QA & continuité                                                            */
/* -------------------------------------------------------------------------- */

export interface AceMediaQaScores {
  /** 0..1 chacun. Heuristiques + revue humaine (pas un juge de vision parfait). */
  continuity: number;
  realism: number;
  narration: number;
  integrability: number;
  perceivedValue: number;
}

export interface AceMediaQaReport {
  shotId: string;
  scores: AceMediaQaScores;
  /** Moyenne pondérée 0..1. */
  overall: number;
  /** Sous le seuil ⇒ rejet (non vendable). */
  accepted: boolean;
  issues: string[];
  /** Toujours vrai : la QA IA n'est pas 100 % automatisable ici. */
  requiresHumanReview: boolean;
}

export interface AceContinuityReport {
  fromShot: string;
  toShot: string;
  /** 0..1 : cohérence perspective/lumière/matière/structure. */
  continuityScore: number;
  breaks: string[];
  acceptable: boolean;
}
