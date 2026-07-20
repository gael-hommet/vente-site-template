import Image from "next/image";
import type { StorytellingProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Storytelling « immersive-scroll » : sections plein écran empilées, très grande
 * typo, média en fond quand fourni. L'intensité du mouvement (parallaxe/pin) est
 * apportée par le PROFIL Motion, pas ici — la structure reste lisible et
 * scrollable sans JS (reduced-motion safe). Tokens DA.
 */
export function ImmersiveScroll({ chapters, className }: StorytellingProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {chapters.map((c, i) => (
        <section key={i} className="relative isolate flex min-h-[88vh] items-center overflow-hidden">
          {c.media ? (
            <>
              <Image src={c.media.src} alt={c.media.alt} fill sizes="100vw" className="-z-10 object-cover" />
              <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "oklch(0 0 0 / 0.5)" }} />
            </>
          ) : (
            <div aria-hidden className="absolute inset-0 -z-10" style={{ background: i % 2 ? "var(--surface-2)" : "var(--background)" }} />
          )}
          <div className={cn("mx-auto w-full max-w-5xl px-6", c.media && "text-white")}>
            {c.eyebrow ? (
              <p className={cn("mb-4 font-mono text-[0.8125rem] tracking-[0.12em] uppercase", c.media ? "text-white/75" : "text-muted")}>
                {c.eyebrow}
              </p>
            ) : null}
            <h2 className="max-w-4xl text-balance font-display text-[clamp(2.25rem,6vw,5rem)] leading-[1.05] font-light">
              {c.title}
            </h2>
            <p className={cn("mt-6 max-w-2xl text-lg leading-relaxed", c.media ? "text-white/85" : "text-muted")}>
              {c.body}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
