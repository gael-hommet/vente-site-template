import type {
  BrandTokens,
  DesignLanguagePreset,
  SurfaceTokens,
} from "./design-language";

/**
 * Turns a Design Language preset into the CSS custom-property overrides that
 * globals.css already consumes. Pure and testable; the DOM emission lives in
 * DesignLanguageStyle. Couvre : brand, radius, surfaces (par thème), ombres,
 * densité (largeur de contenu + rythme de section).
 */

export type CssVarMap = Record<string, string>;

export function brandTokensToCssVars(tokens: BrandTokens): CssVarMap {
  const vars: CssVarMap = {
    "--brand": tokens.brand,
    "--brand-strong": tokens.brandStrong,
    "--brand-foreground": tokens.brandForeground,
  };
  if (tokens.ring) vars["--ring"] = tokens.ring;
  if (tokens.shadowGlow) vars["--shadow-glow"] = tokens.shadowGlow;
  return vars;
}

export function surfaceTokensToCssVars(s: SurfaceTokens): CssVarMap {
  return {
    "--background": s.background,
    "--foreground": s.foreground,
    "--surface": s.surface,
    "--surface-2": s.surface2,
    "--surface-3": s.surface3,
    "--muted": s.muted,
    "--border": s.border,
  };
}

export function radiusToCssVars(radius: NonNullable<DesignLanguagePreset["radius"]>): CssVarMap {
  const vars: CssVarMap = {};
  if (radius.sm) vars["--radius-sm"] = radius.sm;
  if (radius.md) vars["--radius-md"] = radius.md;
  if (radius.lg) vars["--radius-lg"] = radius.lg;
  if (radius.xl) vars["--radius-xl"] = radius.xl;
  return vars;
}

function shadowsToCssVars(shadows: NonNullable<DesignLanguagePreset["shadows"]>): CssVarMap {
  const vars: CssVarMap = {};
  if (shadows.sm) vars["--shadow-sm"] = shadows.sm;
  if (shadows.md) vars["--shadow-md"] = shadows.md;
  if (shadows.lg) vars["--shadow-lg"] = shadows.lg;
  return vars;
}

function densityToCssVars(density: NonNullable<DesignLanguagePreset["density"]>): CssVarMap {
  const vars: CssVarMap = {};
  if (density.contentWidth) vars["--content-width"] = density.contentWidth;
  if (density.sectionSpace) vars["--section-space"] = density.sectionSpace;
  return vars;
}

function toDeclarations(vars: CssVarMap): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
}

/**
 * Full CSS text applying a preset, couvrant les 3 portées de globals.css :
 * clair par défaut, sombre explicite, sombre système.
 */
export function presetToCss(preset: DesignLanguagePreset): string {
  const radiusVars = preset.radius ? radiusToCssVars(preset.radius) : {};
  const shadowVars = preset.shadows ? shadowsToCssVars(preset.shadows) : {};
  const densityVars = preset.density ? densityToCssVars(preset.density) : {};
  const lightSurfaces = preset.surfaces ? surfaceTokensToCssVars(preset.surfaces.light) : {};
  const darkSurfaces = preset.surfaces ? surfaceTokensToCssVars(preset.surfaces.dark) : {};

  const light = toDeclarations({
    ...brandTokensToCssVars(preset.light),
    ...lightSurfaces,
    ...radiusVars,
    ...shadowVars,
    ...densityVars,
  });
  const dark = toDeclarations({
    ...brandTokensToCssVars(preset.dark),
    ...darkSurfaces,
  });

  return [
    `:root{${light}}`,
    `:root[data-theme="dark"]{${dark}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}`,
  ].join("\n");
}
