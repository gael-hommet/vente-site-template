"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useQuality } from "@/hooks/useQuality";

/**
 * Studio lighting environment. Uses procedural Lightformers (no external HDR
 * download required), so it works fully offline. On LITE/BALANCED the setup is
 * simplified. Wrap in <Suspense>.
 */
export function EnvironmentRig({ intensity = 1 }: { intensity?: number }) {
  const { tier } = useQuality();

  return (
    <Environment resolution={tier === "ULTRA" ? 512 : 256}>
      <Lightformer
        intensity={2 * intensity}
        position={[0, 4, -6]}
        scale={[10, 6, 1]}
        color="white"
      />
      <Lightformer
        intensity={1.2 * intensity}
        position={[-6, 2, 2]}
        scale={[6, 6, 1]}
        color="#dfe7ff"
      />
      {tier === "ULTRA" && (
        <Lightformer
          intensity={0.8 * intensity}
          position={[6, -2, 4]}
          scale={[6, 6, 1]}
          color="#ffe8d6"
        />
      )}
    </Environment>
  );
}
