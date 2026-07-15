import * as React from "react";
import { cn } from "@/lib/utils";
import { Container, type ContainerProps } from "./container";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Wrap children in a Container. Set false for full-bleed sections. */
  contained?: boolean;
  width?: ContainerProps["width"];
  /** Vertical rhythm. */
  spacing?: "none" | "sm" | "md" | "lg";
  as?: "section" | "div" | "article" | "footer" | "header";
}

const spacings = {
  none: "",
  sm: "py-10 sm:py-14",
  md: "py-16 sm:py-24",
  lg: "py-24 sm:py-36",
} as const;

/** Semantic page section with consistent vertical rhythm. */
export function Section({
  className,
  contained = true,
  width = "xl",
  spacing = "md",
  as: Tag = "section",
  children,
  ...props
}: SectionProps) {
  return (
    <Tag className={cn(spacings[spacing], className)} {...props}>
      {contained ? <Container width={width}>{children}</Container> : children}
    </Tag>
  );
}
