/**
 * ace-motion — single entry point for everything animation.
 *
 * Orchestration (existing, verified implementations — re-exported, not
 * duplicated):
 * - `registerGsap` / `gsap` / `ScrollTrigger`: the only GSAP setup path.
 * - `SmoothScrollProvider` / `useSmoothScroll`: Lenis wired to the GSAP ticker,
 *   destroyed on unmount, disabled under prefers-reduced-motion.
 * - `DURATION` / `EASE` / `GSAP_EASE` / `TRANSITION`: JS mirrors of the CSS
 *   motion tokens.
 *
 * Vocabulary:
 * - `MOTION_RECIPES` / `getMotionRecipe`: the named Motion Library.
 */

export { registerGsap, gsap, ScrollTrigger } from "@/lib/animation/gsap";
export { SmoothScrollProvider, useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
export { DURATION, EASE, GSAP_EASE, TRANSITION } from "@/config/motion";

export type { MotionRecipe, MicroMotionRecipe, CinematicMotionRecipe } from "./contracts";
export { MOTION_RECIPES, getMotionRecipe, hasMotionRecipe } from "./registry";
