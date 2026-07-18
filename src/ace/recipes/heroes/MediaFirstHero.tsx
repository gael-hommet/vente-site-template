import Link from "next/link";
import Image from "next/image";
import type { HeroProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Hero « media-first » : média plein cadre + voile, titre en surimpression.
 * Sans média fourni : dégradé sur surfaces/brand (jamais une zone vide). Texte
 * clair garanti par le voile. Anti-CLS (aspect fixe), reduced-motion safe.
 */
export function MediaFirstHero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  media,
  className,
}: HeroProps) {
  return (
    <section
      className={cn("relative isolate flex min-h-[82vh] items-end overflow-hidden", className)}
    >
      {media ? (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="-z-10 absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--surface-3), color-mix(in oklch, var(--brand) 22%, var(--surface-2)))",
          }}
        />
      )}
      {/* Voile pour la lisibilité du texte clair. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(to top, oklch(0 0 0 / 0.62), oklch(0 0 0 / 0.1) 55%, transparent)" }}
      />
      <div className="mx-auto w-full max-w-6xl px-6 pt-24 pb-16 text-white">
        {eyebrow ? (
          <p className="mb-5 font-mono text-[0.8125rem] font-medium tracking-[0.12em] text-white/80 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-balance font-display text-[clamp(2.5rem,7vw,6rem)] leading-[1.04] font-medium">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">{subtitle}</p>
        ) : null}
        {(primaryCta || secondaryCta) && (
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {primaryCta ? (
              <Link
                href={primaryCta.href}
                className="inline-flex h-12 items-center rounded-[var(--radius-md)] bg-brand px-7 text-base font-medium text-brand-foreground transition-colors hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link
                href={secondaryCta.href}
                className="inline-flex h-12 items-center rounded-[var(--radius-md)] border border-white/40 px-7 text-base font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
