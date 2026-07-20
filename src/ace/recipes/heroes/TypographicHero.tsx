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
    <section className={cn("relative flex min-h-[70vh] flex-col justify-center py-20", className)}>
      <div className="mx-auto w-full max-w-6xl px-6">
        {eyebrow ? (
          <p className="text-muted mb-6 font-mono text-[0.8125rem] font-medium tracking-[0.12em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display max-w-5xl text-[clamp(2.75rem,8vw,7rem)] leading-[1.02] font-light tracking-tight text-balance">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-muted mt-8 max-w-2xl text-lg leading-relaxed">{subtitle}</p>
        ) : null}
        {(primaryCta || secondaryCta) && (
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                className="bg-brand text-brand-foreground hover:bg-brand-strong inline-flex h-12 items-center rounded-[var(--radius-md)] px-7 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="border-border text-foreground hover:bg-surface-2 inline-flex h-12 items-center rounded-[var(--radius-md)] border px-7 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
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
