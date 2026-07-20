/**
 * Types de la sélection de recipes résolue. Séparés de la valeur (client
 * .resolved.ts) pour que le générateur puisse réécrire uniquement la valeur en
 * important ces types stables.
 */

export interface ResolvedRecipeSelection {
  hero: string;
  navigation: string;
  projects: string;
  storytelling: string;
  conversion: string;
  layout: string;
}

export interface ResolvedClientMeta {
  recipes: ResolvedRecipeSelection;
  /** Intensité motion déclarée (mappe vers un profil Motion). */
  motionIntensity: "none" | "subtle" | "cinematic";
  /** Intensité WebGL déclarée (mappe vers un profil Scene). */
  webglIntensity: "none" | "accent" | "immersive";
  density: "compact" | "comfortable" | "spacious";
}
