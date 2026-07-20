import Image from "next/image";
import type { StorytellingProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Storytelling « linear-sections » : sections empilées en une colonne
 * éditoriale, chaque chapitre = surtitre + titre + corps (+ média optionnel).
 * Rythme régulier, sobre. Tokens DA.
 */
export function LinearSections({ chapters, className }: StorytellingProps) {
  return (
    <div className={cn("mx-auto flex max-w-3xl flex-col gap-16 sm:gap-24", className)}>
      {chapters.map((c, i) => (
        <section key={i}>
          {c.eyebrow ? (
            <p className="mb-3 font-mono text-[0.75rem] tracking-[0.12em] text-muted uppercase">{c.eyebrow}</p>
          ) : null}
          <h2 className="text-balance font-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-tight font-light">
            {c.title}
          </h2>
          <p className="mt-5 leading-relaxed text-muted">{c.body}</p>
          {c.media ? (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[var(--radius-md)] border border-border">
              <Image src={c.media.src} alt={c.media.alt} fill sizes="(min-width:768px) 48rem, 100vw" className="object-cover" />
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
