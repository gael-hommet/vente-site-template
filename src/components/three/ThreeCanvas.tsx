"use client";

import * as React from "react";
import { Canvas, type CanvasProps, useThree } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { useQuality } from "@/hooks/useQuality";
import { PerformanceController } from "./PerformanceController";

/**
 * Garde de perte de contexte WebGL. `preventDefault()` sur `webglcontextlost`
 * est INDISPENSABLE : sans lui le navigateur ne restaure jamais le contexte
 * (scène figée en boîte vide). `webglcontextrestored` relance un rendu.
 */
function ContextLossGuard() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  React.useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => e.preventDefault();
    const onRestored = () => invalidate();
    canvas.addEventListener("webglcontextlost", onLost, false);
    canvas.addEventListener("webglcontextrestored", onRestored, false);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl, invalidate]);
  return null;
}

export interface ThreeCanvasProps extends Omit<CanvasProps, "children"> {
  children: React.ReactNode;
  /** Render only on demand (static scenes) vs. every frame (animated). */
  frameloop?: "always" | "demand" | "never";
  /** Disable the runtime performance downgrade guard. */
  noPerfGuard?: boolean;
}

/**
 * Quality-aware R3F canvas. DPR, antialias and shadows come from the active
 * tier budget; AdaptiveDpr/AdaptiveEvents throttle when moving; the perf guard
 * steps quality down under load. Never rendered on the server — mount behind
 * WebGLBoundary or next/dynamic({ ssr: false }).
 */
export function ThreeCanvas({
  children,
  frameloop = "always",
  noPerfGuard = false,
  gl,
  ...props
}: ThreeCanvasProps) {
  const { budget } = useQuality();

  return (
    <Canvas
      frameloop={frameloop}
      dpr={budget.dpr}
      shadows={budget.shadows}
      gl={{
        antialias: budget.antialias,
        powerPreference: "high-performance",
        alpha: true,
        ...(typeof gl === "object" ? gl : {}),
      }}
      {...props}
    >
      <ContextLossGuard />
      {!noPerfGuard && <PerformanceController />}
      {children}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <Preload all />
    </Canvas>
  );
}
