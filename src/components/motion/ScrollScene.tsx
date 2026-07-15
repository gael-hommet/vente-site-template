"use client";

import * as React from "react";
import { registerGsap, ScrollTrigger, gsap } from "@/lib/animation/gsap";
import { prefersReducedMotion } from "@/lib/accessibility/reduced-motion";

export interface ScrollSceneProps {
  className?: string;
  children: React.ReactNode;
  /**
   * Build a GSAP timeline from the scene root. Called once on mount; the
   * returned timeline is scrubbed by scroll. Return undefined to skip.
   */
  build: (ctx: { root: HTMLDivElement; gsap: typeof gsap }) => gsap.core.Timeline | undefined;
  start?: string;
  end?: string;
  scrub?: number | boolean;
}

/**
 * A scrubbed GSAP timeline tied to scroll, without pinning. Use for entrance
 * choreography of complex sections. Under reduced motion the timeline is
 * seeked to its end state instantly so the final layout is shown, no scrubbing.
 */
export function ScrollScene({
  className,
  children,
  build,
  start = "top 80%",
  end = "bottom 20%",
  scrub = true,
}: ScrollSceneProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const tl = build({ root, gsap });
      if (!tl) return;

      if (prefersReducedMotion()) {
        tl.progress(1); // show final state, no motion
        return;
      }

      ScrollTrigger.create({
        trigger: root,
        start,
        end,
        scrub,
        animation: tl,
      });
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, scrub]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
