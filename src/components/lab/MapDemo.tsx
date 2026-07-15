"use client";

import { BusinessMap } from "@/components/maps/BusinessMap";
import { LocationMarker } from "@/components/maps/LocationMarker";
import { AnimatedMapCamera } from "@/components/maps/AnimatedMapCamera";

// CLEARLY FICTITIOUS demo location — not a real business.
const DEMO_CENTER: [number, number] = [2.3522, 48.8566];

export function MapDemo() {
  return (
    <BusinessMap
      center={DEMO_CENTER}
      zoom={13}
      className="aspect-[16/10] w-full"
      fallback={{
        label: "Position fictive (démonstration)",
        lat: DEMO_CENTER[1],
        lng: DEMO_CENTER[0],
      }}
    >
      <LocationMarker position={DEMO_CENTER} title="Position fictive (démo)" />
      <AnimatedMapCamera center={DEMO_CENTER} zoom={15} />
    </BusinessMap>
  );
}
