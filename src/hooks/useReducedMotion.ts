"use client";

import { REDUCED_MOTION_QUERY } from "@/lib/accessibility/reduced-motion";
import { useMediaQuery } from "./useMediaQuery";

/**
 * React hook wrapper around the reduced-motion media query.
 * SSR-safe: returns false until mounted.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}
