import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        brand: "bg-brand/12 text-brand ring-1 ring-inset ring-brand/25",
        neutral: "bg-surface-2 text-muted ring-1 ring-inset ring-border",
        success: "bg-success/12 text-success ring-1 ring-inset ring-success/25",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
