import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[color,background-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:shrink-0 [&_svg]:size-[1.15em]",
  {
    variants: {
      variant: {
        brand:
          "bg-brand text-brand-foreground shadow-[var(--shadow-md)] hover:bg-brand-strong hover:shadow-[var(--shadow-glow)]",
        solid: "bg-foreground text-background hover:opacity-90 shadow-[var(--shadow-sm)]",
        outline: "border border-border bg-transparent text-foreground hover:bg-surface-2",
        ghost: "bg-transparent text-foreground hover:bg-surface-2",
        subtle: "bg-surface-2 text-foreground hover:bg-surface-3",
        danger: "bg-danger text-white hover:opacity-90",
        link: "bg-transparent text-brand underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-[var(--radius-sm)]",
        md: "h-11 px-5 text-sm rounded-[var(--radius-md)]",
        lg: "h-13 px-7 text-base rounded-[var(--radius-lg)]",
        icon: "size-11 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: { variant: "brand", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
