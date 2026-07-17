import type { ComponentType } from "react";
import type { QualityTier } from "@/types";
import type { WebGLFallbackProps } from "@/components/three/WebGLFallback";

/**
 * Shared engine contracts. These types encode the non-negotiable house rules
 * (fallback obligatoire, reduced-motion honoré, expériences passables) so that
 * violating a rule is a TYPE error, not a review comment.
 */

/** Where an animated experience runs. Mirrors the animation separation law. */
export type AnimationEngine =
  | "motion" // Motion (Framer) — micro-interactions only
  | "gsap" // GSAP + ScrollTrigger — scroll cinematics only
  | "css"; // native CSS — when it does the job better

/** What happens to an experience under prefers-reduced-motion. */
export type ReducedMotionPolicy =
  | "final-state" // render the end state immediately, no animation
  | "disabled" // the effect simply does not mount
  | "static-fallback"; // replaced by the declared static fallback (scenes)

/** Something gated by the ULTRA / BALANCED / LITE quality tiers. */
export interface TierAware {
  /** Lowest tier at which the rich version runs; below it, the fallback shows. */
  minTier: Exclude<QualityTier, "LITE"> | "LITE";
}

/**
 * A long-form experience (intro, pinned chapter…) MUST be skippable and must
 * never block scroll or the CTA. `skippable: true` is the only legal value for
 * pinned/cinematic entries — the type keeps it visible in every definition.
 */
export interface Skippable {
  skippable: boolean;
}

/**
 * Anything that can render via WebGL MUST declare a non-WebGL fallback with a
 * meaningful `alt`. The fallback is not optional anywhere in the engine.
 */
export interface RequiresFallback {
  fallback: WebGLFallbackProps & { alt: string };
}

/** Lazily loaded React component (keeps registries metadata-light). */
export type LazyComponent = () => Promise<ComponentType<never>>;
