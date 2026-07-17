import { presetToCss } from "./resolve";
import { getDesignPreset } from "./index";

/**
 * Server component applying a Design Language preset. Mount once in the root
 * layout, after globals.css, so the preset's overrides win the cascade:
 *
 *   <DesignLanguageStyle preset="onyx" />
 *
 * With the "neutral" preset (or when omitted by the caller) nothing is emitted:
 * globals.css already IS the neutral design language.
 */
export function DesignLanguageStyle({ preset }: { preset: string }) {
  if (preset === "neutral") return null;
  const css = presetToCss(getDesignPreset(preset));
  return <style data-ace-design-language={preset}>{css}</style>;
}
