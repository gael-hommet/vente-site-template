import type { ClientConfigInput } from "@/ace/config";

/**
 * EXEMPLE de configuration client ACE — point de départ neutre.
 *
 * Ce fichier est un GABARIT : aucune information ici n'est un fait réel. Avant
 * de lancer `pnpm ace:new-site`, remplace chaque valeur par des faits vérifiés
 * du brief client (voir `input/CLIENT_BRIEF.md`). Ne jamais inventer prix, avis,
 * certifications, adresse ou horaires : laisse le champ absent si l'info
 * manque.
 *
 * Référence complète du contrat : `src/ace/config/client-schema.ts`.
 * Ids de recipes disponibles : `src/ace/recipes/catalog.ts`.
 */
const config: ClientConfigInput = {
  identity: {
    name: "Nom du client [À CONFIRMER]",
    tagline: "Accroche courte [À CONFIRMER]",
    locale: "fr-FR",
  },
  industry: "other",
  goals: {
    primaryConversion: "contact",
  },
  design: {
    preset: "neutral",
    motionIntensity: "subtle",
    webglIntensity: "none",
    density: "comfortable",
    darkMode: true,
  },
  features: {
    contactForm: true,
    stickyMobileCta: true,
    collections: false,
    analytics: false,
    map: false,
  },
  recipes: {
    hero: "typographic",
    navigation: "minimal-header",
    projects: "visual-grid",
    storytelling: "linear-sections",
    conversion: "minimal-contact",
    layout: "editorial-layout",
  },
  pages: [
    { key: "home", path: "/", title: "Accueil", standard: "home" },
    { key: "about", path: "/a-propos", title: "À propos", standard: "about" },
    { key: "contact", path: "/contact", title: "Contact", standard: "contact" },
    { key: "legal", path: "/mentions-legales", title: "Mentions légales", standard: "legal" },
  ],
  form: {
    kind: "contact",
  },
  seo: {
    defaultDescription: "Description par défaut [À CONFIRMER].",
  },
  analytics: {
    provider: "none",
  },
  proposal: {
    isPrivateProposal: false,
  },
};

export default config;
