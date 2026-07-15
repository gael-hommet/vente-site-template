"use client";

import Image from "next/image";
import { DepthParallax, ParallaxDepthLayer } from "./DepthParallax";
import { cn } from "@/lib/utils";

export interface PhotoLayer {
  src: string;
  alt?: string;
  /** -1..1 parallax depth (background → foreground). */
  depth: number;
  priority?: boolean;
}

export interface LayeredPhotoProps {
  layers: PhotoLayer[];
  className?: string;
  /** Alt for the composite image (first meaningful layer usually). */
  alt: string;
}

/**
 * LayeredPhoto — turns cut-out photo layers into a 2.5D parallax scene. Provide
 * pre-separated layers (e.g. background / subject / foreground). Falls back to a
 * flat, accessible image under reduced motion (handled by DepthParallax). If you
 * only have a single flat photo, use KenBurnsScene instead.
 */
export function LayeredPhoto({ layers, className, alt }: LayeredPhotoProps) {
  return (
    <DepthParallax className={cn("relative", className)} role="img" aria-label={alt}>
      {layers.map((layer, i) => (
        <ParallaxDepthLayer key={i} depth={layer.depth}>
          <Image
            src={layer.src}
            alt={layer.alt ?? ""}
            fill
            sizes="100vw"
            priority={layer.priority}
            className="object-cover"
          />
        </ParallaxDepthLayer>
      ))}
    </DepthParallax>
  );
}
