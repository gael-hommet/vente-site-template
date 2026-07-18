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

// Contrat client universel (Phase 2) : schéma typé, features, loader.
export { clientConfigSchema } from "./client-schema";
export type { ClientConfig, ClientConfigInput } from "./client-schema";
export {
  INDUSTRIES,
  MOTION_INTENSITIES,
  WEBGL_INTENSITIES,
  DENSITIES,
  CONVERSIONS,
  COLLECTION_KINDS,
  ANALYTICS_PROVIDERS,
} from "./client-schema";
export { resolveFeatures, findFeatureConflicts } from "./features";
export type { ResolvedFeatures, FeatureConflict } from "./features";
export {
  loadClientConfig,
  inspectClientConfig,
  ClientConfigError,
  type LoadedClientConfig,
} from "./client-loader";
export { neutralClientConfig } from "./client-defaults";
export {
  parseOklch,
  oklchToSrgb,
  relativeLuminance,
  contrastRatio,
  contrastOklch,
  compositeOver,
  type Rgb,
} from "./contrast";

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
