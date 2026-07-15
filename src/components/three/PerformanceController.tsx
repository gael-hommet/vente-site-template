"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { useQualityStore } from "@/lib/performance/store";

/**
 * Runtime FPS guard (drei PerformanceMonitor). If the device can't sustain the
 * target frame rate, it steps the global quality tier down so DPR/effects drop
 * automatically. Place inside <Canvas>.
 */
export function PerformanceController() {
  const setOverride = useQualityStore((s) => s.setOverride);
  const tier = useQualityStore((s) => s.tier);

  return (
    <PerformanceMonitor
      onDecline={() => {
        if (tier === "ULTRA") setOverride("BALANCED");
        else if (tier === "BALANCED") setOverride("LITE");
      }}
    />
  );
}
