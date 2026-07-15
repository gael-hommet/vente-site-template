/**
 * JS mirror of the CSS motion tokens, for use by Motion (Framer) and GSAP where
 * a JS value is required. Keep in sync with globals.css.
 */

export const DURATION = {
  fast: 0.15,
  base: 0.28,
  slow: 0.5,
  cinematic: 0.9,
} as const;

/** Cubic-bezier control points, usable by both Motion and GSAP (via CustomEase). */
export const EASE = {
  outSoft: [0.16, 1, 0.3, 1],
  inOutSoft: [0.65, 0, 0.35, 1],
  emphasized: [0.2, 0, 0, 1],
} as const;

/** GSAP-style bezier strings. */
export const GSAP_EASE = {
  outSoft: "power3.out",
  inOutSoft: "power2.inOut",
  emphasized: "expo.out",
} as const;

/** Shared Motion transition presets. */
export const TRANSITION = {
  soft: { duration: DURATION.base, ease: EASE.outSoft },
  quick: { duration: DURATION.fast, ease: EASE.outSoft },
  spring: { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.8 },
  springSoft: { type: "spring" as const, stiffness: 180, damping: 26, mass: 1 },
} as const;
