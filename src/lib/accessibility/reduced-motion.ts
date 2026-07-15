/**
 * Reduced-motion detection helpers. The single source of truth for whether the
 * engine should suppress non-essential motion. Consumed by Motion wrappers,
 * Lenis, GSAP scenes, R3F loops and media players.
 */

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Synchronous check. Returns false on the server. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Subscribe to changes. Returns an unsubscribe function. */
export function onReducedMotionChange(cb: (reduced: boolean) => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  const handler = (e: MediaQueryListEvent) => cb(e.matches);
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
