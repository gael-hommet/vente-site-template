import type {
  AceAvailableAssets,
  AceMediaConstraints,
  AceMediaIntent,
  AceQualityBar,
  AceStrategyDecision,
} from "./types";
import { evaluateLowPolyRisk } from "./anti-low-poly";

/**
 * ACE 0.2 — Strategy decision layer (pure, testable).
 *
 * Choisit la technique d'expérience (webgl / video-scroll / image-sequence /
 * 2.5d / hybrid / editorial-fallback) à partir de l'intention, de la barre de
 * qualité, des assets réellement disponibles et des contraintes.
 *
 * ACE ne génère AUCUN média via un service payant : la stratégie ne dépend donc
 * que du matériau RÉEL disponible. Sans matériau exploitable pour une barre
 * premium, on ne bricole pas — on annonce `MEDIA_ASSET_REQUIRED` et on propose
 * un repli éditorial assumé. Encode aussi la doctrine anti-low-poly : une barre
 * photoréaliste sans modèle 3D réel ne retombe JAMAIS sur du WebGL procédural.
 */

/** Intentions qui exigent une continuité parfaite type « visite ». */
const CONTINUITY_INTENTS: readonly AceMediaIntent[] = [
  "room-tour",
  "scroll-film",
  "hero-cinematic",
];

export interface ChooseStrategyInput {
  intent: AceMediaIntent;
  qualityBar: AceQualityBar;
  assets: AceAvailableAssets;
  constraints: AceMediaConstraints;
}

export function chooseStrategy(input: ChooseStrategyInput): AceStrategyDecision {
  const { intent, qualityBar, assets, constraints } = input;

  // 1) Reduced-motion / mobile très contraint : un fallback éditorial premium
  //    reste la sortie honnête (jamais une maquette cheap).
  //    Note : ce n'est pas un choix par défaut, seulement le repli déclaré.
  const editorialFallback: AceStrategyDecision = {
    strategy: "editorial-fallback",
    rationale:
      "Repli éditorial premium (typographie/composition/poster de qualité) — assumé, pas dégradé.",
    requirements: ["Un poster/visuel premium ou une composition typographique soignée."],
    blocker: null,
    premiumFallback: null,
  };

  // 2) Vraie vidéo continue → scroll-scrub vidéo (la meilleure « visite »).
  if (assets.continuousVideo && CONTINUITY_INTENTS.includes(intent)) {
    return {
      strategy: "video-scroll",
      rationale:
        "Une vidéo continue existe et l'intention exige une continuité parfaite : scroll-scrub vidéo (ScrollVideo).",
      requirements: ["Vidéo web (mp4+webm) + poster + version mobile allégée."],
      blocker: null,
      premiumFallback: "editorial-fallback",
    };
  }

  // 3) Séquence de frames prête → scrub frame-perfect.
  if (assets.frameSequence || (assets.continuousVideo && intent === "image-sequence")) {
    return {
      strategy: "image-sequence",
      rationale:
        "Frames disponibles (ou vidéo à extraire) : scrub frame-perfect piloté au scroll (ScrollImageSequence).",
      requirements: ["Séquence d'images optimisées (webp) + fallback poster."],
      blocker: null,
      premiumFallback: "editorial-fallback",
    };
  }

  // 4) WebGL — UNIQUEMENT si un vrai modèle 3D existe (sinon anti-low-poly).
  if (assets.realModel3d) {
    const risk = evaluateLowPolyRisk("webgl", qualityBar, assets);
    if (!risk.wouldViolate) {
      return {
        strategy: "webgl",
        rationale: `Modèle 3D réel disponible : WebGL temps réel (AdaptiveCanvas, tiers, fallback). ${risk.reason}`,
        requirements: [
          "glTF compressé (Draco/meshopt) + fallback poster obligatoire + budget perf par tier.",
        ],
        blocker: null,
        premiumFallback: "editorial-fallback",
      };
    }
  }

  // 5) Images fixes premium → 2.5D / depth (effet premium sans plan continu).
  if (assets.stillImages && (intent === "photo-depth" || qualityBar !== "photoreal")) {
    return {
      strategy: "2.5d",
      rationale:
        "Images fixes premium sans plan continu : animation 2.5D/depth (DepthParallax/LayeredPhoto) — reste premium.",
      requirements: ["Images haute qualité (+ depth maps pour un parallaxe convaincant)."],
      blocker: null,
      premiumFallback: "editorial-fallback",
    };
  }

  // 6) Rien d'exploitable pour la barre demandée. ACE ne génère pas de média :
  //    il DEMANDE le matériau qui manque, sans jamais bricoler un substitut.
  const highBar = qualityBar === "photoreal" || qualityBar === "stylized-premium";
  if (highBar) {
    return {
      strategy: "editorial-fallback",
      rationale:
        "Besoin photoréaliste/premium mais aucun média exploitable : ACE ne fabrique " +
        "ni image de synthèse ni low-poly de substitution. Il faut un vrai visuel.",
      requirements: [
        "Fournir un visuel réel (photo/vidéo officielle, ou média créé ailleurs et transmis).",
      ],
      blocker: "MEDIA_ASSET_REQUIRED",
      premiumFallback: "editorial-fallback",
    };
  }

  // 7) Barre basse / contraintes fortes → fallback éditorial assumé.
  if (constraints.reducedMotionSafe && !assets.stillImages && !assets.continuousVideo) {
    return editorialFallback;
  }
  return editorialFallback;
}
