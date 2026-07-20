import type { StorytellingProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Storytelling « chaptered-story » : grands numéros de chapitre en marge, titre
 * et corps alignés, filets de séparation. Zéro média — pur typographique,
 * façon ouvrage. Tokens DA.
 */
export function ChapteredStory({ chapters, className }: StorytellingProps) {
  return (
    <div className={cn("mx-auto max-w-4xl", className)}>
      {chapters.map((c, i) => (
        <section
          key={i}
          className="grid gap-4 border-t border-border py-12 sm:grid-cols-[6rem_1fr] sm:gap-10 sm:py-16"
        >
          <p aria-hidden className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none font-light text-brand/70">
            {String(i + 1).padStart(2, "0")}
          </p>
          <div>
            {c.eyebrow ? (
              <p className="mb-2 font-mono text-[0.75rem] tracking-[0.12em] text-muted uppercase">{c.eyebrow}</p>
            ) : null}
            <h2 className="text-balance font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-tight font-light">{c.title}</h2>
            <p className="mt-4 max-w-prose leading-relaxed text-muted">{c.body}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
