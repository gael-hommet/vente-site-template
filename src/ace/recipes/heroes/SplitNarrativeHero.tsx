import Link from "next/link";
import Image from "next/image";
import type { HeroProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Hero « split-narrative » : deux colonnes — récit (titre/sous-titre/CTA) à
 * gauche, panneau média à droite (ou panneau brand décoratif sans média).
 * Empilé en une colonne sur mobile. Tokens, anti-CLS, reduced-motion safe.
 */
export function SplitNarrativeHero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  media,
  className,
}: HeroProps) {
  return (
    <section className={cn("py-16 md:py-0", className)}>
      <div className="mx-auto grid w-full max-w-7xl items-stretch gap-10 px-6 md:min-h-[80vh] md:grid-cols-2 md:gap-0">
        <div className="flex flex-col justify-center py-10 md:pr-12">
          {eyebrow ? (
            <p className="mb-5 font-mono text-[0.8125rem] font-medium tracking-[0.12em] text-muted uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-balance font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.05] font-light tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{subtitle}</p>
          ) : null}
          {(primaryCta || secondaryCta) && (
            <div className="mt-9 flex flex-wrap items-center gap-4">
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
        <div className="relative min-h-[40vh] overflow-hidden rounded-[var(--radius-lg)] md:min-h-0 md:rounded-none">
          {media ? (
            <Image src={media.src} alt={media.alt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, color-mix(in oklch, var(--brand) 30%, var(--surface-2)), var(--surface-3))",
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
