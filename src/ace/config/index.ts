import { createRegistry } from "@/ace/core";
import { designLanguageSchema, type DesignLanguagePreset } from "./design-language";
import { neutralPreset } from "./presets/neutral";
import { onyxPreset } from "./presets/onyx";
import { atelierPreset } from "./presets/atelier";

export {
  designLanguageSchema,
  type DesignLanguagePreset,
  type BrandTokens,
} from "./design-language";
export { presetToCss, brandTokensToCssVars, type CssVarMap } from "./resolve";

/** All shipped presets, schema-validated at module load (fail fast). */
export const DESIGN_PRESETS: readonly DesignLanguagePreset[] = [
  neutralPreset,
  onyxPreset,
  atelierPreset,
].map((p) => designLanguageSchema.parse(p));

const registry = createRegistry("design-language", DESIGN_PRESETS);

export function getDesignPreset(id: string): DesignLanguagePreset {
  return registry.get(id);
}

export function listDesignPresets(): readonly DesignLanguagePreset[] {
  return registry.list();
}
