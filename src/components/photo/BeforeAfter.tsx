"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BeforeAfterProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  className?: string;
}

/**
 * Before/After image comparison slider. Keyboard-accessible via a range input
 * (arrow keys move the divider). No motion library needed.
 */
export function BeforeAfter({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  className,
}: BeforeAfterProps) {
  const [pos, setPos] = React.useState(50);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-[var(--radius-lg)]", className)}>
      <Image src={afterSrc} alt={afterAlt} fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={beforeSrc} alt={beforeAlt} fill sizes="100vw" className="object-cover" />
      </div>

      {/* Divider */}
      <div
        aria-hidden
        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90 shadow-[var(--shadow-md)]"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow">
          ↔
        </span>
      </div>

      <label className="sr-only" htmlFor="ba-range">
        Comparateur avant / après
      </label>
      <input
        id="ba-range"
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-x-0 bottom-3 mx-auto block w-[90%] cursor-ew-resize accent-brand focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
      />
    </div>
  );
}
