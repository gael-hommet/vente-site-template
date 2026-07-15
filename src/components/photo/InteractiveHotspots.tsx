"use client";

import * as React from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Hotspot2D {
  /** Position in percent of the image box. */
  x: number;
  y: number;
  label: string;
  description?: string;
}

export interface InteractiveHotspotsProps {
  src: string;
  alt: string;
  hotspots: Hotspot2D[];
  className?: string;
}

/**
 * A 2D photograph annotated with accessible, keyboard-focusable hotspots. The
 * DOM counterpart to the 3D <Hotspot>. Good for interiors/products where you
 * have a flat image rather than a model.
 */
export function InteractiveHotspots({ src, alt, hotspots, className }: InteractiveHotspotsProps) {
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <div className={cn("relative overflow-hidden rounded-[var(--radius-lg)]", className)}>
      <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" />
      {hotspots.map((h, i) => (
        <div key={i} className="absolute" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
          <button
            type="button"
            onClick={() => setOpen((v) => (v === i ? null : i))}
            aria-expanded={open === i}
            aria-label={h.label}
            className="grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-black/50 text-white backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Plus className="size-4" />
          </button>
          {open === i && (
            <div className="glass absolute left-1/2 top-4 z-10 w-48 -translate-x-1/2 rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-md)]">
              <p className="text-sm font-semibold text-foreground">{h.label}</p>
              {h.description && <p className="mt-1 text-xs text-muted">{h.description}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
