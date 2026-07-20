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
    <header className={cn("sticky top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur", className)}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="font-semibold tracking-tight">
          {brand}
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Principale">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {cta ? (
            <Link
              href={cta.href}
              className="hidden h-9 items-center rounded-[var(--radius-sm)] bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand-strong md:inline-flex"
            >
              {cta.label}
            </Link>
          ) : null}
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-border md:hidden"
          >
            <span aria-hidden>{open ? "✕" : "≡"}</span>
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-border/60 bg-surface px-6 py-4 md:hidden" aria-label="Principale (mobile)">
          <ul className="flex flex-col gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-base text-foreground" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
            {cta ? (
              <li>
                <Link
                  href={cta.href}
                  className="inline-flex h-10 items-center rounded-[var(--radius-sm)] bg-brand px-4 text-sm font-medium text-brand-foreground"
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
