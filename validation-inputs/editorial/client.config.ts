import type { ClientConfigInput } from "@/ace/config";

/**
 * FIXTURE INTERNE ACE — validation ÉDITORIALE. Identité fictive, aucune
 * entreprise réelle, aucun fait vérifiable inventé. Sert uniquement à prouver
 * que le moteur produit une expérience éditoriale (sobre, typographique, sans
 * WebGL) opposée à la validation immersive. Ne pas confondre avec un vrai
 * client. Aucun héritage du site témoin architectural existant.
 */
const config: ClientConfigInput = {
  identity: {
    name: "Revue Liseré",
    tagline: "Une revue de pensée visuelle",
    locale: "fr-FR",
    url: "https://revue-lisere.example",
  },
  industry: "culture",
  audience: {
    primary: "Lecteurs curieux, institutions culturelles, abonnés",
  },
  goals: {
    primaryConversion: "subscribe",
  },
  design: {
    preset: "editorial-light",
    motionIntensity: "subtle",
    webglIntensity: "none",
    density: "spacious",
    darkMode: true,
  },
  features: {
    contactForm: true,
    collections: true,
    stickyMobileCta: false,
    analytics: false,
    map: false,
  },
  recipes: {
    hero: "typographic",
    navigation: "editorial-folio",
    projects: "editorial-index",
    storytelling: "alternating-narrative",
    conversion: "minimal-contact",
    layout: "editorial-layout",
  },
  pages: [
    { key: "home", path: "/", title: "Sommaire", standard: "home" },
    { key: "collection", path: "/realisations", title: "Numéros", standard: "collection" },
    { key: "about", path: "/a-propos", title: "La revue", standard: "about" },
    { key: "contact", path: "/contact", title: "Nous écrire", standard: "contact" },
    { key: "legal", path: "/mentions-legales", title: "Mentions légales", standard: "legal" },
  ],
  collections: [{ id: "numeros", label: "Numéros", itemLabel: "numéro", kind: "articles" }],
  seo: {
    defaultDescription:
      "Revue Liseré — une revue fictive de pensée visuelle, éditée pour valider le moteur ACE.",
  },
  proposal: {
    isPrivateProposal: true,
    notice: "Démonstration privée — fixture interne de validation ACE.",
  },
};

export default config;
