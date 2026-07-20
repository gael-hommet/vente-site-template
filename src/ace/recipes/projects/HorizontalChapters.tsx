import Link from "next/link";
import Image from "next/image";
import type { ProjectsProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Collection « horizontal-chapters » : défilement horizontal de grandes cartes
 * (scroll-snap CSS, pas de JS), chaque item comme un chapitre. Immersif, adapté
 * aux collections courtes. Scroll natif (jamais bloqué), tokens DA.
 */
export function HorizontalChapters({ items, className }: ProjectsProps) {
  return (
    <div
      className={cn(
        "flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:thin]",
        className,
      )}
    >
      {items.map((item, i) => (
        <Link
          key={item.href}
          href={item.href}
          className="group relative flex aspect-[3/4] w-[80vw] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] border border-border sm:w-[46vw] lg:w-[32vw]"
        >
          {item.media ? (
            <Image src={item.media.src} alt={item.media.alt} fill sizes="80vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          ) : (
            <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(160deg, color-mix(in oklch, var(--brand) 30%, var(--surface-3)), var(--surface-2))" }} />
          )}
          <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to top, oklch(0 0 0 / 0.55), transparent 55%)" }} />
          <div className="relative p-6 text-white">
            <span className="font-mono text-[0.6875rem] tracking-[0.12em] text-white/70">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-display text-2xl leading-tight font-light">{item.title}</h3>
            {item.meta?.length ? (
              <p className="mt-1 font-mono text-[0.6875rem] tracking-[0.06em] text-white/75 uppercase">
                {item.meta.join(" · ")}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
