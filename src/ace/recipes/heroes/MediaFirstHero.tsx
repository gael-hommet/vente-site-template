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
      // Sans média : fond posé DIRECTEMENT sur la section (ancêtre réel du
      // texte), pas sur un calque frère positionné en absolute. Les outils
      // d'audit de contraste automatisés (axe-core) remontent la chaîne
      // d'ancêtres CSS pour résoudre le fond — un calque frère en
      // position:absolute + z-index négatif n'en fait pas partie, même s'il
      // est peint visuellement au même endroit à l'écran.
      style={
        media
          ? undefined
          : {
              backgroundColor: "oklch(0.2 0.02 265)",
              backgroundImage:
                "linear-gradient(135deg, color-mix(in oklch, var(--foreground) 78%, black), color-mix(in oklch, var(--brand) 35%, color-mix(in oklch, var(--foreground) 70%, black))), linear-gradient(to top, oklch(0 0 0 / 0.3), oklch(0 0 0 / 0.3))",
            }
      }
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
      ) : null}
      {/* Voile pour la lisibilité du texte clair (nécessaire sur média photo ;
          sans média, le fond de la section ci-dessus intègre déjà le voile). */}
      {media ? (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            backgroundColor: "oklch(0 0 0 / 0.4)",
            backgroundImage:
              "linear-gradient(to top, oklch(0 0 0 / 0.62), oklch(0 0 0 / 0.1) 55%, transparent)",
          }}
        />
      ) : null}
      <div className="mx-auto w-full max-w-6xl px-6 pt-24 pb-16 text-white">
        {eyebrow ? (
          <p className="mb-5 font-mono text-[0.8125rem] font-medium tracking-[0.12em] text-white/80 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display max-w-4xl text-[clamp(2.5rem,7vw,6rem)] leading-[1.04] font-medium text-balance">
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
                className="bg-brand text-brand-foreground hover:bg-brand-strong inline-flex h-12 items-center rounded-[var(--radius-md)] px-7 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
