"use client";

import * as React from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { useQuality } from "@/hooks/useQuality";
import { PerformanceController } from "./PerformanceController";

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
      {!noPerfGuard && <PerformanceController />}
      {children}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <Preload all />
    </Canvas>
  );
}
