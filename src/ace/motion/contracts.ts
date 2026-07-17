import type { LazyComponent, ReducedMotionPolicy } from "@/ace/core";

/**
 * Motion Library contracts. The animation separation law is encoded in the
 * discriminated union: a Motion/CSS recipe can only be a micro-interaction, a
 * GSAP recipe can only be cinematic AND must be declared skippable (literal
 * `true`) — pinned/scrubbed sequences never trap the user or hide the CTA.
 */

interface MotionRecipeBase {
  /** Dotted id, e.g. "reveal.soft". */
  id: string;
  title: string;
  description: string;
  /** What the recipe does under prefers-reduced-motion. */
  reducedMotion: ReducedMotionPolicy;
  /** Lazily loads the implementing component from src/components/motion. */
  load: LazyComponent;
}

export interface MicroMotionRecipe extends MotionRecipeBase {
  engine: "motion" | "css";
  intent: "micro";
}

export interface CinematicMotionRecipe extends MotionRecipeBase {
  engine: "gsap";
  intent: "cinematic";
  /** Non-negotiable: cinematic sequences are always escapable. */
  skippable: true;
}

export type MotionRecipe = MicroMotionRecipe | CinematicMotionRecipe;
