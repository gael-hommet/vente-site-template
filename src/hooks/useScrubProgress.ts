"use client";

import * as React from "react";
import { registerGsap, ScrollTrigger } from "@/lib/animation/gsap";
import { prefersReducedMotion } from "@/lib/accessibility/reduced-motion";

export interface ScrubOptions {
  start?: string;
  end?: string;
  /** Pin the trigger element while scrubbing (auto-disabled under reduced motion). */
  pin?: boolean;
  /** Smoothing seconds, or true for instant tie-to-scroll. */
  scrub?: number | boolean;
  onProgress?: (progress: number) => void;
  onEnter?: () => void;
  onLeave?: () => void;
  enabled?: boolean;
}

/**
 * Core scroll-scrub primitive built on GSAP ScrollTrigger. Maps a container's
 * scroll range to a 0..1 progress, exposed via a ref and an onProgress callback.
 * Powers pinned scenes, image sequences and scrubbed video.
 *
 * Reduced motion: pinning is force-disabled (no scroll hijack); scrub still maps
 * progress so content and CTAs remain reachable by normal scrolling.
 */
export function useScrubProgress<T extends HTMLElement = HTMLDivElement>(opts: ScrubOptions = {}) {
  const ref = React.useRef<T | null>(null);
  const progress = React.useRef(0);
  const { start, end, pin, scrub, onProgress, onEnter, onLeave, enabled = true } = opts;

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    registerGsap();
    const reduced = prefersReducedMotion();

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: start ?? "top top",
      end: end ?? "+=100%",
      pin: reduced ? false : (pin ?? false),
      scrub: scrub ?? true,
      onUpdate: (self) => {
        progress.current = self.progress;
        onProgress?.(self.progress);
      },
      onEnter: () => onEnter?.(),
      onLeaveBack: () => onLeave?.(),
    });

    return () => {
      trigger.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, start, end, pin, scrub]);

  return { ref, progress };
}
