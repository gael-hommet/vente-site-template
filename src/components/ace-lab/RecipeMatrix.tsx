"use client";

import * as React from "react";
import {
  RECIPE_FAMILIES,
  MOTION_PROFILE_LIST,
  SCENE_PROFILE_LIST,
  type HeroProps,
  type NavProps,
  type ProjectsProps,
  type StorytellingProps,
  type ConversionProps,
  type LayoutProps,
} from "@/ace/recipes";
import { DESIGN_PRESETS, presetToCss } from "@/ace/config";
import { cn } from "@/lib/utils";

/**
 * Studio — matrice de comparaison recipes × Design Language. Contenu
 * totalement neutre (aucune identité client). Permet de vérifier que la
 * variation entre presets est profonde (surfaces/rayons/densité/ombres), pas
 * une simple teinte, ET que deux recipes de la même famille sont
 * structurellement distinctes sous le même Design Language.
 */

type FamilyKey = keyof typeof RECIPE_FAMILIES;

const FAMILY_LABELS: Record<FamilyKey, string> = {
  hero: "Heroes",
  navigation: "Navigation",
  projects: "Projects / Collections",
  storytelling: "Storytelling",
  conversion: "Conversion",
  layout: "Layouts",
};

const heroProps: HeroProps = {
  title: "Empreinte créative neutre",
  subtitle: "Contenu de démonstration — aucune identité client.",
  primaryCta: { label: "Action principale", href: "#" },
  secondaryCta: { label: "Action secondaire", href: "#" },
  media: null,
};
const navProps: NavProps = {
  brand: "Studio",
  links: [
    { label: "Un", href: "#un" },
    { label: "Deux", href: "#deux" },
    { label: "Trois", href: "#trois" },
  ],
  cta: { label: "Action", href: "#" },
};
const projProps: ProjectsProps = {
  items: [
    { title: "Élément A", href: "#a", meta: ["Cat. 1", "2024"], media: null },
    { title: "Élément B", href: "#b", meta: ["Cat. 2", "2024"], media: null },
    { title: "Élément C", href: "#c", meta: ["Cat. 1", "2023"], media: null },
  ],
};
const storyProps: StorytellingProps = {
  chapters: [
    { eyebrow: "01", title: "Chapitre un", body: "Corps de texte neutre du premier chapitre." },
    { eyebrow: "02", title: "Chapitre deux", body: "Corps de texte neutre du second chapitre." },
    {
      eyebrow: "03",
      title: "Chapitre trois",
      body: "Corps de texte neutre du troisième chapitre.",
    },
  ],
};
const convProps: ConversionProps = {
  title: "Point de conversion",
  description: "Contenu neutre de démonstration.",
  primaryCta: { label: "Action", href: "#" },
  phone: "01 00 00 00 00",
};
const layoutProps: LayoutProps = {
  header: (
    <div className="border-border bg-surface-2 border-b p-3 text-center text-sm">En-tête</div>
  ),
  children: (
    <div className="p-6 text-center text-sm">
      <p>Contenu neutre de démonstration.</p>
    </div>
  ),
  footer: (
    <div className="border-border bg-surface-2 border-t p-3 text-center text-sm">Pied de page</div>
  ),
};

function propsFor(family: FamilyKey): Record<string, unknown> {
  switch (family) {
    case "hero":
      return heroProps as unknown as Record<string, unknown>;
    case "navigation":
      return navProps as unknown as Record<string, unknown>;
    case "projects":
      return projProps as unknown as Record<string, unknown>;
    case "storytelling":
      return storyProps as unknown as Record<string, unknown>;
    case "conversion":
      return convProps as unknown as Record<string, unknown>;
    case "layout":
      return layoutProps as unknown as Record<string, unknown>;
  }
}

const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "tablet", label: "Tablette", width: "48rem" },
  { id: "mobile", label: "Mobile", width: "24rem" },
] as const;

