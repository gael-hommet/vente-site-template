"use client";

import { useEffect } from "react";
import { useQualityStore } from "@/lib/performance/store";
import { onReducedMotionChange } from "@/lib/accessibility/reduced-motion";

/**
 * Runs device capability detection once on mount and keeps the quality tier in
 * sync when the user toggles reduced-motion. Backed by a global zustand store,
 * so any component can read the tier via `useQuality()` without prop drilling.
 *
 * Mount this once, high in the tree (e.g. in the root layout body).
 */
export function DeviceQualityProvider({ children }: { children: React.ReactNode }) {
  const detect = useQualityStore((s) => s.detect);

  useEffect(() => {
    detect();
    // Reduced-motion can flip at runtime → re-detect (may drop to LITE).
    const off = onReducedMotionChange(() => detect());
    return off;
  }, [detect]);

  return <>{children}</>;
}
