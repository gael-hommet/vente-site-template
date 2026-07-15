"use client";

import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { useQuality } from "@/hooks/useQuality";

/**
 * Reasonable, restrained postprocessing. ONLY mounted on ULTRA (the quality
 * budget disables postprocessing on BALANCED/LITE). Keep effects subtle — this
 * is production commercial work, not a demo reel.
 */
export function PostFX() {
  const { budget } = useQuality();
  if (!budget.postprocessing) return null;

  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.35} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette eskil={false} offset={0.15} darkness={0.6} />
      <SMAA />
    </EffectComposer>
  );
}
