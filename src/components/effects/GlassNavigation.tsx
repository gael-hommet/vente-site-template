import * as React from "react";
import { cn } from "@/lib/utils";
import { GlassSurface } from "./GlassSurface";

/**
 * A floating glass navigation bar shell. Wraps children (logo, links, CTA) in a
 * GlassSurface. Purely presentational + accessible; pair with the <Navigation>
 * component for the actual links and mobile drawer.
 */
export function GlassNavigation({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <GlassSurface
      as="nav"
      className={cn(
        "flex items-center gap-4 rounded-full px-4 py-2 shadow-[var(--shadow-md)]",
        className,
      )}
      {...props}
    >
      {children}
    </GlassSurface>
  );
}
