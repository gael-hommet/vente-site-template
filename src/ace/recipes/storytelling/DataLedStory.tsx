import type { StorytellingProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Storytelling « data-led-story » : chaque chapitre s'ouvre sur un CHIFFRE/repère
 * fort (le surtitre, en mono tabulaire géant), puis titre + corps. Adapté aux
 * récits par preuves/indicateurs. Générique (le « chiffre » est le contenu
 * fourni). Tokens DA.
 */
export function DataLedStory({ chapters, className }: StorytellingProps) {
  return (
    <div className={cn("grid gap-10 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {chapters.map((c, i) => (
        <section key={i} className="border-t-2 border-brand pt-6">
          {c.eyebrow ? (
            <p className="font-mono text-[clamp(2rem,4vw,3rem)] leading-none font-medium tabular-nums">
              {c.eyebrow}
            </p>
          ) : null}
          <h2 className="mt-4 text-lg leading-snug font-semibold">{c.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
        </section>
      ))}
    </div>
  );
}
