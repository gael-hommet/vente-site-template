/**
 * ACE SPATIAL CINEMA — barrel.
 *
 * Transforme des images RÉELLES en scènes WebGL parcourues par une caméra
 * pilotée au scroll. Jamais un diaporama : profondeur réelle (déplacement de
 * sommets) + transitions spatiales. Coût média 0 €.
 *
 * Voir docs/ACE-SPATIAL-CINEMA.md.
 */

export type {
  SpatialMode,
  SpatialManifest,
  SpatialScene,
  SpatialChapter,
  SpatialAnchor,
  SceneTransition,
  TransitionType,
  CameraPath,
  CameraMove,
  DepthSettings,
  Vec3,
} from "./types";
export { SPATIAL_LIMITS } from "./types";

export {
  resolveTimeline,
  localProgressOf,
  transitionWindow,
  distributeScenes,
  validateTimeline,
  activeChapter,
  clamp01,
  type TimelineState,
  type TransitionState,
  type TimelineIssue,
} from "./timeline";

export {
  cameraAt,
  cameraPathFor,
  lerp,
  lerpVec3,
  easeInOutCubic,
  easeOutCubic,
  distance,
  isStaticPath,
  directionChangeDegrees,
  vec3,
  CAMERA_MOVES,
  type CameraState,
} from "./camera-path";

export {
  chooseSpatialMode,
  requiresWebGL,
  MAX_SPATIAL_SCENES,
  type SpatialAssets,
  type SpatialDecision,
  type SpatialBlocker,
} from "./strategy";

export {
  assessSpatialQuality,
  confirmVisualReview,
  MAX_SAFE_TRAVEL,
  MAX_DIRECTION_CHANGE_DEG,
  type SpatialVerdict,
  type SpatialViolation,
  type SpatialIssue,
  type SpatialQualityReport,
} from "./spatial-quality";
