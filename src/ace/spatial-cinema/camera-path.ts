import type { CameraMove, CameraPath, Vec3 } from "./types";

/**
 * ACE SPATIAL CINEMA — trajets de caméra (pur, testable, indépendant du framerate).
 *
 * Le scroll ne pilote JAMAIS une opacité : il pilote la POSITION de la caméra,
 * sa cible et sa focale. Toutes les fonctions ici sont des mappings purs
 * `progress → état caméra` : le chemin retour est exactement l'inverse de
 * l'aller, et le résultat ne dépend pas du temps écoulé ni du framerate.
 */

export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
}

/** Adoucissement symétrique : départ et arrivée posés, milieu fluide. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Adoucissement de sortie seule (utile pour un « settle »). */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export interface CameraState {
  position: Vec3;
  target: Vec3;
  fov: number;
}

/**
 * État de la caméra pour une progression locale.
 * `easing` est appliqué à la progression, pas au temps : la fonction reste
 * parfaitement réversible.
 */
export function cameraAt(path: CameraPath, localProgress: number, eased = true): CameraState {
  const p = localProgress < 0 ? 0 : localProgress > 1 ? 1 : localProgress;
  const t = eased ? easeInOutCubic(p) : p;
  return {
    position: lerpVec3(path.positionFrom, path.positionTo, t),
    target: lerpVec3(path.targetFrom, path.targetTo, t),
    fov: lerp(path.fovFrom, path.fovTo, t),
  };
}

/** Distance entre deux positions (sert aux tests anti-slideshow). */
export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Primitives cinématiques. Amplitudes volontairement CONTENUES : l'objectif est
 * l'architecture et le luxe, pas le manège. Au-delà, une scène depth révèle les
 * bords de son maillage (voir SPATIAL_LIMITS).
 */
const MOVES: Record<CameraMove, (base: Vec3) => Omit<CameraPath, "move">> = {
  "dolly-in": (b) => ({
    positionFrom: b,
    positionTo: vec3(b.x, b.y, b.z - 0.9),
    targetFrom: vec3(0, 0, 0),
    targetTo: vec3(0, 0, 0),
    fovFrom: 50,
    fovTo: 44,
  }),
  "dolly-out": (b) => ({
    positionFrom: vec3(b.x, b.y, b.z - 0.9),
    positionTo: b,
    targetFrom: vec3(0, 0, 0),
    targetTo: vec3(0, 0, 0),
    fovFrom: 44,
    fovTo: 50,
  }),
  "truck-left": (b) => ({
    positionFrom: vec3(b.x + 0.35, b.y, b.z),
    positionTo: vec3(b.x - 0.35, b.y, b.z),
    targetFrom: vec3(0.1, 0, 0),
    targetTo: vec3(-0.1, 0, 0),
    fovFrom: 48,
    fovTo: 48,
  }),
  "truck-right": (b) => ({
    positionFrom: vec3(b.x - 0.35, b.y, b.z),
    positionTo: vec3(b.x + 0.35, b.y, b.z),
    targetFrom: vec3(-0.1, 0, 0),
    targetTo: vec3(0.1, 0, 0),
    fovFrom: 48,
    fovTo: 48,
  }),
  "pedestal-up": (b) => ({
    positionFrom: vec3(b.x, b.y - 0.25, b.z),
    positionTo: vec3(b.x, b.y + 0.25, b.z),
    targetFrom: vec3(0, -0.05, 0),
    targetTo: vec3(0, 0.05, 0),
    fovFrom: 48,
    fovTo: 48,
  }),
  "pedestal-down": (b) => ({
    positionFrom: vec3(b.x, b.y + 0.25, b.z),
    positionTo: vec3(b.x, b.y - 0.25, b.z),
    targetFrom: vec3(0, 0.05, 0),
    targetTo: vec3(0, -0.05, 0),
    fovFrom: 48,
    fovTo: 48,
  }),
  // Orbite volontairement minuscule : au-delà, le maillage se troue.
  "orbit-slight": (b) => ({
    positionFrom: vec3(b.x - 0.3, b.y, b.z),
    positionTo: vec3(b.x + 0.3, b.y, b.z - 0.15),
    targetFrom: vec3(0, 0, 0),
    targetTo: vec3(0, 0, 0),
    fovFrom: 48,
    fovTo: 46,
  }),
  // Traversée : la caméra va jusqu'à frôler le plan — c'est ce qui masque le
  // raccord vers la scène suivante.
  "push-through": (b) => ({
    positionFrom: b,
    positionTo: vec3(b.x, b.y, b.z - 1.6),
    targetFrom: vec3(0, 0, 0),
    targetTo: vec3(0, 0, -0.4),
    fovFrom: 50,
    fovTo: 58,
  }),
  reveal: (b) => ({
    positionFrom: vec3(b.x, b.y - 0.2, b.z - 0.4),
    positionTo: vec3(b.x, b.y + 0.1, b.z),
    targetFrom: vec3(0, -0.1, 0),
    targetTo: vec3(0, 0, 0),
    fovFrom: 42,
    fovTo: 52,
  }),
  settle: (b) => ({
    positionFrom: vec3(b.x, b.y, b.z - 0.18),
    positionTo: b,
    targetFrom: vec3(0, 0, 0),
    targetTo: vec3(0, 0, 0),
    fovFrom: 47,
    fovTo: 48,
  }),
};

/** Construit un trajet à partir d'une primitive et d'une position de base. */
export function cameraPathFor(move: CameraMove, base: Vec3 = vec3(0, 0, 2.6)): CameraPath {
  const built = MOVES[move](base);
  return { ...built, move };
}

export const CAMERA_MOVES = Object.keys(MOVES) as CameraMove[];

/**
 * Le trajet produit-il un déplacement RÉEL ?
 * Un trajet immobile trahirait un diaporama déguisé : le gate spatial s'en sert.
 */
export function isStaticPath(path: CameraPath, epsilon = 0.02): boolean {
  const moved = distance(path.positionFrom, path.positionTo);
  const fovDelta = Math.abs(path.fovTo - path.fovFrom);
  return moved < epsilon && fovDelta < 0.5;
}

/**
 * Continuité entre deux scènes : la caméra ne doit pas se retourner d'un coup.
 * Renvoie l'angle (degrés) entre la direction de fin de A et celle de début de B.
 */
export function directionChangeDegrees(a: CameraPath, b: CameraPath): number {
  const dirA = {
    x: a.targetTo.x - a.positionTo.x,
    y: a.targetTo.y - a.positionTo.y,
    z: a.targetTo.z - a.positionTo.z,
  };
  const dirB = {
    x: b.targetFrom.x - b.positionFrom.x,
    y: b.targetFrom.y - b.positionFrom.y,
    z: b.targetFrom.z - b.positionFrom.z,
  };
  const na = Math.hypot(dirA.x, dirA.y, dirA.z);
  const nb = Math.hypot(dirB.x, dirB.y, dirB.z);
  if (na === 0 || nb === 0) return 0;
  const dot = (dirA.x * dirB.x + dirA.y * dirB.y + dirA.z * dirB.z) / (na * nb);
  return (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;
}
