"use client";

import * as React from "react";
import Link from "next/link";
import type { NavProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Navigation « minimal-header » : barre fine sticky, marque à gauche, liens en
 * ligne (repliés en menu déroulant sous md), CTA à droite. Densité faible,
 * traitement discret. Tokens DA.
 */
export function MinimalHeader({ brand, links, cta, className }: NavProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <header
      className={cn(
        "border-border/60 bg-surface/80 sticky top-0 z-40 border-b backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="font-semibold tracking-tight">
          {brand}
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principale">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted hover:text-foreground text-sm transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {cta ? (
            <Link
              href={cta.href}
              className="bg-brand text-brand-foreground hover:bg-brand-strong hidden h-9 items-center rounded-[var(--radius-sm)] px-4 text-sm font-medium md:inline-flex"
            >
              {cta.label}
            </Link>
          ) : null}
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
            className="border-border inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border md:hidden"
          >
            <span aria-hidden>{open ? "✕" : "≡"}</span>
          </button>
        </div>
      </div>
      {open ? (
        <nav
          className="border-border/60 bg-surface border-t px-6 py-4 md:hidden"
          aria-label="Principale (mobile)"
        >
          <ul className="flex flex-col gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-foreground text-base"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {cta ? (
              <li>
                <Link
                  href={cta.href}
                  className="bg-brand text-brand-foreground inline-flex h-10 items-center rounded-[var(--radius-sm)] px-4 text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
                  {cta.label}
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
