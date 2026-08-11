import type { SpatialManifest, SpatialScene, SceneTransition } from "./types";

/**
 * ACE SPATIAL CINEMA — timeline (pure, testable, réversible).
 *
 * Convertit UNE progression globale de scroll (0..1) en état complet du voyage :
 * quelle scène, où on en est DANS la scène, et si l'on se trouve dans une
 * fenêtre de transition (et à quel point).
 *
 * Réversibilité : la fonction est un pur mapping `progress → état`. Remonter le
 * scroll repasse exactement par les mêmes états — aucune mémoire, aucun
 * autoplay, aucune hystérésis.
 */

export interface TransitionState {
  /** Scène qui sort. */
  fromIndex: number;
  /** Scène qui entre. */
  toIndex: number;
  /** Avancement DANS la transition (0..1). */
  t: number;
  type: SceneTransition["type"];
  transition: SceneTransition;
}

export interface TimelineState {
  /** Progression globale demandée (clampée 0..1). */
  progress: number;
  /** Scène principale à rendre. */
  sceneIndex: number;
  /** Avancement DANS la scène (0..1) — pilote la caméra. */
  localProgress: number;
  /** Transition en cours, ou null. */
  transition: TransitionState | null;
  /** Scènes à garder en mémoire (courante + suivante pendant un raccord). */
  activeScenes: number[];
}

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Progression locale d'une scène pour une progression globale donnée. */
export function localProgressOf(scene: SpatialScene, progress: number): number {
  const span = scene.end - scene.start;
  if (span <= 0) return 0;
  return clamp01((progress - scene.start) / span);
}

/**
 * Fenêtre de transition sortante d'une scène : elle se situe à cheval sur la
 * fin de la scène (la caméra continue d'avancer pendant que l'occlusion monte).
 */
export function transitionWindow(scene: SpatialScene): { start: number; end: number } | null {
  if (!scene.transitionOut) return null;
  const d = Math.max(0, scene.transitionOut.duration);
  return { start: Math.max(scene.start, scene.end - d), end: scene.end };
}

/**
 * Résout l'état complet du voyage. La scène « principale » reste la scène
 * sortante pendant toute la transition : c'est ce qui garantit la continuité du
 * mouvement (la caméra ne saute pas d'un coup dans la scène suivante).
 */
export function resolveTimeline(manifest: SpatialManifest, rawProgress: number): TimelineState {
  const progress = clamp01(rawProgress);
  const scenes = manifest.scenes;
  if (scenes.length === 0) {
    return { progress, sceneIndex: 0, localProgress: 0, transition: null, activeScenes: [] };
  }

  // Scène courante : la dernière dont le début est déjà franchi.
  let sceneIndex = 0;
  for (let i = 0; i < scenes.length; i += 1) {
    const s = scenes[i] as SpatialScene;
    if (progress >= s.start) sceneIndex = i;
  }
  const scene = scenes[sceneIndex] as SpatialScene;
  const localProgress = localProgressOf(scene, progress);

  // Transition sortante en cours ?
  let transition: TransitionState | null = null;
  const win = transitionWindow(scene);
  const next = scenes[sceneIndex + 1];
  if (win && next && progress >= win.start) {
    const span = win.end - win.start;
    transition = {
      fromIndex: sceneIndex,
      toIndex: sceneIndex + 1,
      t: span > 0 ? clamp01((progress - win.start) / span) : 1,
      type: (scene.transitionOut as SceneTransition).type,
      transition: scene.transitionOut as SceneTransition,
    };
  }

  const activeScenes = transition ? [transition.fromIndex, transition.toIndex] : [sceneIndex];

  return { progress, sceneIndex, localProgress, transition, activeScenes };
}

/**
 * Fabrique une timeline régulière : N scènes de durée égale, séparées par des
 * transitions de durée donnée. Utile pour un manifeste rédigé sans bornes.
 */
export function distributeScenes(
  count: number,
  transitionDuration = 0.06,
): { start: number; end: number }[] {
  if (count <= 0) return [];
  const span = 1 / count;
  return Array.from({ length: count }, (_, i) => ({
    start: Number((i * span).toFixed(6)),
    // La dernière scène va jusqu'à 1 ; les autres empiètent de la transition.
    end: Number((i === count - 1 ? 1 : (i + 1) * span + transitionDuration / 2).toFixed(6)),
  }));
}

export interface TimelineIssue {
  scene: string;
  message: string;
}

/**
 * Contrôle la cohérence d'un manifeste. Un manifeste incohérent produirait des
 * sauts de caméra : on préfère le refuser.
 */
export function validateTimeline(manifest: SpatialManifest): TimelineIssue[] {
  const issues: TimelineIssue[] = [];
  const scenes = manifest.scenes;

  if (scenes.length === 0) {
    issues.push({ scene: "(aucune)", message: "aucune scène déclarée" });
    return issues;
  }
  const first = scenes[0] as SpatialScene;
  if (first.start > 0.001) {
    issues.push({ scene: first.id, message: "la première scène doit démarrer à 0" });
  }
  const last = scenes[scenes.length - 1] as SpatialScene;
  if (last.end < 0.999) {
    issues.push({ scene: last.id, message: "la dernière scène doit finir à 1" });
  }

  scenes.forEach((s, i) => {
    if (s.end <= s.start) {
      issues.push({ scene: s.id, message: "intervalle vide ou inversé" });
    }
    if (s.depth.strength <= 0) {
      // Une profondeur nulle = un plan plat = un diaporama déguisé.
      issues.push({ scene: s.id, message: "profondeur nulle : la scène serait plate" });
    }
    if (!s.depthMap) {
      issues.push({ scene: s.id, message: "DEPTH_MAP_REQUIRED : aucune carte de profondeur" });
    }
    const prev = scenes[i - 1];
    if (prev && s.start > prev.end + 0.001) {
      issues.push({ scene: s.id, message: `trou dans la timeline après « ${prev.id} »` });
    }
    if (i < scenes.length - 1 && !s.transitionOut) {
      issues.push({ scene: s.id, message: "transition sortante manquante (raccord brutal)" });
    }
    if (s.transitionOut && s.transitionOut.duration <= 0) {
      issues.push({ scene: s.id, message: "transition de durée nulle : ce serait une coupe" });
    }
  });

  return issues;
}

/** Chapitre actif pour une progression donnée (le dernier franchi). */
export function activeChapter(manifest: SpatialManifest, progress: number): number {
  const chapters = manifest.chapters ?? [];
  let active = -1;
  chapters.forEach((c, i) => {
    if (progress >= c.at) active = i;
  });
  return active;
}
