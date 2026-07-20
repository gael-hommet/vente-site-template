"use client";

import * as React from "react";
import Link from "next/link";
import type { NavProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Navigation « editorial-folio » : barre haute, marque en display, liens
 * numérotés (01/02…) façon sommaire, CTA en lien texte souligné. Densité
 * aérée, caractère éditorial. Tokens DA.
 */
export function EditorialFolio({ brand, links, cta, className }: NavProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <header className={cn("border-border border-b", className)}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-6">
        <Link href="/" className="font-display text-xl font-light tracking-tight">
          {brand}
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Principale">
          {links.map((l, i) => (
            <Link key={l.href} href={l.href} className="group flex items-baseline gap-1.5 text-sm">
              <span className="text-muted font-mono text-[0.625rem]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-foreground/80 group-hover:text-brand transition-colors">
                {l.label}
              </span>
            </Link>
          ))}
          {cta ? (
            <Link
              href={cta.href}
              className="text-brand text-sm font-medium underline-offset-4 hover:underline"
            >
              {cta.label} →
            </Link>
          ) : null}
        </nav>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="font-mono text-xs tracking-[0.08em] uppercase md:hidden"
        >
          {open ? "Fermer" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav
          className="border-border border-t px-6 py-6 md:hidden"
          aria-label="Principale (mobile)"
        >
          <ul className="flex flex-col gap-4">
            {links.map((l, i) => (
              <li key={l.href} className="flex items-baseline gap-2">
                <span className="text-muted font-mono text-[0.625rem]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Link
                  href={l.href}
                  className="font-display text-2xl font-light"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {cta ? (
              <li className="mt-2">
                <Link
                  href={cta.href}
                  className="text-brand underline underline-offset-4"
                  onClick={() => setOpen(false)}
                >
                  {cta.label} →
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
