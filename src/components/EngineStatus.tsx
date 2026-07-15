"use client";

import { useQuality } from "@/hooks/useQuality";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Live engine status: shows the detected quality tier + device capabilities.
 * Demonstrates the DeviceQualityProvider is running. Client component.
 */
export function EngineStatus({ className }: { className?: string }) {
  const { tier, profile, detected } = useQuality();

  const rows: { label: string; value: string; ok: boolean }[] = [
    { label: "Tier", value: detected ? tier : "détection…", ok: detected },
    {
      label: "WebGL",
      value: profile.webgl ? "disponible" : "indisponible (fallback)",
      ok: profile.webgl,
    },
    {
      label: "Reduced motion",
      value: profile.reducedMotion ? "actif" : "inactif",
      ok: !profile.reducedMotion,
    },
    { label: "Save-data", value: profile.saveData ? "actif" : "inactif", ok: !profile.saveData },
    { label: "DPR", value: String(profile.dpr), ok: true },
  ];

  return (
    <div className={cn("glass rounded-[var(--radius-lg)] p-5", className)}>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "inline-block size-2.5 rounded-full",
            detected ? "bg-success" : "bg-warning",
          )}
          aria-hidden
        />
        <span className="text-sm font-medium">État du moteur</span>
        <Badge variant="brand" className="ml-auto">
          {detected ? tier : "…"}
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2">
            <dt className="text-muted">{r.label}</dt>
            <dd className={cn("tabular-nums", r.ok ? "text-foreground" : "text-warning")}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
