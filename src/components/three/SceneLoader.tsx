"use client";

import { Html, useProgress } from "@react-three/drei";
import { Spinner } from "@/components/ui/states";

/**
 * Suspense fallback rendered INSIDE the canvas while assets load. Uses drei's
 * loading progress. Pair with <Suspense fallback={<SceneLoader />}> around
 * async scene content (models, environments).
 */
export function SceneLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-muted flex flex-col items-center gap-2">
        <Spinner />
        <span className="text-xs tabular-nums">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}
