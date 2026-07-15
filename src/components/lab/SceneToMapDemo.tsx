"use client";

import { SceneToMapTransition } from "@/components/maps/SceneToMapTransition";
import { BusinessMap } from "@/components/maps/BusinessMap";
import { LocationMarker } from "@/components/maps/LocationMarker";
import { ShaderGradientBackground } from "@/components/effects/ShaderGradientBackground";
import { LiquidMetalLogo } from "@/components/effects/LiquidMetalLogo";

const DEMO_CENTER: [number, number] = [2.3522, 48.8566];

/**
 * Demonstrates the conceptual transition: cinematic scene → camera rises → the
 * backdrop becomes a map → the (fictitious) business appears. Scroll to trigger.
 */
export function SceneToMapDemo() {
  return (
    <SceneToMapTransition
      length={2}
      className="overflow-hidden rounded-[var(--radius-lg)] border border-border"
      scene={
        <div className="relative grid h-full w-full place-items-center bg-surface-2">
          <ShaderGradientBackground />
          <LiquidMetalLogo text="SCÈNE" className="text-5xl sm:text-7xl" />
        </div>
      }
      map={
        <BusinessMap
          center={DEMO_CENTER}
          zoom={15}
          className="h-full w-full"
          fallback={{ label: "Position fictive (démonstration)", lat: DEMO_CENTER[1], lng: DEMO_CENTER[0] }}
        >
          <LocationMarker position={DEMO_CENTER} title="Position fictive (démo)" />
        </BusinessMap>
      }
    />
  );
}
