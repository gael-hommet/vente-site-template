import Link from "next/link";
import Image from "next/image";
import type { ProjectsProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Collection « visual-grid » : grille de cartes média-en-tête, titre + méta.
 * Générique (projets/produits/chambres/véhicules/articles). Anti-CLS (aspect
 * fixe), tokens DA. Sans média : aplat brand décoratif.
 */
export function VisualGrid({ items, className }: ProjectsProps) {
  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((item) => (
        <li key={item.href} className="group">
          <Link
            href={item.href}
            className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            <div className="border-border relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border">
              {item.media ? (
                <Image
                  src={item.media.src}
                  alt={item.media.alt}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(150deg, color-mix(in oklch, var(--brand) 26%, var(--surface-2)), var(--surface-3))",
                  }}
                />
              )}
            </div>
            <h3 className="mt-4 text-lg font-medium">{item.title}</h3>
            {item.meta?.length ? (
              <p className="text-muted mt-1 font-mono text-[0.75rem] tracking-[0.06em] uppercase tabular-nums">
                {item.meta.join(" · ")}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
