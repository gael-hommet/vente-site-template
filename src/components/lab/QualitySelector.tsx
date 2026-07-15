"use client";

import { useQuality } from "@/hooks/useQuality";
import { cn } from "@/lib/utils";
import type { QualityTier } from "@/types";

const TIERS: { tier: QualityTier; hint: string }[] = [
  { tier: "ULTRA", hint: "Desktop puissant · effets complets" },
  { tier: "BALANCED", hint: "Mobile récent · effets réduits" },
  { tier: "LITE", hint: "Ancien appareil · fallback média" },
];

/**
 * ULTRA / BALANCED / LITE selector. Overrides the auto-detected tier so you can
 * preview every device path from one machine. "Auto" clears the override.
 */
export function QualitySelector({ className }: { className?: string }) {
  const { tier, override, setOverride } = useQuality();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {TIERS.map(({ tier: t, hint }) => (
          <button
            key={t}
            type="button"
            onClick={() => setOverride(t)}
            aria-pressed={tier === t}
            title={hint}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
              tier === t
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOverride(null)}
          aria-pressed={override === null}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
            override === null
              ? "border-foreground text-foreground"
              : "border-border text-muted hover:text-foreground",
          )}
        >
          Auto
        </button>
      </div>
      <p className="text-muted text-xs">
        Tier actif : <span className="text-foreground font-medium">{tier}</span>
        {override ? " (forcé)" : " (détecté)"}
      </p>
    </div>
  );
}
