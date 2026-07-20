import type { ResolvedFeatures } from "@/ace/config";

/**
 * Feature flags résolus, générés par `pnpm ace:new-site` à partir du contrat
 * client (`input/client.config.ts`). Ce fichier est réécrit à chaque
 * génération — ne pas éditer à la main dans le moteur ; sur un site client
 * généré, il reflète la configuration réellement utilisée.
 *
 * Défauts neutres tant qu'aucune génération n'a eu lieu (moteur lui-même).
 */
export const resolvedFeatures: ResolvedFeatures = {
  webgl: false,
  smoothScroll: false,
  contactForm: true,
  collections: false,
  i18n: false,
  analytics: false,
  stickyMobileCta: true,
  map: false,
  darkMode: true,
};
