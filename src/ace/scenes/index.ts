/**
 * ace-scenes — the adaptive WebGL system.
 *
 * Rendering chain (existing, verified — re-exported, not duplicated):
 * WebGLBoundary (SSR-safe, error boundary, detection) → AdaptiveCanvas
 * (tier-aware, LITE never boots WebGL) → fallback WebGLFallback (mandatory).
 * Budgets per tier live in QUALITY_BUDGETS; detection in detectDeviceProfile.
 *
 * Vocabulary: SCENES / getScene — the Scene Library.
 */

export {
  AdaptiveCanvas,
  WebGLBoundary,
  WebGLFallback,
  DeviceQualityProvider,
  type AdaptiveCanvasProps,
  type WebGLBoundaryProps,
  type WebGLFallbackProps,
} from "@/components/three";
export { QUALITY_BUDGETS, detectDeviceProfile, pickTier } from "@/lib/performance/quality";
export { useQuality } from "@/hooks/useQuality";

export type { SceneDefinition } from "./contracts";
export { SCENES, getScene, hasScene } from "./registry";
