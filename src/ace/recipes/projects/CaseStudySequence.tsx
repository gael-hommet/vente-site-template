import Link from "next/link";
import Image from "next/image";
import type { ProjectsProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Collection « case-study-sequence » : suite de grandes sections pleine largeur,
 * média et texte alternés gauche/droite. Rythme lent, mise en valeur forte de
 * chaque item (études de cas). Tokens DA, anti-CLS.
 */
export function CaseStudySequence({ items, className }: ProjectsProps) {
  return (
    <div className={cn("flex flex-col gap-16 sm:gap-24", className)}>
      {items.map((item, i) => {
        const reversed = i % 2 === 1;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group grid items-center gap-8 md:grid-cols-2 md:gap-14"
          >
            <div className={cn("relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-border", reversed && "md:order-2")}>
              {item.media ? (
                <Image src={item.media.src} alt={item.media.alt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              ) : (
                <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(150deg, color-mix(in oklch, var(--brand) 24%, var(--surface-2)), var(--surface-3))" }} />
              )}
            </div>
            <div className={cn(reversed && "md:order-1")}>
              <span className="font-mono text-[0.75rem] tracking-[0.12em] text-muted tabular-nums">
                {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-[clamp(1.75rem,3.5vw,3rem)] leading-tight font-light transition-colors group-hover:text-brand">
                {item.title}
              </h3>
              {item.meta?.length ? (
                <p className="mt-3 font-mono text-[0.75rem] tracking-[0.06em] text-muted uppercase tabular-nums">
                  {item.meta.join(" · ")}
                </p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
