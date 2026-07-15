"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface PointerCtx {
  x: MotionValue<number>; // -1..1
  y: MotionValue<number>; // -1..1
  reduced: boolean;
}

const PointerContext = React.createContext<PointerCtx | null>(null);

/**
 * DepthParallax — container that tracks the pointer and provides a normalized
 * position to nested <ParallaxDepthLayer> children. Pointer-only; static under
 * reduced motion. The basis for 2.5D layered-photo effects.
 */
export function DepthParallax({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const reduced = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 120, damping: 20 });
  const y = useSpring(py, { stiffness: 120, damping: 20 });
  const ref = React.useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const reset = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <PointerContext.Provider value={{ x, y, reduced }}>
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    </PointerContext.Provider>
  );
}

/**
 * A single depth layer. `depth` -1..1: negative moves against the pointer
 * (background), positive with it (foreground). Nest inside <DepthParallax> or
 * <LayeredPhoto>.
 */
export function ParallaxDepthLayer({
  depth = 0.2,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { depth?: number }) {
  const ctx = React.useContext(PointerContext);
  const amount = 24 * depth;
  // Hooks must run unconditionally; when no context/reduced, transforms map to 0.
  const zero = useMotionValue(0);
  const srcX = ctx?.x ?? zero;
  const srcY = ctx?.y ?? zero;
  const tx = useTransform(srcX, (v) => (ctx?.reduced ? 0 : v * amount));
  const ty = useTransform(srcY, (v) => (ctx?.reduced ? 0 : v * amount));

  return (
    <motion.div
      style={{ x: tx, y: ty }}
      className={cn("absolute inset-0", className)}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}
