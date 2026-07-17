import type { CinematicEngine, QualityTier } from "@/types";
import type { LazyComponent, RequiresFallback, Skippable } from "@/ace/core";

/**
 * Scene Library contracts. A scene cannot be registered without:
 * - a non-WebGL fallback with a meaningful `alt` (RequiresFallback),
 * - an explicit skippable declaration (Skippable),
 * - the minimum tier at which the rich version runs (below → fallback).
 *
 * The registry stores lazy loaders only: listing scenes (ACE Lab, generator)
 * never imports three.js.
 */
export interface SceneDefinition extends RequiresFallback, Skippable {
  /** Dotted id, e.g. "demo.logo-reveal". */
  id: string;
  title: string;
  description: string;
  /** Delivery mechanism at full quality (fallback covers the rest). */
  engine: CinematicEngine;
  /** Lowest tier that boots the rich version. "LITE" means always rich. */
  minTier: QualityTier;
  /** Asset paths the scene needs (models, posters, sequences). */
  assets: readonly string[];
  /** Lazily loads the scene component (client-only, mounted via AdaptiveCanvas). */
  load: LazyComponent;
}
