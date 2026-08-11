import type { SpatialManifest, SpatialScene } from "./types";
import { cameraAt, distance, isStaticPath, directionChangeDegrees } from "./camera-path";
import { validateTimeline } from "./timeline";

/**
 * ACE SPATIAL CINEMA — SPATIAL QUALITY GATE.
 *
 * Refuse tout ce qui ressemblerait à un diaporama déguisé en 3D. Les contrôles
 * portent sur des faits mesurables du manifeste (déplacement réel de la caméra,
 * profondeur non nulle, transitions spatiales), pas sur une impression.
 *
 * La partie PERCEPTIVE (tearing, trous de maillage, déformation grotesque) ne
 * peut pas être jugée sans regarder : elle reste `REVIEW_REQUIRED`.
 */

export type SpatialVerdict = "PASS" | "REVIEW_REQUIRED" | "REJECT";

export type SpatialViolation =
  /** Aucun déplacement de caméra : c'est un diaporama. */
  | "NO_CAMERA_MOVEMENT"
  /** Profondeur nulle : un plan plat texturé. */
  | "FLAT_TEXTURE"
  /** Transition uniquement en fondu : pas de mouvement spatial. */
  | "CROSSFADE_ONLY"
  /** Coupe franche entre deux scènes. */
  | "HARD_CUT"
  /** La caméra se retourne d'un coup entre deux scènes. */
  | "DISCONTINUOUS_DIRECTION"
  /** Amplitude déraisonnable : le maillage va se trouer. */
  | "EXCESSIVE_PARALLAX"
  /** Timeline incohérente (trou, inversion, bornes). */
  | "BROKEN_TIMELINE"
  /** Profondeur absente : la scène ne peut pas être spatiale. */
  | "DEPTH_MAP_MISSING";

export interface SpatialIssue {
  scene: string;
  violation: SpatialViolation;
  message: string;
}

export interface SpatialQualityReport {
  verdict: SpatialVerdict;
  issues: SpatialIssue[];
  /** Constats favorables (traçabilité de ce qui a été mesuré). */
  measured: string[];
  /** Vrai tant qu'aucun humain n'a regardé le rendu. */
  requiresVisualReview: boolean;
}

/** Au-delà, une scène depth commence à révéler les bords de son maillage. */
export const MAX_SAFE_TRAVEL = 2.2;
/** Au-delà, le raccord entre deux scènes se voit comme un demi-tour. */
export const MAX_DIRECTION_CHANGE_DEG = 45;

/**
 * Évalue un manifeste spatial. Un seul `REJECT` suffit à refuser l'expérience :
 * mieux vaut une page éditoriale honnête qu'un faux voyage.
 */
export function assessSpatialQuality(manifest: SpatialManifest): SpatialQualityReport {
  const issues: SpatialIssue[] = [];
  const measured: string[] = [];

  for (const issue of validateTimeline(manifest)) {
    issues.push({
      scene: issue.scene,
      violation: issue.message.includes("DEPTH_MAP_REQUIRED")
        ? "DEPTH_MAP_MISSING"
        : issue.message.includes("transition")
          ? "HARD_CUT"
          : "BROKEN_TIMELINE",
      message: issue.message,
    });
  }

  manifest.scenes.forEach((scene: SpatialScene) => {
    // 1) La caméra bouge-t-elle VRAIMENT ?
    if (isStaticPath(scene.camera)) {
      issues.push({
        scene: scene.id,
        violation: "NO_CAMERA_MOVEMENT",
        message: "la caméra ne se déplace pas : l'expérience serait un diaporama",
      });
    } else {
      const travel = distance(scene.camera.positionFrom, scene.camera.positionTo);
      measured.push(`${scene.id} : déplacement caméra ${travel.toFixed(2)} unités`);
      if (travel > MAX_SAFE_TRAVEL) {
        issues.push({
          scene: scene.id,
          violation: "EXCESSIVE_PARALLAX",
          message: `déplacement ${travel.toFixed(2)} > ${String(MAX_SAFE_TRAVEL)} : le maillage va se trouer`,
        });
      }
    }

    // 2) Le relief est-il réel ?
    if (scene.depth.strength <= 0.05) {
      issues.push({
        scene: scene.id,
        violation: "FLAT_TEXTURE",
        message: `profondeur ${String(scene.depth.strength)} : la scène serait un plan plat`,
      });
    } else {
      measured.push(`${scene.id} : relief ${String(scene.depth.strength)}`);
    }

    // 3) La position change-t-elle réellement au fil de la progression ?
    const a = cameraAt(scene.camera, 0);
    const mid = cameraAt(scene.camera, 0.5);
    const b = cameraAt(scene.camera, 1);
    if (distance(a.position, mid.position) < 0.01 || distance(mid.position, b.position) < 0.01) {
      issues.push({
        scene: scene.id,
        violation: "NO_CAMERA_MOVEMENT",
        message: "la caméra reste immobile sur une moitié de la scène",
      });
    }
  });

  // 4) Continuité de direction entre scènes consécutives.
  for (let i = 0; i < manifest.scenes.length - 1; i += 1) {
    const cur = manifest.scenes[i] as SpatialScene;
    const next = manifest.scenes[i + 1] as SpatialScene;
    const deg = directionChangeDegrees(cur.camera, next.camera);
    measured.push(`${cur.id} → ${next.id} : changement de direction ${deg.toFixed(1)}°`);
    if (deg > MAX_DIRECTION_CHANGE_DEG) {
      issues.push({
        scene: next.id,
        violation: "DISCONTINUOUS_DIRECTION",
        message: `la caméra pivote de ${deg.toFixed(0)}° au raccord : rupture de continuité`,
      });
    }
  }

  // 5) Une transition doit être SPATIALE, jamais un simple fondu.
  manifest.scenes.forEach((scene) => {
    const t = scene.transitionOut;
    if (!t) return;
    const spatialTypes = [
      "OCCLUSION",
      "PUSH_THROUGH",
      "DARK_FRAME",
      "GLASS_PASS",
      "EDGE_WIPE_SPATIAL",
      "DEPTH_WARP",
    ];
    if (!spatialTypes.includes(t.type)) {
      issues.push({
        scene: scene.id,
        violation: "CROSSFADE_ONLY",
        message: `type de transition « ${t.type} » non spatial`,
      });
    }
    // Une transition doit laisser le temps au mouvement de masquer le raccord.
    if (t.duration < 0.02) {
      issues.push({
        scene: scene.id,
        violation: "HARD_CUT",
        message: `transition trop brève (${String(t.duration)}) : le raccord se verra`,
      });
    }
  });

  const verdict: SpatialVerdict = issues.length > 0 ? "REJECT" : "REVIEW_REQUIRED";
  return {
    verdict,
    issues,
    measured,
    // Même sans défaut mesurable, personne n'a encore REGARDÉ le rendu.
    requiresVisualReview: true,
  };
}

/**
 * Promeut un rapport en PASS après une revue visuelle réelle.
 * Impossible sans avoir regardé : c'est le seul chemin vers PASS.
 */
export function confirmVisualReview(
  report: SpatialQualityReport,
  review: { looksSpatial: boolean; notes?: string[] },
): SpatialQualityReport {
  if (report.issues.length > 0) return report;
  return {
    ...report,
    verdict: review.looksSpatial ? "PASS" : "REVIEW_REQUIRED",
    measured: [...report.measured, ...(review.notes ?? [])],
    requiresVisualReview: false,
  };
}
