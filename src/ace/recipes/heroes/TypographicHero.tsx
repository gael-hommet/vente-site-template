import Link from "next/link";
import type { HeroProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Hero « typography-first » : pas de média, le titre EST l'image. Grands blancs,
 * échelle display massive, alignement à gauche, éditorial. S'habille via les
 * tokens (--font-display, --brand, --foreground). Statique → reduced-motion safe.
 */
export function TypographicHero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  className,
}: HeroProps) {
  return (
    <section
      className={cn("relative flex min-h-[70vh] flex-col justify-center py-20", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        {eyebrow ? (
          <p className="mb-6 font-mono text-[0.8125rem] font-medium tracking-[0.12em] text-muted uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-5xl text-balance font-display text-[clamp(2.75rem,8vw,7rem)] leading-[1.02] font-light tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">{subtitle}</p>
        ) : null}
        {(primaryCta || secondaryCta) && (
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                className="inline-flex h-12 items-center rounded-[var(--radius-md)] bg-brand px-7 text-base font-medium text-brand-foreground transition-colors hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="inline-flex h-12 items-center rounded-[var(--radius-md)] border border-border px-7 text-base font-medium text-foreground transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
