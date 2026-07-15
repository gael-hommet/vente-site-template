"use client";

import * as React from "react";
import { useOptionalModule } from "@/lib/optional/load";
import { MediaFallback } from "@/components/media/MediaFallback";
import { cn } from "@/lib/utils";

export interface RiveSceneProps {
  /** URL/path to a .riv file. */
  src?: string;
  /** Poster shown while loading, if the runtime is missing, or if no src. */
  poster: string;
  alt: string;
  stateMachine?: string;
  className?: string;
}

interface RiveModule {
  default: React.ComponentType<{ src: string; stateMachines?: string; className?: string }>;
}

/**
 * ADAPTER-ONLY. @rive-app/react-canvas is NOT installed by default. When present
 * (pnpm add @rive-app/react-canvas) and a `src` .riv is provided, this mounts
 * the Rive runtime; otherwise it renders the poster fallback. Build never breaks.
 */
export function RiveScene({ src, poster, alt, stateMachine, className }: RiveSceneProps) {
  const { status, mod } = useOptionalModule<RiveModule>("@rive-app/react-canvas");

  if (!src || status !== "ready" || !mod) {
    return <MediaFallback poster={poster} alt={alt} className={className} />;
  }
  const Rive = mod.default;
  return <Rive src={src} stateMachines={stateMachine} className={cn(className)} />;
}
