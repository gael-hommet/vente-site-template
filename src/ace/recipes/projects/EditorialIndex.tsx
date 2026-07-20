import Link from "next/link";
import type { ProjectsProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Collection « editorial-index » : sommaire en lignes (index), titre display à
 * gauche, méta mono à droite, filet de conduite. Zéro média (ou vignette
 * discrète). Dense, typographique. Tokens DA.
 */
export function EditorialIndex({ items, className }: ProjectsProps) {
  return (
    <ol className={cn("divide-y divide-border border-y border-border", className)}>
      {items.map((item, i) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] sm:gap-8"
          >
            <span className="font-mono text-[0.75rem] text-muted tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-xl leading-tight font-light transition-colors group-hover:text-brand sm:text-2xl">
              {item.title}
            </span>
            {item.meta?.length ? (
              <span className="hidden text-right font-mono text-[0.6875rem] tracking-[0.06em] text-muted uppercase tabular-nums sm:block">
                {item.meta.join(" · ")}
              </span>
            ) : (
              <span aria-hidden />
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
