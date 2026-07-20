import Link from "next/link";
import type { ConversionProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Conversion « minimal-contact » : bloc centré sobre — titre, description, CTA
 * primaire, téléphone optionnel. Zéro fausse urgence. Tokens DA.
 */
export function MinimalContact({ title, description, primaryCta, phone, className }: ConversionProps) {
  return (
    <section className={cn("mx-auto max-w-2xl px-6 py-20 text-center", className)}>
      <h2 className="text-balance font-display text-[clamp(1.75rem,4vw,3rem)] leading-tight font-light">{title}</h2>
      {description ? <p className="mx-auto mt-4 max-w-prose leading-relaxed text-muted">{description}</p> : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href={primaryCta.href}
          className="inline-flex h-12 items-center rounded-[var(--radius-md)] bg-brand px-7 text-base font-medium text-brand-foreground hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
        >
          {primaryCta.label}
        </Link>
        {phone ? (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-base font-medium text-foreground underline-offset-4 hover:underline">
            {phone}
          </a>
        ) : null}
      </div>
    </section>
  );
}
