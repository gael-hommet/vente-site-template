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
 * exposed to assistive tech via aria-label while the visual pieces are hidden.
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

  return (
    <Tag className={className} aria-label={text}>
      <span aria-hidden className="inline">
        {pieces.map((piece, i) => {
          if (/^\s+$/.test(piece)) return <span key={i}>{piece}</span>;
          return (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: "110%", opacity: 0 }}
                whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{
                  duration: DURATION.slow,
                  ease: EASE.outSoft,
                  delay: delay + i * stagger,
                }}
              >
                {piece}
              </motion.span>
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
