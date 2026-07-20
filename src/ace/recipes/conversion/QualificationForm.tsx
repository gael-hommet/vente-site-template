import Link from "next/link";
import type { ConversionProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Conversion « qualification-form » : cadre le parcours de qualification —
 * titre + étapes claires « ce qui se passe ensuite » + CTA. Le formulaire réel
 * est branché par ailleurs ; cette recipe pose l'attente (réassurance, pas de
 * promesse chiffrée). Tokens DA.
 */
const STEPS = [
  "Vous décrivez votre besoin",
  "Nous revenons vers vous",
  "Un cadre clair, par écrit",
];

export function QualificationForm({
  title,
  description,
  primaryCta,
  phone,
  className,
}: ConversionProps) {
  return (
    <section
      className={cn(
        "mx-auto grid max-w-6xl items-start gap-10 px-6 py-20 md:grid-cols-2",
        className,
      )}
    >
      <div>
        <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] leading-tight font-light text-balance">
          {title}
        </h2>
        {description ? (
          <p className="text-muted mt-5 max-w-prose leading-relaxed">{description}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={primaryCta.href}
            className="bg-brand text-brand-foreground hover:bg-brand-strong inline-flex h-12 items-center rounded-[var(--radius-md)] px-7 text-base font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            {primaryCta.label}
          </Link>
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="text-base font-medium underline-offset-4 hover:underline"
            >
              {phone}
            </a>
          ) : null}
        </div>
      </div>
      <ol className="divide-border border-border divide-y rounded-[var(--radius-lg)] border">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-4 p-5">
            <span className="border-brand text-brand flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm tabular-nums">
              {i + 1}
            </span>
            <span className="text-foreground text-sm">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
