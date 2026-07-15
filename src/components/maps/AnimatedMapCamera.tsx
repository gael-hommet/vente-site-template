"use client";

import * as React from "react";
import { useMapInstance } from "./BusinessMap";
import { prefersReducedMotion } from "@/lib/accessibility/reduced-motion";

export interface AnimatedMapCameraProps {
  center: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  /** Delay before the fly-to begins, ms. */
  delay?: number;
}

/**
 * Cinematic camera move on the parent <BusinessMap>. Under reduced motion it
 * jumps instantly instead of flying, so no unexpected motion.
 */
export function AnimatedMapCamera({
  center,
  zoom = 16,
  pitch = 45,
  bearing = -20,
  delay = 400,
}: AnimatedMapCameraProps) {
  const map = useMapInstance();

  React.useEffect(() => {
    if (!map) return;
    const reduced = prefersReducedMotion();
    const t = window.setTimeout(() => {
      if (reduced) {
        map.jumpTo({ center, zoom, pitch: 0, bearing: 0 });
      } else {
        map.flyTo({ center, zoom, pitch, bearing, duration: 3000, essential: true });
      }
    }, delay);
    return () => window.clearTimeout(t);
  }, [map, center, zoom, pitch, bearing, delay]);

  return null;
}
