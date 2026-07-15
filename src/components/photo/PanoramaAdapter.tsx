"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PanoramaAdapterProps {
  /** Wide (equirectangular-ish) image. */
  src: string;
  alt: string;
  className?: string;
}

/**
 * PanoramaAdapter — a lightweight, honest 360°-style viewer: a wide panoramic
 * image the visitor drags horizontally (and can scan with the keyboard). This is
 * an APPROXIMATE pan of a flat panorama, NOT a reconstructed 3D space — do not
 * present it as a true spherical tour unless you have real 360 capture. For a
 * genuine equirectangular projection, mount a textured sphere via R3F (see
 * docs) — this adapter is the dependency-free, always-works fallback.
 */
export function PanoramaAdapter({ src, alt, className }: PanoramaAdapterProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ startX: number; startScroll: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startScroll: el.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el || !drag.current) return;
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return (
    <div
      ref={scrollerRef}
      role="img"
      aria-label={`${alt} (panorama — glissez ou utilisez les flèches pour explorer)`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={(e) => {
        const el = scrollerRef.current;
        if (!el) return;
        if (e.key === "ArrowRight") el.scrollLeft += 60;
        if (e.key === "ArrowLeft") el.scrollLeft -= 60;
      }}
      className={cn(
        "no-scrollbar relative cursor-grab overflow-x-auto overflow-y-hidden rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-[var(--ring)] active:cursor-grabbing",
        className,
      )}
    >
      {/* Intrinsic-width image; container scrolls horizontally. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full max-w-none object-cover" draggable={false} />
    </div>
  );
}
