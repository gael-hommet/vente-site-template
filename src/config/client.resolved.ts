import type { ResolvedClientMeta } from "./client.resolved.types";

/**
 * Sélection de recipes + Design Language RÉSOLUS pour ce site, générés par
 * `ace:new-site` depuis le contrat client (`client.config.ts`). Ce fichier est
 * réécrit à chaque génération — ne pas éditer à la main dans le moteur.
 *
 * La home config-driven (`ConfiguredHome`) et l'en-tête (`ConfiguredHeader`)
 * lisent CES ids pour monter les bonnes recettes. Un fallback runtime protège
 * le rendu (voir `has*Recipe`).
 *
 * Défaut NEUTRE tant qu'aucune génération n'a eu lieu (le moteur lui-même).
 */
export const resolvedClient: ResolvedClientMeta = {
  recipes: {
    hero: "typographic",
    navigation: "minimal-header",
    projects: "visual-grid",
    storytelling: "linear-sections",
    conversion: "minimal-contact",
    layout: "editorial-layout",
  },
  motionIntensity: "subtle",
  webglIntensity: "none",
  density: "comfortable",
};

export type { ResolvedClientMeta, ResolvedRecipeSelection } from "./client.resolved.types";
