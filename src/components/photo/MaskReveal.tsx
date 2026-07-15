"use client";

import * as React from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION, EASE } from "@/config/motion";
import { cn } from "@/lib/utils";

export interface MaskRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left";
  delay?: number;
}

/**
 * Reveals content by wiping an inset clip-path on scroll into view. Under
 * reduced motion the content is shown immediately with no wipe.
 */
export function MaskReveal({ children, className, direction = "up", delay = 0 }: MaskRevealProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  const hidden = direction === "up" ? "inset(100% 0% 0% 0%)" : "inset(0% 100% 0% 0%)";

  return (
    <motion.div
      className={cn("will-change-[clip-path]", className)}
      initial={{ clipPath: hidden }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: DURATION.cinematic, ease: EASE.emphasized, delay }}
    >
      {children}
    </motion.div>
  );
}
