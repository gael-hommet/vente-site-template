import type { ClientConfigInput } from "@/ace/config";

/**
 * FIXTURE INTERNE ACE — validation IMMERSIVE. Identité fictive, aucun produit
 * réel, aucun fait vérifiable inventé. Sert uniquement à prouver que le moteur
 * produit une expérience immersive (sombre, plein cadre, WebGL réel + fallback,
 * mouvement cinématique) OPPOSÉE à la validation éditoriale. Aucun héritage du
 * site témoin architectural existant.
 */
const config: ClientConfigInput = {
  identity: {
    name: "Orbe",
    tagline: "L'objet lumière",
    locale: "fr-FR",
    url: "https://orbe.example",
  },
  industry: "technology",
  audience: {
    primary: "Amateurs de design d'objet, early adopters, prescripteurs",
  },
  goals: {
    primaryConversion: "inquiry",
  },
  design: {
    preset: "precision-dark",
    motionIntensity: "cinematic",
    webglIntensity: "immersive",
    density: "compact",
    darkMode: true,
  },
  features: {
    webgl: true,
    contactForm: true,
    collections: true,
    smoothScroll: true,
    stickyMobileCta: true,
    analytics: false,
    map: false,
  },
  recipes: {
    hero: "media-first",
    navigation: "immersive-overlay",
    projects: "horizontal-chapters",
    storytelling: "immersive-scroll",
    conversion: "premium-inquiry",
    layout: "immersive-layout",
  },
  pages: [
    { key: "home", path: "/", title: "Orbe", standard: "home" },
    { key: "collection", path: "/realisations", title: "Objets", standard: "collection" },
    { key: "about", path: "/a-propos", title: "Le studio", standard: "about" },
    { key: "contact", path: "/contact", title: "Demander", standard: "contact" },
    { key: "legal", path: "/mentions-legales", title: "Mentions légales", standard: "legal" },
  ],
  collections: [{ id: "objets", label: "Objets", itemLabel: "objet", kind: "products" }],
  seo: {
    defaultDescription:
      "Orbe — un objet lumière fictif, présenté pour valider le moteur immersif ACE.",
  },
  proposal: {
    isPrivateProposal: true,
    notice: "Démonstration privée — fixture interne de validation ACE.",
  },
};

export default config;
