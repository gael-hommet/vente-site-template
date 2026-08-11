import type { SpatialMode } from "./types";

/**
 * ACE SPATIAL CINEMA — choix du mode à partir du matériau RÉEL.
 *
 * Aucune génération : on ne choisit que ce que les assets permettent réellement.
 * Si rien ne le permet, on le dit — on ne fabrique pas une fausse géométrie
 * (doctrine anti-low-poly).
 */

export interface SpatialAssets {
  /** Nombre d'images exploitables. */
  imageCount: number;
  /** Nombre de depth maps disponibles (fournies ou calculées localement). */
  depthMapCount: number;
  /** Un vrai modèle glTF/GLB est disponible. */
  hasRealModel3d: boolean;
  /**
   * Les vues se recouvrent-elles suffisamment pour envisager une
   * reconstruction ? DÉCLARATIF : ACE 0.3 ne mesure pas le recouvrement.
   */
  overlappingViews?: boolean;
  /** Une vraie vidéo continue existe (ScrollVideo reste pertinent). */
  hasContinuousVideo?: boolean;
}

export type SpatialBlocker =
  /** Des images existent mais aucune profondeur : impossible de spatialiser. */
  | "DEPTH_MAP_REQUIRED"
  /** Aucun matériau visuel exploitable. */
  | "MEDIA_ASSET_REQUIRED";

export interface SpatialDecision {
  mode: SpatialMode | null;
  rationale: string;
  blocker: SpatialBlocker | null;
  /** Nombre de scènes que le matériau permet de construire. */
  sceneCount: number;
  /** Réserves honnêtes à communiquer. */
  caveats: string[];
}

/** Au-delà, on ne parle plus de « voyage » mais de galerie : on plafonne. */
export const MAX_SPATIAL_SCENES = 8;

/**
 * Choisit le mode spatial.
 *
 * Ordre : vrai modèle 3D > plusieurs scènes depth (hybride) > une scène depth.
 * Le recouvrement suffisant est signalé comme CANDIDAT, jamais réalisé.
 */
export function chooseSpatialMode(assets: SpatialAssets): SpatialDecision {
  const caveats: string[] = [];

  if (assets.hasRealModel3d) {
    return {
      mode: "real-3d",
      rationale:
        "Un vrai modèle 3D est disponible : scène WebGL classique, sans reconstruction approximative.",
      blocker: null,
      sceneCount: 1,
      caveats,
    };
  }

  if (assets.imageCount === 0) {
    return {
      mode: null,
      rationale:
        "Aucune image exploitable : ACE ne fabrique ni image ni géométrie. Un visuel réel est nécessaire.",
      blocker: "MEDIA_ASSET_REQUIRED",
      sceneCount: 0,
      caveats,
    };
  }

  if (assets.depthMapCount === 0) {
    return {
      mode: null,
      rationale:
        "Des images existent mais aucune carte de profondeur : sans elle, la scène serait un plan " +
        "plat — c'est-à-dire un diaporama. Fournir ou calculer localement une depth map.",
      blocker: "DEPTH_MAP_REQUIRED",
      sceneCount: 0,
      caveats,
    };
  }

  // Le recouvrement réel n'est pas mesuré : on le signale sans le promettre.
  if (assets.overlappingViews === true && assets.imageCount >= 20) {
    caveats.push(
      "Les vues semblent se recouvrir : candidat à une reconstruction spatiale plus poussée, " +
        "non réalisée par ACE 0.3 (voir docs/ACE-SPATIAL-CAPTURE-GUIDE.md).",
    );
  }

  const usable = Math.min(assets.imageCount, assets.depthMapCount);
  if (usable > MAX_SPATIAL_SCENES) {
    caveats.push(
      `${String(usable)} scènes possibles : plafonné à ${String(MAX_SPATIAL_SCENES)} pour garder ` +
        "un voyage lisible et des performances tenables.",
    );
  }
  const sceneCount = Math.min(usable, MAX_SPATIAL_SCENES);

  if (sceneCount >= 2) {
    return {
      mode: "hybrid-spatial",
      rationale:
        `${String(sceneCount)} scènes en profondeur réelle, raccordées par des transitions ` +
        "spatiales (occlusion / traversée) : un seul voyage, jamais un diaporama.",
      blocker: null,
      sceneCount,
      caveats,
    };
  }

  return {
    mode: "depth-scene",
    rationale:
      "Une image avec profondeur : scène navigable au scroll, parallaxe réel et perspective.",
    blocker: null,
    sceneCount: 1,
    caveats: [
      ...caveats,
      "Une seule scène : la caméra reste dans la zone où la reconstruction est crédible.",
    ],
  };
}

/** Le mode retenu exige-t-il une couche WebGL ? */
export function requiresWebGL(mode: SpatialMode | null): boolean {
  return mode === "depth-scene" || mode === "hybrid-spatial" || mode === "real-3d";
}
