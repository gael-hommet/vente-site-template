/**
 * ACE SPATIAL CINEMA — contrats typés.
 *
 * Transforme des images RÉELLES en véritables scènes WebGL parcourues par une
 * caméra pilotée au scroll. Ce n'est pas un diaporama : le scroll déplace une
 * caméra dans un espace reconstruit par déplacement de sommets (depth map), et
 * les changements de scène passent par des transitions SPATIALES (occlusion,
 * traversée), pas par un fondu d'opacité.
 *
 * Coût média : 0 €. Aucun service distant.
 */

/** Ce que le matériau disponible permet réellement de construire. */
export type SpatialMode =
  /** Une image + profondeur → une scène navigable. */
  | "depth-scene"
  /** Plusieurs scènes depth raccordées par des transitions spatiales. */
  | "hybrid-spatial"
  /** Un vrai modèle 3D (glTF) → scène WebGL classique. */
  | "real-3d"
  /**
   * Vues suffisamment chevauchantes pour envisager une reconstruction.
   * ACE 0.3 le DÉTECTE mais ne le réalise pas : voir `SPATIAL_LIMITS`.
   */
  | "multiview-candidate";

/** Vecteur 3D simple (évite de dépendre de three dans la couche pure). */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Mouvements de caméra cinématographiques admis. */
export type CameraMove =
  | "dolly-in"
  | "dolly-out"
  | "truck-left"
  | "truck-right"
  | "pedestal-up"
  | "pedestal-down"
  | "orbit-slight"
  | "push-through"
  | "reveal"
  | "settle";

/** Trajet de caméra d'une scène : d'un état A vers un état B. */
export interface CameraPath {
  positionFrom: Vec3;
  positionTo: Vec3;
  targetFrom: Vec3;
  targetTo: Vec3;
  fovFrom: number;
  fovTo: number;
  /** Primitive cinématique dont ce trajet est issu (traçabilité). */
  move?: CameraMove;
}

/** Réglage du relief tiré de la depth map. */
export interface DepthSettings {
  /** Amplitude du déplacement en Z (unités de scène). 0 = plat (interdit). */
  strength: number;
  /** Plan proche (valeur de depth map mappée au plus près). */
  near: number;
  /** Plan lointain. */
  far: number;
}

/** Types de transition SPATIALE entre deux scènes. */
export type TransitionType =
  /** Un élément proche (poutre, mur) masque le champ pendant le raccord. */
  | "OCCLUSION"
  /** La caméra traverse une ouverture (porte, passage). */
  | "PUSH_THROUGH"
  /** Passage par une zone sombre du cadre. */
  | "DARK_FRAME"
  /** Traversée d'une surface vitrée. */
  | "GLASS_PASS"
  /** Balayage spatial guidé par une arête. */
  | "EDGE_WIPE_SPATIAL"
  /** Déformation de profondeur (rare, réservé aux raccords abstraits). */
  | "DEPTH_WARP";

/** Point de correspondance entre deux scènes (garde la direction du regard). */
export interface SpatialAnchor {
  /** Coordonnées normalisées 0..1 dans l'image de la scène sortante. */
  sceneA: { x: number; y: number };
  /** Coordonnées normalisées 0..1 dans l'image de la scène entrante. */
  sceneB: { x: number; y: number };
  /** 0..1 — à quel point ce raccord compte. */
  importance: number;
  /** Ce que l'ancre représente (« porte », « baie »…). Déclaratif. */
  label?: string;
}

/** Transition sortante d'une scène. */
export interface SceneTransition {
  type: TransitionType;
  /** Durée en fraction de la progression globale (0..1). */
  duration: number;
  /** Où se situe l'occlusion dans le cadre (normalisé 0..1). */
  occlusionAnchor?: { x: number; y: number };
  /** Direction du mouvement de traversée. */
  direction?: "forward" | "left" | "right" | "up" | "down";
  /** Correspondances entre les deux scènes. */
  anchors?: SpatialAnchor[];
}

/** Une scène spatiale : une image, sa profondeur, son trajet de caméra. */
export interface SpatialScene {
  id: string;
  /** Image couleur (URL servie par le site). */
  image: string;
  /** Depth map en niveaux de gris. Absente ⇒ `DEPTH_MAP_REQUIRED`. */
  depthMap?: string;
  /** Début/fin dans la progression GLOBALE (0..1). */
  start: number;
  end: number;
  camera: CameraPath;
  depth: DepthSettings;
  /** Transition vers la scène suivante (absente sur la dernière). */
  transitionOut?: SceneTransition;
  /** Texte alternatif — le contenu reste lisible sans WebGL. */
  alt: string;
}

/** Chapitre narratif affiché pendant le voyage. */
export interface SpatialChapter {
  /** Progression globale à laquelle il devient actif. */
  at: number;
  eyebrow?: string;
  title: string;
  body?: string;
  /** Côté d'affichage (ne masque jamais le sujet). */
  side?: "left" | "right";
}

/** Le manifeste complet d'une expérience spatiale. */
export interface SpatialManifest {
  mode: SpatialMode;
  scenes: SpatialScene[];
  chapters?: SpatialChapter[];
  /** Longueur du scrub, en hauteurs de viewport. */
  length?: number;
  /** Poster affiché sans WebGL / sous reduced-motion. */
  poster: string;
  /** Description globale (accessibilité). */
  alt: string;
}

/**
 * Limites ASSUMÉES d'une scène depth. À citer dans la doc et le QA : une image
 * ne contient pas ce qui est hors champ.
 */
export const SPATIAL_LIMITS = [
  "Une scène depth ne permet pas de regarder derrière un objet : la géométrie hors champ n'existe pas.",
  "Une rotation importante (au-delà de quelques degrés) révèle les bords du maillage.",
  "Aucune pièce, aucun volume caché n'est inventé.",
  "La reconstruction multivue n'est pas réalisée en 0.3 : elle est seulement détectée.",
] as const;
