"use client";

import * as React from "react";
import { useScrubProgress } from "@/hooks/useScrubProgress";

export interface PinnedSequenceProps {
  /** Scroll length of the pin, as viewport heights. */
  length?: number;
  className?: string;
  /** Render-prop receiving live 0..1 progress. */
  children: (progress: number) => React.ReactNode;
  onProgress?: (p: number) => void;
}

/**
 * Pins a full-viewport stage and drives a 0..1 progress from scroll — the
 * canonical "controlled film" container. GSAP owns this (cinematic timeline).
 * Under reduced motion the pin is dropped so the section simply scrolls.
 */
export function PinnedSequence({
  length = 3,
  className,
  children,
  onProgress,
}: PinnedSequenceProps) {
  const [p, setP] = React.useState(0);
  const { ref } = useScrubProgress<HTMLDivElement>({
    start: "top top",
    end: `+=${length * 100}%`,
    pin: true,
    scrub: 0.5,
    onProgress: (value) => {
      setP(value);
      onProgress?.(value);
    },
  });

  return (
    <div ref={ref} className={className} style={{ height: `${length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {children(p)}
      </div>
    </div>
  );
}
