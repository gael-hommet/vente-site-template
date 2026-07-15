"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { primaryNav, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Desktop inline links + mobile drawer. Fully keyboard accessible via Radix. */
export function Navigation({
  items = primaryNav,
  className,
}: {
  items?: NavItem[];
  className?: string;
}) {
  return (
    <>
      <nav
        aria-label="Navigation principale"
        className={cn("hidden items-center gap-1 md:flex", className)}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted hover:text-foreground rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="md:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
              <Menu className="size-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent side="right">
            <DrawerTitle className="text-lg font-semibold">Menu</DrawerTitle>
            <nav aria-label="Navigation mobile" className="mt-2 flex flex-col gap-1">
              {items.map((item) => (
                <DrawerClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="text-foreground hover:bg-surface-2 rounded-[var(--radius-md)] px-3 py-3 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                  >
                    {item.label}
                  </Link>
                </DrawerClose>
              ))}
            </nav>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
