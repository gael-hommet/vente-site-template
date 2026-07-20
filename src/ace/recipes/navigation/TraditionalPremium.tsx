"use client";

import * as React from "react";
import Link from "next/link";
import type { NavProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Navigation « traditional-premium » : marque à gauche, liens CENTRÉS avec
 * soulignement animé au survol, CTA à droite. Structure classique premium,
 * densité moyenne. Menu déroulant sous md. Tokens DA.
 */
export function TraditionalPremium({ brand, links, cta, className }: NavProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <header className={cn("border-border bg-surface sticky top-0 z-40 border-b", className)}>
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6">
        <Link href="/" className="justify-self-start font-semibold tracking-tight">
          {brand}
        </Link>
        <nav
          className="hidden items-center gap-8 justify-self-center md:flex"
          aria-label="Principale"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-foreground/80 hover:text-foreground after:bg-brand relative text-sm transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:transition-all after:duration-300 hover:after:w-full"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="justify-self-end">
          {cta ? (
            <Link
              href={cta.href}
              className="border-brand text-brand hover:bg-brand hover:text-brand-foreground hidden h-10 items-center rounded-[var(--radius-md)] border px-5 text-sm font-medium transition-colors md:inline-flex"
            >
              {cta.label}
            </Link>
          ) : null}
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center md:hidden"
          >
            <span aria-hidden>{open ? "✕" : "≡"}</span>
          </button>
        </div>
      </div>
      {open ? (
        <nav
          className="border-border bg-surface border-t px-6 py-4 text-center md:hidden"
          aria-label="Principale (mobile)"
        >
          <ul className="flex flex-col gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-base" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
            {cta ? (
              <li className="pt-2">
                <Link
                  href={cta.href}
                  className="border-brand text-brand inline-flex h-10 items-center rounded-[var(--radius-md)] border px-5 text-sm font-medium"
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
