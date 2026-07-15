"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile drawer built on Radix Dialog (focus trap, scroll lock, ESC, a11y for
 * free). Slides from a chosen side. Use for mobile navigation menus.
 */
export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

const sideClasses = {
  left: "left-0 top-0 h-full w-[85%] max-w-sm data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right:
    "right-0 top-0 h-full w-[85%] max-w-sm data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  bottom:
    "bottom-0 left-0 w-full max-h-[85%] rounded-t-[var(--radius-xl)] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
} as const;

export function DrawerContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: keyof typeof sideClasses }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "glass fixed z-50 flex flex-col gap-4 p-6 shadow-[var(--shadow-lg)] focus:outline-none",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-[var(--radius-sm)] p-1 text-muted hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
          aria-label="Fermer le menu"
        >
          <X className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
