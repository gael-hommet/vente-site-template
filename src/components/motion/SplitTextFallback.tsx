"use client";

import * as React from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION, EASE } from "@/config/motion";

export interface SplitTextProps {
  text: string;
  /** Split granularity. */
  by?: "word" | "char";
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}

/**
 * Dependency-free animated text reveal — replaces GSAP's premium SplitText.
 * Splits into words/chars and staggers them in. Accessible: the full string is
 * exposed to assistive tech via a visually-hidden node (aria-label is
 * prohibited on role-less elements) while the visual pieces are aria-hidden.
 * Renders statically under reduced motion.
 */
export function SplitTextFallback({
  text,
  by = "word",
  className,
  delay = 0,
  stagger = 0.04,
  as = "span",
}: SplitTextProps) {
  const reduced = useReducedMotion();
  const Tag = as;
  const pieces = by === "char" ? Array.from(text) : text.split(/(\s+)/);

  if (reduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  // The viewport observer MUST watch the (unclipped) container: each word
  // starts translated fully outside its overflow-hidden clip box, so its own
  // intersection ratio is 0 forever — observing words directly never fires.
  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden
        className="inline"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ staggerChildren: stagger, delayChildren: delay }}
      >
        {pieces.map((piece, i) => {
          if (/^\s+$/.test(piece)) return <span key={i}>{piece}</span>;
          return (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <motion.span
                className="inline-block"
                variants={{
                  hidden: { y: "110%", opacity: 0 },
                  show: {
                    y: "0%",
                    opacity: 1,
                    transition: { duration: DURATION.slow, ease: EASE.outSoft },
                  },
                }}
              >
                {piece}
              </motion.span>
            </span>
          );
        })}
      </motion.span>
    </Tag>
  );
}
