"use client";

import * as React from "react";
import { DESIGN_PRESETS, presetToCss } from "@/ace/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Live Design Language switcher. Injects the selected preset's CSS exactly as
 * <DesignLanguageStyle/> would in a generated site, so every token-driven
 * surface on this page retints instantly. Local to the lab session — nothing
 * is persisted.
 */
export function PresetPreview() {
  const [active, setActive] = React.useState("neutral");
  const preset = DESIGN_PRESETS.find((p) => p.id === active);
  const css = active === "neutral" ? "" : preset ? presetToCss(preset) : "";

  return (
    <div className="flex flex-col gap-6">
      {css ? <style data-ace-lab-preset={active}>{css}</style> : null}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choix du preset">
        {DESIGN_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(p.id)}
            aria-pressed={active === p.id}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
              active === p.id
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {p.title}
          </button>
        ))}
      </div>
      {preset ? (
        <p className="text-muted text-sm">
          {preset.description} — mouvement <strong>{preset.motionCharacter}</strong>
          {preset.recommends?.displayFont
            ? ` · police display recommandée : ${preset.recommends.displayFont}`
            : ""}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Typography specimen — retints/reshapes with the preset. */}
        <div className="border-border bg-surface flex flex-col gap-3 rounded-[var(--radius-lg)] border p-6">
          <p className="text-muted text-xs tracking-wide uppercase">Échelle typographique</p>
          <p className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight">
            Display 36
          </p>
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Titre section 24
          </p>
          <p className="text-base">Corps de texte 16 — lisibilité et rythme vertical.</p>
          <p className="text-muted text-sm">Texte secondaire 14 — légendes et métadonnées.</p>
          <p className="font-[family-name:var(--font-mono)] text-sm">Mono 14 — code & chiffres</p>
        </div>

        {/* Component specimen — brand tokens in action. */}
        <div className="border-border bg-surface flex flex-col items-start gap-4 rounded-[var(--radius-lg)] border p-6">
          <p className="text-muted text-xs tracking-wide uppercase">Composants (tokens live)</p>
          <div className="flex flex-wrap gap-2">
            <Button>Action principale</Button>
            <Button variant="outline">Secondaire</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="brand">Badge brand</Badge>
            <Badge variant="neutral">Badge neutre</Badge>
          </div>
          <div className="flex items-center gap-3">
            {(["--brand", "--brand-strong", "--brand-foreground", "--ring"] as const).map((v) => (
              <span key={v} className="flex flex-col items-center gap-1">
                <span
                  aria-hidden
                  className="border-border inline-block size-8 rounded-full border"
                  style={{ background: `var(${v})` }}
                />
                <span className="text-muted font-mono text-[10px]">{v}</span>
              </span>
            ))}
          </div>
          <div
            className="h-2 w-full rounded-full"
            style={{ boxShadow: "var(--shadow-glow)", background: "var(--brand)" }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
