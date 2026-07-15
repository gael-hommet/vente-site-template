import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
} as const;

/**
 * Glass button. Progressive enhancement only — `.glass` degrades to an opaque,
 * fully accessible surface where backdrop-filter is unsupported. Never depends
 * on WebGL. For the magnetic hover behavior, wrap with <MagneticButton>.
 */
export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, asChild = false, size = "md", children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "glass group relative inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] font-medium text-foreground shadow-[var(--shadow-md)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:shadow-[var(--shadow-lg)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
GlassButton.displayName = "GlassButton";
