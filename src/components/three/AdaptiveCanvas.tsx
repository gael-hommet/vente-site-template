"use client";

import * as React from "react";
import { WebGLBoundary } from "./WebGLBoundary";
import { ThreeCanvas, type ThreeCanvasProps } from "./ThreeCanvas";
import { SceneLoader } from "./SceneLoader";
import { useQuality } from "@/hooks/useQuality";
import type { WebGLFallbackProps } from "./WebGLFallback";

export interface AdaptiveCanvasProps extends Omit<ThreeCanvasProps, "fallback"> {
  /** Fallback shown when WebGL is missing, tier is LITE, or a scene errors. */
  fallback: WebGLFallbackProps;
  /** Force the fallback regardless of capability (e.g. author preference). */
  forceFallback?: boolean;
  /** Aspect wrapper className (the canvas fills this box). */
  className?: string;
}

/**
 * The one-stop 3D mount: WebGL detection + error boundary + quality-aware canvas
 * + in-canvas suspense loader + non-WebGL fallback. LITE tier renders the
 * fallback (poster/video) instead of booting WebGL.
 */
export function AdaptiveCanvas({
  fallback,
  forceFallback = false,
  className,
  children,
  ...canvasProps
}: AdaptiveCanvasProps) {
  const { tier } = useQuality();
  const liteFallback = tier === "LITE";

  return (
    <div className={className}>
      <WebGLBoundary fallback={fallback} forceFallback={forceFallback || liteFallback}>
        <ThreeCanvas {...canvasProps}>
          <React.Suspense fallback={<SceneLoader />}>{children}</React.Suspense>
        </ThreeCanvas>
      </WebGLBoundary>
    </div>
  );
}
