"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface MagneticButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max px the content is pulled toward the pointer. */
  strength?: number;
}

/**
 * Magnetic hover wrapper — content leans toward the cursor. Pointer-only and
 * disabled under reduced motion. Wrap a Button/GlassButton with it; the inner
 * element stays fully clickable and keyboard focusable.
 */
export function MagneticButton({
  strength = 14,
  children,
  className,
  ...props
}: MagneticButtonProps) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 20 });
  const sy = useSpring(y, { stiffness: 260, damping: 20 });
  const ref = React.useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set((relX / rect.width) * strength * 2);
    y.set((relY / rect.height) * strength * 2);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={reduced ? undefined : { x: sx, y: sy }}
      className={className}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}
