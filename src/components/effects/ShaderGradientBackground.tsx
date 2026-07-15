"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface ShaderGradientBackgroundProps {
  className?: string;
  /** Two-to-three brand-ish colors for the animated mesh. */
  colors?: [string, string, string?];
  speed?: number;
}

/**
 * Animated mesh-gradient background. Default implementation is pure CSS (layered
 * radial gradients drifting) — zero dependencies, SSR-safe, and it never ships
 * its own copy of three.js. Respects reduced motion (renders a static gradient).
 *
 * To upgrade to a true WebGL shader gradient, install @shadergradient/react and
 * mount it here behind an AdaptiveCanvas — see docs/OPTIONAL-INTEGRATIONS.md.
 * The CSS version remains the guaranteed fallback.
 */
export function ShaderGradientBackground({
  className,
  colors = ["#6d5cff", "#00d4ff", "#ff7ac6"],
  speed = 18,
}: ShaderGradientBackgroundProps) {
  const reduced = useReducedMotion();
  const [c1, c2, c3 = "#1b1e2e"] = colors;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div
        className="absolute inset-[-25%]"
        style={{
          background: `radial-gradient(40% 40% at 25% 30%, ${c1}66, transparent 70%), radial-gradient(45% 45% at 75% 35%, ${c2}55, transparent 70%), radial-gradient(50% 50% at 55% 80%, ${c3}55, transparent 70%)`,
          filter: "blur(40px) saturate(1.3)",
          animation: reduced
            ? undefined
            : `vse-mesh-drift ${speed}s ease-in-out infinite alternate`,
        }}
      />
      <style>{`@keyframes vse-mesh-drift{0%{transform:translate3d(-3%,-2%,0) scale(1.05)}50%{transform:translate3d(2%,3%,0) scale(1.12)}100%{transform:translate3d(3%,-1%,0) scale(1.06)}}`}</style>
    </div>
  );
}
