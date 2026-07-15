import * as React from "react";
import { cn } from "@/lib/utils";

const widths = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const;

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: keyof typeof widths;
}

/** Centered, gutter-aware content container. */
export function Container({ className, width = "xl", ...props }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-6 lg:px-8", widths[width], className)} {...props} />
  );
}
