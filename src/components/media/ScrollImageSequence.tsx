"use client";

import * as React from "react";
import { ImageSequencePlayer, type ImageSequenceHandle } from "./ImageSequencePlayer";
import { useScrubProgress } from "@/hooks/useScrubProgress";
import { cn } from "@/lib/utils";

export interface ScrollImageSequenceProps {
  frames: string[];
  alt: string;
  /** Scroll length of the scrub, in viewport heights. */
  length?: number;
  className?: string;
  overlay?: React.ReactNode;
}

/**
 * Scroll-scrubbed image sequence. A tall spacer drives a pinned sticky canvas;
 * scroll position → frame. Pinning is auto-dropped under reduced motion (the
 * sequence still advances as the user scrolls normally). Mode "B" of the three
 * controlled-video engines.
 */
export function ScrollImageSequence({
  frames,
  alt,
  length = 3,
  className,
  overlay,
}: ScrollImageSequenceProps) {
  const playerRef = React.useRef<ImageSequenceHandle>(null);
  const { ref } = useScrubProgress<HTMLDivElement>({
    start: "top top",
    end: `+=${length * 100}%`,
    pin: true,
    scrub: 0.3,
    onProgress: (p) => playerRef.current?.seek(p),
  });

  return (
    <div ref={ref} className={className} style={{ height: `${length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <ImageSequencePlayer ref={playerRef} frames={frames} alt={alt} preload="window" />
        {overlay && <div className={cn("pointer-events-none absolute inset-0")}>{overlay}</div>}
      </div>
    </div>
  );
}
