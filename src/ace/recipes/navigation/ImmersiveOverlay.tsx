"use client";

import * as React from "react";
import Link from "next/link";
import type { NavProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Navigation « immersive-overlay » : barre minimale (marque + bouton Menu) ;
 * l'ouverture déploie un overlay PLEIN ÉCRAN avec de très grands liens. Même
 * comportement desktop et mobile — parti pris immersif. Focus géré, Escape
 * ferme, tokens DA.
 */
export function ImmersiveOverlay({ brand, links, cta, className }: NavProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={cn("sticky top-0 z-50", className)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-tight">
          {brand}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="font-mono text-xs tracking-[0.12em] uppercase"
        >
          Menu
        </button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="bg-background fixed inset-0 z-50 flex flex-col"
        >
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
            <span className="font-semibold tracking-tight">{brand}</span>
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="font-mono text-xs tracking-[0.12em] uppercase"
            >
              Fermer ✕
            </button>
          </div>
          <nav
            className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-2 px-6 pb-16"
            aria-label="Principale"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-display text-foreground/85 hover:text-brand text-[clamp(2rem,7vw,4.5rem)] leading-tight font-light transition-colors"
              >
                {l.label}
              </Link>
            ))}
            {cta ? (
              <Link
                href={cta.href}
                onClick={() => setOpen(false)}
                className="bg-brand text-brand-foreground mt-6 inline-flex h-12 w-fit items-center rounded-[var(--radius-md)] px-7 text-base font-medium"
              >
                {cta.label}
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
