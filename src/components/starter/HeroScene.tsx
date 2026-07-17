"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { AdaptiveCanvas } from "@/components/three/AdaptiveCanvas";
import { getScene, SCENES } from "@/ace/scenes/registry";

/**
 * Starter hero visual: mounts a Scene Library entry through AdaptiveCanvas.
 * The scene id is a prop so the generator can swap it per client. Everything
 * the house rules require comes from the registry contract: mandatory
 * fallback (shown in SSR, LITE tier, or on WebGL failure) and lazy loading —
 * three.js never enters the initial bundle.
 */

// One stable dynamic component per registry scene, created at module load —
// never during render. dynamic() wrappers are lazy: nothing downloads until
// a scene actually mounts through AdaptiveCanvas.
const SCENE_COMPONENTS: Readonly<Record<string, ComponentType<object>>> = Object.fromEntries(
  SCENES.map((definition) => [
    definition.id,
    dynamic(
      () =>
        definition.load().then((Scene) => ({
          // Registry scenes take no props; widen from the registry's strict type.
          default: Scene as ComponentType<object>,
        })),
      { ssr: false, loading: () => null },
    ),
  ]),
);

export function HeroScene({ sceneId = "demo.logo-reveal" }: { sceneId?: string }) {
  const scene = getScene(sceneId);
  const Scene = SCENE_COMPONENTS[sceneId];
  if (!Scene) return null;

  return (
    <AdaptiveCanvas
      className="border-border bg-surface-2 aspect-[16/11] w-full overflow-hidden rounded-[var(--radius-xl)] border sm:aspect-[16/9]"
      fallback={scene.fallback}
    >
      <Scene />
    </AdaptiveCanvas>
  );
}
