"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface KenBurnsSceneProps {
  src: string;
  alt: string;
  className?: string;
  /** Seconds for a full zoom/pan cycle. */
  duration?: number;
}

/**
 * KenBurnsScene — cinematic slow zoom/pan on a single photograph (the honest way
 * to make one flat image feel alive without pretending to have depth data).
 * Static under reduced motion.
 */
export function KenBurnsScene({ src, alt, className, duration = 20 }: KenBurnsSceneProps) {
  const reduced = useReducedMotion();
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-0"
        style={{
          animation: reduced
            ? undefined
            : `vse-kenburns ${duration}s ease-in-out infinite alternate`,
          transformOrigin: "center",
        }}
      >
        <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" priority={false} />
      </div>
      <style>{`@keyframes vse-kenburns{0%{transform:scale(1) translate3d(0,0,0)}100%{transform:scale(1.12) translate3d(-2%,-1%,0)}}`}</style>
    </div>
  );
}
