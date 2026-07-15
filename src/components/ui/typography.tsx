import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-[family-name:var(--font-display)] tracking-tight text-balance", {
  variants: {
    level: {
      display: "text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.02]",
      h1: "text-3xl sm:text-5xl font-bold leading-[1.05]",
      h2: "text-2xl sm:text-4xl font-semibold leading-tight",
      h3: "text-xl sm:text-2xl font-semibold leading-snug",
      h4: "text-lg sm:text-xl font-semibold leading-snug",
    },
  },
  defaultVariants: { level: "h2" },
});

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: HeadingTag;
}

/** Display heading. `level` controls styling; `as` controls the actual tag
 * (keep the semantic outline correct independent of visual size). */
export function Heading({ className, level, as, children, ...props }: HeadingProps) {
  const Tag = (as ?? mapLevelToTag(level)) as HeadingTag;
  return (
    <Tag className={cn(headingVariants({ level }), className)} {...props}>
      {children}
    </Tag>
  );
}

function mapLevelToTag(level: HeadingProps["level"]): HeadingTag {
  switch (level) {
    case "display":
    case "h1":
      return "h1";
    case "h2":
      return "h2";
    case "h3":
      return "h3";
    default:
      return "h4";
  }
}

const textVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted",
      brand: "text-brand",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
  },
  defaultVariants: { size: "base", tone: "default", weight: "normal" },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div";
}

export function Text({ className, size, tone, weight, as: Tag = "p", ...props }: TextProps) {
  return <Tag className={cn(textVariants({ size, tone, weight }), className)} {...props} />;
}
