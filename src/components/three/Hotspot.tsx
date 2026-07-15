"use client";

import * as React from "react";
import { Html } from "@react-three/drei";
import { Plus } from "lucide-react";

export interface HotspotProps {
  position: [number, number, number];
  label: string;
  description?: string;
  /** Optional distance-based occlusion (drei accepts refs). */
  occlude?: boolean;
}

/**
 * A 3D annotation marker projected to screen space via drei's Html. Accessible:
 * it's a real <button> with an expandable label, keyboard focusable. Use to
 * point at features on a product/vehicle.
 */
export function Hotspot({ position, label, description, occlude = false }: HotspotProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <Html position={position} center distanceFactor={8} occlude={occlude}>
      <div className="pointer-events-auto">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={label}
          className="grid size-7 place-items-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-white"
        >
          <Plus className="size-4" />
        </button>
        {open && (
          <div className="glass mt-2 w-48 rounded-[var(--radius-md)] p-3 text-left shadow-[var(--shadow-md)]">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            {description && <p className="mt-1 text-xs text-muted">{description}</p>}
          </div>
        )}
      </div>
    </Html>
  );
}
