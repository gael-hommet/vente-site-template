import Link from "next/link";
import type { ConversionProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Conversion « appointment-ready » : orientée prise de rendez-vous — carte
 * centrée, CTA principal + appel direct, cadence rassurante. Aucune fausse
 * disponibilité affichée. Tokens DA.
 */
export function AppointmentReady({
  title,
  description,
  primaryCta,
  phone,
  className,
}: ConversionProps) {
  return (
    <section className={cn("px-6 py-20", className)}>
      <div className="border-border bg-surface mx-auto max-w-3xl rounded-[var(--radius-xl)] border p-8 text-center shadow-[var(--shadow-md)] sm:p-12">
        <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] leading-tight font-light text-balance">
          {title}
        </h2>
        {description ? (
          <p className="text-muted mx-auto mt-4 max-w-prose leading-relaxed">{description}</p>
        ) : null}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href={primaryCta.href}
            className="bg-brand text-brand-foreground hover:bg-brand-strong inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] px-8 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] sm:w-auto"
          >
            {primaryCta.label}
          </Link>
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="border-border inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border px-8 text-base font-medium sm:w-auto"
            >
              {phone}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
