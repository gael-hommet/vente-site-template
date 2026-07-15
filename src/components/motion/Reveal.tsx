"use client";

import * as React from "react";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION, EASE } from "@/config/motion";

type Direction = "up" | "down" | "left" | "right" | "none";

const offset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
  none: {},
};

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  direction?: Direction;
  delay?: number;
  once?: boolean;
  amount?: number;
  as?: "div" | "section" | "li" | "span";
}

/**
 * Motion enter-on-scroll reveal. This is a MICRO-INTERACTION (Motion's job),
 * not a cinematic scroll scene (that's GSAP). Under reduced motion it renders
 * statically with no transform.
 */
export function Reveal({
  direction = "up",
  delay = 0,
  once = true,
  amount = 0.3,
  as = "div",
  children,
  ...props
}: RevealProps) {
  const reduced = useReducedMotion();
  // The `as` union widens the element type; cast to a permissive component type.
  const MotionTag = motion[as] as React.ComponentType<Record<string, unknown>>;

  if (reduced) {
    return React.createElement(as, props, children);
  }

  const variants: Variants = {
    hidden: { opacity: 0, ...offset[direction] },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: DURATION.slow, ease: EASE.outSoft, delay },
    },
  };

  return (
    <MotionTag
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={variants}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

/** Staggered container: children Reveal with incremental delay. */
export function RevealGroup({
  children,
  stagger = 0.08,
  className,
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}) {
  const items = React.Children.toArray(children);
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={i} delay={i * stagger}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
