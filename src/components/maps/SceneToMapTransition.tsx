"use client";

import * as React from "react";
import { useScrubProgress } from "@/hooks/useScrubProgress";
import { cn } from "@/lib/utils";

export interface SceneToMapTransitionProps {
  /** The cinematic scene (poster/3D/sequence) shown first. */
  scene: React.ReactNode;
  /** The map, revealed as the camera "rises" — mounted lazily. */
  map: React.ReactNode;
  className?: string;
  length?: number;
}

/**
 * Implements the conceptual transition: cinematic scene → camera rises → the
 * backdrop becomes a map → the business appears (add markers/CTA in `map`).
 * Crossfades scene↔map on scroll. The map is only mounted once the transition
 * begins, so MapLibre stays out of the initial load. Reduced-motion safe (the
 * pin is dropped; both layers remain reachable).
 */
export function SceneToMapTransition({
  scene,
  map,
  className,
  length = 2,
}: SceneToMapTransitionProps) {
  const [p, setP] = React.useState(0);
  const { ref } = useScrubProgress<HTMLDivElement>({
    start: "top top",
    end: `+=${length * 100}%`,
    pin: true,
    scrub: 0.4,
    onProgress: setP,
  });

  const showMap = p > 0.15;
  const sceneOpacity = 1 - Math.min(1, Math.max(0, (p - 0.2) / 0.4));
  const mapOpacity = Math.min(1, Math.max(0, (p - 0.35) / 0.4));

  return (
    <div ref={ref} className={className} style={{ height: `${length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 transition-none"
          style={{ opacity: sceneOpacity, transform: `scale(${1 + p * 0.15})` }}
        >
          {scene}
        </div>
        <div className={cn("absolute inset-0", showMap ? "" : "pointer-events-none")} style={{ opacity: mapOpacity }}>
          {showMap && map}
        </div>
      </div>
    </div>
  );
}
