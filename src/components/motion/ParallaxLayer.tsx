"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface ParallaxLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pixels of vertical travel across the element's scroll range. */
  speed?: number;
  axis?: "x" | "y";
}

/**
 * Lightweight parallax using Motion's useScroll (no scroll-jacking, no GSAP).
 * Disabled under reduced motion. Good for depth on hero/photo layers.
 */
export function ParallaxLayer({ speed = 60, axis = "y", children, style, ...props }: ParallaxLayerProps) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  const value = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      style={reduced ? style : { ...style, [axis]: value }}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}
