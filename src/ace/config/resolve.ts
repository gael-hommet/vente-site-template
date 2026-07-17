import type { BrandTokens, DesignLanguagePreset } from "./design-language";

/**
 * Turns a Design Language preset into the CSS custom-property overrides that
 * globals.css already consumes. Pure and testable; the DOM emission lives in
 * DesignLanguageStyle.
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

export function radiusToCssVars(radius: NonNullable<DesignLanguagePreset["radius"]>): CssVarMap {
  const vars: CssVarMap = {};
  if (radius.sm) vars["--radius-sm"] = radius.sm;
  if (radius.md) vars["--radius-md"] = radius.md;
  if (radius.lg) vars["--radius-lg"] = radius.lg;
  if (radius.xl) vars["--radius-xl"] = radius.xl;
  return vars;
}

function toDeclarations(vars: CssVarMap): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
}

/**
 * Full CSS text applying a preset, covering the same three scopes as
 * globals.css: light default, explicit dark toggle, and system dark.
 */
export function presetToCss(preset: DesignLanguagePreset): string {
  const radiusVars = preset.radius ? radiusToCssVars(preset.radius) : {};
  const light = toDeclarations({ ...brandTokensToCssVars(preset.light), ...radiusVars });
  const dark = toDeclarations(brandTokensToCssVars(preset.dark));

  return [
    `:root{${light}}`,
    `:root[data-theme="dark"]{${dark}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${dark}}}`,
  ].join("\n");
}
