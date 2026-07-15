"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface LiquidMetalLogoProps {
  text: string;
  className?: string;
  /** Animation speed in seconds for the sheen sweep. */
  speed?: number;
}

/**
 * "Liquid metal" wordmark — an animated metallic gradient sweeping across text.
 * Implemented with a CSS gradient + background-clip (no WebGL, no external
 * shader library). Under reduced motion the sheen is static. This is the robust
 * default; an optional shader runtime (@paper-design/shaders-react) can be
 * layered behind it — see docs/OPTIONAL-INTEGRATIONS.md.
 */
export function LiquidMetalLogo({ text, className, speed = 6 }: LiquidMetalLogoProps) {
  const reduced = useReducedMotion();
  return (
    <span
      className={cn(
        "inline-block bg-clip-text font-bold tracking-tight text-transparent",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(100deg, #8a8f9c 0%, #eef2ff 20%, #c7ccd8 40%, #ffffff 50%, #aab0be 60%, #eef2ff 80%, #8a8f9c 100%)",
        backgroundSize: "300% 100%",
        WebkitBackgroundClip: "text",
        animation: reduced ? undefined : `vse-metal-sheen ${speed}s linear infinite`,
      }}
    >
      {text}
      <style>{`@keyframes vse-metal-sheen{0%{background-position:0% 50%}100%{background-position:300% 50%}}`}</style>
    </span>
  );
}
