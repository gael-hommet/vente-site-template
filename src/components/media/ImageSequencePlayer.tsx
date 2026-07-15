"use client";

import * as React from "react";

export interface ImageSequenceHandle {
  /** Seek to a 0..1 position across the frame set. */
  seek: (progress: number) => void;
}

export interface ImageSequencePlayerProps {
  /** Ordered frame URLs (AVIF/WebP recommended, produced by the asset pipeline). */
  frames: string[];
  alt: string;
  className?: string;
  /**
   * Loading strategy:
   * - "window": only load frames near the current position (default; memory-safe).
   * - "sequential": background-load every frame in order after the first paint.
   */
  preload?: "window" | "sequential";
  /** How many frames ahead/behind to keep decoded in "window" mode. */
  windowSize?: number;
}

/**
 * Canvas-2D image-sequence player. Renders the frame matching a 0..1 progress,
 * driven imperatively via ref (`seek`) — so scroll updates never trigger React
 * re-renders. First frame acts as an immediate poster; the rest load lazily so
 * we never blast hundreds of requests on first paint. Handles DPR + resize.
 */
export const ImageSequencePlayer = React.forwardRef<ImageSequenceHandle, ImageSequencePlayerProps>(
  function ImageSequencePlayer({ frames, alt, className, preload = "window", windowSize = 8 }, ref) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const cacheRef = React.useRef<Map<number, HTMLImageElement>>(new Map());
    const progressRef = React.useRef(0);
    const rafRef = React.useRef<number | null>(null);
    const lastDrawn = React.useRef(-1);

    const frameCount = frames.length;

    const ensureFrame = React.useCallback(
      (index: number): HTMLImageElement | undefined => {
        if (index < 0 || index >= frameCount) return undefined;
        const cache = cacheRef.current;
        let img = cache.get(index);
        if (!img) {
          img = new Image();
          img.decoding = "async";
          img.src = frames[index];
          cache.set(index, img);
        }
        return img;
      },
      [frames, frameCount],
    );

    const draw = React.useCallback(() => {
      rafRef.current = null;
      const canvas = canvasRef.current;
      if (!canvas || frameCount === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const index = Math.min(frameCount - 1, Math.max(0, Math.round(progressRef.current * (frameCount - 1))));
      // Preload a window around the target.
      const lo = Math.max(0, index - windowSize);
      const hi = Math.min(frameCount - 1, index + windowSize);
      for (let i = lo; i <= hi; i++) ensureFrame(i);

      const img = ensureFrame(index);
      if (!img || !img.complete || img.naturalWidth === 0) {
        // Target not ready → keep last good frame; retry next tick.
        schedule();
        return;
      }
      if (index === lastDrawn.current) return;
      lastDrawn.current = index;

      // Cover-fit draw with DPR scaling.
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
    }, [ensureFrame, frameCount, windowSize]);

    const schedule = React.useCallback(() => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(draw);
    }, [draw]);

    React.useImperativeHandle(
      ref,
      () => ({
        seek: (progress: number) => {
          progressRef.current = Math.min(1, Math.max(0, progress));
          schedule();
        },
      }),
      [schedule],
    );

    // First paint + optional sequential background load + resize handling.
    React.useEffect(() => {
      ensureFrame(0);
      schedule();

      let cancelled = false;
      if (preload === "sequential") {
        let i = 0;
        const loadNext = () => {
          if (cancelled || i >= frameCount) return;
          ensureFrame(i++);
          // Yield between loads to avoid a request stampede.
          window.setTimeout(loadNext, 16);
        };
        loadNext();
      }

      const onResize = () => {
        lastDrawn.current = -1;
        schedule();
      };
      window.addEventListener("resize", onResize);
      return () => {
        cancelled = true;
        window.removeEventListener("resize", onResize);
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      };
    }, [ensureFrame, schedule, preload, frameCount]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        role="img"
        aria-label={alt}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    );
  },
);
