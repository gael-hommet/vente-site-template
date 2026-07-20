import Link from "next/link";
import type { ConversionProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Conversion « premium-inquiry » : bande éditoriale large sur surface teintée
 * brand, titre imposant à gauche, carte d'action à droite (CTA + téléphone).
 * Ton haut de gamme, sans fausse preuve. Tokens DA.
 */
export function PremiumInquiry({ title, description, primaryCta, phone, className }: ConversionProps) {
  return (
    <section
      className={cn("relative overflow-hidden", className)}
      style={{ background: "linear-gradient(120deg, color-mix(in oklch, var(--brand) 12%, var(--surface-2)), var(--surface-2))" }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-balance font-display text-[clamp(2rem,4.5vw,3.5rem)] leading-tight font-light">{title}</h2>
          {description ? <p className="mt-5 max-w-xl leading-relaxed text-muted">{description}</p> : null}
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-md)]">
          <Link
            href={primaryCta.href}
            className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-brand px-6 text-base font-medium text-brand-foreground hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            {primaryCta.label}
          </Link>
          {phone ? (
            <p className="mt-4 text-center text-sm text-muted">
              ou{" "}
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                {phone}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