export function RecipeMatrix() {
  const families = Object.keys(RECIPE_FAMILIES) as FamilyKey[];
  const [family, setFamily] = React.useState<FamilyKey>("hero");
  const [presetId, setPresetId] = React.useState(DESIGN_PRESETS[0]!.id);
  const [viewport, setViewport] = React.useState<(typeof VIEWPORTS)[number]["id"]>("desktop");
  const [dark, setDark] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  // Le thème est piloté par `:root[data-theme]` (voir globals.css / ThemeProvider) —
  // un attribut sur un wrapper local n'aurait aucun effet sur les tokens de
  // surface. Restaure l'attribut précédent en quittant/décochant.
  React.useEffect(() => {
    if (!dark) return;
    const root = document.documentElement;
    const previous = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "dark");
    return () => {
      if (previous) root.setAttribute("data-theme", previous);
      else root.removeAttribute("data-theme");
    };
  }, [dark]);

  const preset = DESIGN_PRESETS.find((p) => p.id === presetId) ?? DESIGN_PRESETS[0]!;
  const css = presetToCss(preset);
  const recipes = RECIPE_FAMILIES[family];
  const viewportWidth = VIEWPORTS.find((v) => v.id === viewport)?.width ?? "100%";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-6">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-muted mb-1 text-xs tracking-wide uppercase">Famille</legend>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Choix de la famille de recipe"
          >
            {families.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFamily(f)}
                aria-pressed={family === f}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
                  family === f
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                {FAMILY_LABELS[f]} ({recipes.length})
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-muted mb-1 text-xs tracking-wide uppercase">
            Design Language
          </legend>
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="border-border bg-surface rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm"
            aria-label="Choix du preset Design Language"
          >
            {DESIGN_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-muted mb-1 text-xs tracking-wide uppercase">Largeur</legend>
          <div className="flex gap-2" role="group" aria-label="Choix du viewport">
            {VIEWPORTS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewport(v.id)}
                aria-pressed={viewport === v.id}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
                  viewport === v.id
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
          Thème sombre
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
          Simuler reduced-motion
        </label>
      </div>

      {/* Portée du preset : id unique par rendu pour éviter toute collision de <style>. */}
      <style data-ace-studio-preset={presetId}>{css}</style>

      <div className="mx-auto w-full transition-[max-width]" style={{ maxWidth: viewportWidth }}>
        <div
          className={cn(
            "border-border bg-background flex flex-col gap-4 rounded-[var(--radius-lg)] border p-4",
            reducedMotion && "[&_*]:!animate-none [&_*]:!transition-none",
          )}
        >
          {recipes.map((r) => {
            const Comp = r.Component as unknown as React.ComponentType<Record<string, unknown>>;
            return (
              <div
                key={r.id}
                className="border-border overflow-hidden rounded-[var(--radius-md)] border"
              >
                <div className="bg-surface-2 border-border flex items-center justify-between border-b px-3 py-1.5">
                  <p className="font-mono text-xs font-medium">{r.id}</p>
                  <p className="text-muted text-xs">{r.title}</p>
                </div>
                <Comp {...propsFor(family)} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="border-border bg-surface rounded-[var(--radius-md)] border p-4">
          <p className="mb-2 text-sm font-semibold">
            Profils Motion ({MOTION_PROFILE_LIST.length})
          </p>
          <ul className="text-muted flex flex-col gap-1 text-sm">
            {MOTION_PROFILE_LIST.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">{m.id}</span>
                <span>
                  scroll fluide : {m.smoothScroll ? "oui" : "non"} · échelle durée ×
                  {m.durationScale}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-border bg-surface rounded-[var(--radius-md)] border p-4">
          <p className="mb-2 text-sm font-semibold">Profils Scene ({SCENE_PROFILE_LIST.length})</p>
          <ul className="text-muted flex flex-col gap-1 text-sm">
            {SCENE_PROFILE_LIST.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">{s.id}</span>
                <span>
                  actif : {s.enabled ? "oui" : "non"} · tier min : {s.minTier}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
