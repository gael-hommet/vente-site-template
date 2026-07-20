import Image from "next/image";
import type { StorytellingProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Storytelling « alternating-narrative » : média et texte alternés
 * gauche/droite à chaque chapitre. Sans média : panneau brand décoratif.
 * Composition rythmée deux colonnes. Tokens DA.
 */
export function AlternatingNarrative({ chapters, className }: StorytellingProps) {
  return (
    <div className={cn("flex flex-col gap-16 sm:gap-28", className)}>
      {chapters.map((c, i) => {
        const reversed = i % 2 === 1;
        return (
          <section key={i} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
            <div className={cn("relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-border", reversed && "md:order-2")}>
              {c.media ? (
                <Image src={c.media.src} alt={c.media.alt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
              ) : (
                <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(150deg, color-mix(in oklch, var(--brand) 26%, var(--surface-2)), var(--surface-3))" }} />
              )}
            </div>
            <div className={cn(reversed && "md:order-1")}>
              {c.eyebrow ? (
                <p className="mb-3 font-mono text-[0.75rem] tracking-[0.12em] text-muted uppercase">{c.eyebrow}</p>
              ) : null}
              <h2 className="text-balance font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-tight font-light">{c.title}</h2>
              <p className="mt-5 max-w-prose leading-relaxed text-muted">{c.body}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
