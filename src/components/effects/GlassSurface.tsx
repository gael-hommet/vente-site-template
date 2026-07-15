import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Blur radius in px (backdrop-filter). */
  blur?: number;
  /** Extra tint opacity 0..1 layered over the surface. */
  tint?: number;
  /** Add a subtle top specular highlight line. */
  specular?: boolean;
  as?: "div" | "section" | "aside" | "header" | "nav";
}

/**
 * GlassSurface — the reference progressive-enhancement glass material.
 * Three tiers, no WebGL dependency:
 *   1. Enriched: backdrop-filter blur + saturation + specular highlight (via .glass
 *      + @supports in globals.css) where the browser supports it.
 *   2. Fallback: translucent surface without blur.
 *   3. Opaque, fully accessible surface when translucency is undesirable.
 * Essential UI never relies on WebGL refraction — this is CSS all the way down.
 */
export function GlassSurface({
  blur = 16,
  tint = 0,
  specular = true,
  as: Tag = "div",
  className,
  style,
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <Tag
      className={cn("glass relative isolate rounded-[var(--radius-lg)]", className)}
      style={{ ["--glass-blur" as string]: `${blur}px`, ...style }}
      {...props}
    >
      {specular && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[inherit] bg-[var(--glass-highlight)]"
        />
      )}
      {tint > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-foreground"
          style={{ opacity: tint * 0.08 }}
        />
      )}
      {children}
    </Tag>
  );
}
