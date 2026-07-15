"use client";

import * as React from "react";
import { useOptionalModule } from "@/lib/optional/load";
import { WebGLFallback } from "@/components/three/WebGLFallback";
import { useQuality } from "@/hooks/useQuality";

export interface SplineSceneProps {
  /** Spline scene URL (.splinecode). */
  sceneUrl?: string;
  poster: string;
  alt: string;
  className?: string;
}

interface SplineModule {
  default: React.ComponentType<{ scene: string; className?: string }>;
}

/**
 * ADAPTER-ONLY. @splinetool/react-spline is NOT installed by default and Spline
 * is a WebGL runtime. When installed (pnpm add @splinetool/react-spline) with a
 * scene URL, and the device is capable (not LITE), it mounts; otherwise it shows
 * the poster fallback. Build never breaks.
 */
export function SplineScene({ sceneUrl, poster, alt, className }: SplineSceneProps) {
  const { tier } = useQuality();
  const { status, mod } = useOptionalModule<SplineModule>("@splinetool/react-spline");

  if (!sceneUrl || tier === "LITE" || status !== "ready" || !mod) {
    return <WebGLFallback poster={poster} alt={alt} className={className} />;
  }
  const Spline = mod.default;
  return <Spline scene={sceneUrl} className={className} />;
}
