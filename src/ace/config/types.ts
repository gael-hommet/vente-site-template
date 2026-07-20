/**
 * Types publics du contrat client ACE. Point d'import unique pour le moteur, le
 * générateur et les recipes.
 */
export type { ClientConfig, ClientConfigInput } from "./client-schema";
export type { ResolvedFeatures, FeatureConflict } from "./features";

export {
  INDUSTRIES,
  MOTION_INTENSITIES,
  WEBGL_INTENSITIES,
  DENSITIES,
  CONVERSIONS,
  COLLECTION_KINDS,
  ANALYTICS_PROVIDERS,
} from "./client-schema";
