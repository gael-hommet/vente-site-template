"use client";

import * as React from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

export type ModelProps = ThreeElements["group"] & {
  /** Path to a .glb/.gltf under /public. Optimize it via `pnpm assets:models`. */
  src: string;
  /**
   * Draco decoder path (files copied to /public by the asset pipeline) or true
   * to use the drei default. Only enable if the model is Draco-compressed.
   */
  draco?: boolean | string;
};

/**
 * Loads and renders a GLB model. Wrap in <Suspense fallback={<SceneLoader />}>.
 * Prefer compressed models (Draco/Meshopt) produced by `pnpm assets:models`.
 */
export function Model({ src, draco = false, ...groupProps }: ModelProps) {
  const { scene } = useGLTF(src, draco === true ? undefined : draco || undefined);
  // Clone so the same GLB can be instanced in multiple places safely.
  const cloned = React.useMemo(() => scene.clone(true), [scene]);
  return (
    <group {...groupProps}>
      <primitive object={cloned} />
    </group>
  );
}

/** Preload a model (call at module scope or in an effect). */
export function preloadModel(src: string) {
  useGLTF.preload(src);
}
