"use client";

import * as React from "react";
import Image from "next/image";
import { useScrubProgress } from "@/hooks/useScrubProgress";
import { prefersReducedMotion } from "@/lib/accessibility/reduced-motion";
import { cn } from "@/lib/utils";

export interface ScrollVideoProps {
  /** Video sources in priority order (WebM first, then MP4). */
  sources: { src: string; type: string }[];
  poster: string;
  alt: string;
  length?: number;
  className?: string;
  overlay?: React.ReactNode;
  /** Scrub progress 0..1 — lets a parent synchronise chapters/overlays. */
  onProgress?: (progress: number) => void;
  /** Fires when the first frame is decoded (poster layer fades out). */
  onReadyChange?: (ready: boolean) => void;
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
  onProgress,
  onReadyChange,
}: ScrollVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const durationRef = React.useRef(0);
  const reduced = typeof window !== "undefined" && prefersReducedMotion();
  // Tant que la première image n'est pas décodée, on garde un calque poster
  // AU-DESSUS de la vidéo : c'est ce qui évite le flash noir au montage et
  // pendant les premiers seeks (l'attribut `poster` seul n'y suffit pas).
  const [ready, setReady] = React.useState(false);

  const markReady = React.useCallback(() => {
    setReady((was) => {
      if (!was) onReadyChange?.(true);
      return true;
    });
  }, [onReadyChange]);

  const { ref } = useScrubProgress<HTMLDivElement>({
    start: "top top",
    end: `+=${length * 100}%`,
    pin: true,
    scrub: 0.3,
    enabled: !reduced,
    onProgress: (p) => {
      onProgress?.(p);
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
          onLoadedData={markReady}
          onSeeked={markReady}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
        {/* Calque poster : opaque jusqu'à la première image décodée.
            `next/image` (comme MediaFallback) : optimisé, priorisé car au-dessus
            de la ligne de flottaison. Décoratif → alt vide + aria-hidden. */}
        <Image
          src={poster}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          priority
          className={cn(
            "pointer-events-none object-cover transition-opacity duration-500",
            ready ? "opacity-0" : "opacity-100",
          )}
        />
        {overlay && <div className="pointer-events-none absolute inset-0">{overlay}</div>}
      </div>
    </div>
  );
}
