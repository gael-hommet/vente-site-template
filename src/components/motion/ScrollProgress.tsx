"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "motion/react";

/**
 * Reading-progress bar fixed to the top of the viewport. Purely decorative
 * (aria-hidden). Works with or without Lenis; not affected by reduced motion
 * because it reflects real scroll position, but the spring is subtle.
 */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className={"bg-brand fixed inset-x-0 top-0 z-50 h-0.5 origin-left " + (className ?? "")}
    />
  );
}
