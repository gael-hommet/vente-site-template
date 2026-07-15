"use client";

import * as React from "react";
import { useScrubProgress } from "@/hooks/useScrubProgress";
import { prefersReducedMotion } from "@/lib/accessibility/reduced-motion";

export interface ScrollVideoProps {
  /** Video sources in priority order (WebM first, then MP4). */
  sources: { src: string; type: string }[];
  poster: string;
  alt: string;
  length?: number;
  className?: string;
  overlay?: React.ReactNode;
}

/**
 * Scroll-scrubbed native <video> (mode "C"). Drives `currentTime` from scroll —
 * NEVER autoplays with sound; muted + playsInline + preload metadata. Under
 * reduced motion it shows the poster and stays paused (no scrubbing). If
 * metadata/decoding is unavailable the poster remains as a graceful fallback.
 */
export function ScrollVideo({
  sources,
  poster,
  alt,
  length = 3,
  className,
  overlay,
}: ScrollVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const durationRef = React.useRef(0);
  const reduced = typeof window !== "undefined" && prefersReducedMotion();

  const { ref } = useScrubProgress<HTMLDivElement>({
    start: "top top",
    end: `+=${length * 100}%`,
    pin: true,
    scrub: 0.3,
    enabled: !reduced,
    onProgress: (p) => {
      const v = videoRef.current;
      if (!v || !durationRef.current) return;
      // Seek smoothly; guard against seeking before metadata is ready.
      const t = p * durationRef.current;
      if (Number.isFinite(t)) v.currentTime = t;
    },
  });

  return (
    <div ref={ref} className={className} style={{ height: `${length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={poster}
          muted
          playsInline
          preload="metadata"
          aria-label={alt}
          onLoadedMetadata={(e) => {
            durationRef.current = e.currentTarget.duration || 0;
          }}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
        {overlay && <div className="pointer-events-none absolute inset-0">{overlay}</div>}
      </div>
    </div>
  );
}
