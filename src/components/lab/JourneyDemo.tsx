"use client";

import * as React from "react";
import { AdaptiveCanvas } from "@/components/three/AdaptiveCanvas";
import { VehicleJourneyScene, VEHICLE_JOURNEY_ID } from "@/scenes/vehicle-journey/VehicleJourneyScene";
import { useScrubProgress } from "@/hooks/useScrubProgress";
import { useSceneStore } from "@/lib/three/scene-store";
import { ChapterTimeline, chapterIndexFromProgress, type Chapter } from "@/components/motion/ChapterTimeline";

const CHAPTERS: Chapter[] = [
  { id: "intro", label: "Entrée" },
  { id: "corridor", label: "Corridor" },
  { id: "turn", label: "Virage" },
  { id: "arrival", label: "Arrivée" },
];

/**
 * Scroll-controlled camera journey: a tall spacer (pinned by GSAP) drives the
 * R3F camera through primitives via the scene store. This is the core
 * "visitor controls the film with scroll" pattern — 3D + GSAP + Lenis together.
 */
export function JourneyDemo() {
  const setProgress = useSceneStore((s) => s.setProgress);
  const [active, setActive] = React.useState(0);

  const { ref } = useScrubProgress<HTMLDivElement>({
    start: "top top",
    end: "+=300%",
    pin: true,
    scrub: 0.4,
    onProgress: (p) => {
      setProgress(VEHICLE_JOURNEY_ID, p);
      setActive(chapterIndexFromProgress(p, CHAPTERS.length));
    },
  });

  return (
    <div ref={ref} style={{ height: "400vh" }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden rounded-[var(--radius-lg)]">
        <AdaptiveCanvas
          className="h-full w-full"
          fallback={{ poster: "/assets/poster.svg", alt: "Voyage cinématique (fallback image)" }}
        >
          <VehicleJourneyScene />
        </AdaptiveCanvas>
        <div className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2">
          <ChapterTimeline chapters={CHAPTERS} activeIndex={active} />
        </div>
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-xs text-white backdrop-blur-sm">
          Faites défiler pour piloter la caméra
        </p>
      </div>
    </div>
  );
}
