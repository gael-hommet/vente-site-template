import { z } from "zod";

/**
 * ACE — Contrat client UNIVERSEL.
 *
 * Un seul schéma validé décrit n'importe quel site client, tous secteurs
 * confondus. AUCUN secteur n'est obligatoire ; presque tout a un défaut sain, de
 * sorte qu'une configuration minimale (juste un nom) est valide. Le moteur, le
 * générateur, les recipes, le SEO et les formulaires consomment CE contrat —
 * jamais des objets ad-hoc.
 *
 * Règle d'intégrité : ne contient que des FAITS. Les champs non fournis restent
 * absents (jamais inventés). Voir client-loader pour la validation + défauts.
 */

/* -------------------------------------------------------------------------- */
/* Vocabulaires (ouverts, sector-agnostic)                                    */
/* -------------------------------------------------------------------------- */

export const INDUSTRIES = [
  "architecture",
  "hospitality",
  "automotive",
  "real-estate",
  "medical",
  "luxury",
  "industry",
  "culture",
  "technology",
  "professional-services",
  "other",
] as const;

export const MOTION_INTENSITIES = ["none", "subtle", "cinematic"] as const;
export const WEBGL_INTENSITIES = ["none", "accent", "immersive"] as const;
export const DENSITIES = ["compact", "comfortable", "spacious"] as const;
export const CONVERSIONS = [
  "contact",
  "quote",
  "booking",
  "inquiry",
  "subscribe",
  "purchase",
  "none",
] as const;
export const COLLECTION_KINDS = [
  "projects",
  "products",
  "rooms",
  "cases",
  "articles",
  "generic",
] as const;
export const ANALYTICS_PROVIDERS = ["none", "plausible", "ga4"] as const;

/* -------------------------------------------------------------------------- */
/* Fragments réutilisables                                                    */
/* -------------------------------------------------------------------------- */

const localeCode = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, "code locale invalide (ex. fr, en-US)");

const postalAddress = z.object({
  streetAddress: z.string().optional(),
  addressLocality: z.string().optional(),
  addressRegion: z.string().optional(),
  postalCode: z.string().optional(),
  addressCountry: z.string().optional(),
});

const geoPoint = z.object({ latitude: z.number(), longitude: z.number() });

const openingHours = z.object({
  dayOfWeek: z.array(z.string()).min(1),
  opens: z.string(),
  closes: z.string(),
});

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

const identity = z.object({
  name: z.string().min(1),
  legalName: z.string().optional(),
  tagline: z.string().optional(),
  /** Traitement typographique du nom (pas d'image logo requise). */
  logoText: z.string().optional(),
  /** Origine absolue (canonical/OG/sitemap). Sinon localhost en dev. */
  url: z.string().url().optional(),
  /** Locale principale. `locales` liste les langues actives (i18n). */
  locale: localeCode.default("fr-FR"),
  locales: z.array(localeCode).optional(),
});

const audience = z
  .object({
    primary: z.string().optional(),
    segments: z.array(z.string()).optional(),
  })
  .optional();

const goals = z
  .object({
    primaryConversion: z.enum(CONVERSIONS).default("contact"),
    secondary: z.array(z.string()).optional(),
  })
  .prefault({});

/** Sélection de recipes par famille (ids résolus dans les registres recipes). */
const recipes = z
  .object({
    hero: z.string().optional(),
    navigation: z.string().optional(),
    projects: z.string().optional(),
    storytelling: z.string().optional(),
    conversion: z.string().optional(),
    layout: z.string().optional(),
  })
  .prefault({});

const design = z
  .object({
    /** Id de preset Design Language (neutral/onyx/atelier/…). */
    preset: z.string().default("neutral"),
    /** Recommandations de fontes (chargées à la génération, pas au runtime). */
    fonts: z
      .object({ display: z.string().optional(), sans: z.string().optional(), mono: z.string().optional() })
      .optional(),
    motionIntensity: z.enum(MOTION_INTENSITIES).default("subtle"),
    webglIntensity: z.enum(WEBGL_INTENSITIES).default("none"),
    density: z.enum(DENSITIES).default("comfortable"),
    /** Thème sombre disponible (toggle). */
    darkMode: z.boolean().default(true),
  })
  .prefault({});

/** Feature flags explicites. Certains sont DÉRIVÉS des intensités (voir features.ts). */
const features = z
  .object({
    webgl: z.boolean().optional(),
    smoothScroll: z.boolean().optional(),
    contactForm: z.boolean().default(true),
    collections: z.boolean().optional(),
    i18n: z.boolean().optional(),
    analytics: z.boolean().optional(),
    stickyMobileCta: z.boolean().default(true),
    map: z.boolean().default(false),
  })
  .prefault({});

/** Page (standard ou sur-mesure). `standard` mappe une route du starter. */
const page = z.object({
  key: z.string().min(1),
  path: z.string().regex(/^\//, "path doit commencer par /"),
  title: z.string().min(1),
  enabled: z.boolean().default(true),
  standard: z
    .enum(["home", "collection", "collection-item", "about", "contact", "legal"])
    .optional(),
});

/** Collection générique (projets, produits, chambres, cas, articles…). */
const collection = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1),
  /** Libellé au singulier d'un item (ex. « projet », « chambre »). */
  itemLabel: z.string().min(1),
  kind: z.enum(COLLECTION_KINDS).default("generic"),
  /** Chemin de base des fiches (ex. /projets). */
  basePath: z.string().regex(/^\//).optional(),
});

const teamMember = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  bio: z.string().optional(),
});

const formField = z.object({
  name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  label: z.string().min(1),
  type: z.enum(["text", "email", "tel", "textarea", "select"]).default("text"),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

const form = z
  .object({
    kind: z.enum(["contact", "quote", "booking", "inquiry"]).default("contact"),
    submitLabel: z.string().optional(),
    fields: z.array(formField).optional(),
  })
  .prefault({});

const seo = z
  .object({
    titleTemplate: z.string().optional(),
    defaultDescription: z.string().optional(),
    ogImage: z.string().optional(),
    /** Force noindex (proposition privée, preview). */
    noindex: z.boolean().optional(),
  })
  .prefault({});

const analytics = z
  .object({
    provider: z.enum(ANALYTICS_PROVIDERS).default("none"),
    id: z.string().optional(),
  })
  .prefault({});

const privacy = z
  .object({
    cookieBanner: z.boolean().default(false),
    policyPath: z.string().optional(),
  })
  .prefault({});

/** Proposition privée non sollicitée (démo présentée au prospect). */
const proposal = z
  .object({
    isPrivateProposal: z.boolean().default(false),
    notice: z.string().optional(),
  })
  .prefault({});

/** Coordonnées : FAITS vérifiés uniquement, tout optionnel. */
const contact = z
  .object({
    telephone: z.string().optional(),
    email: z.string().email().optional(),
    address: postalAddress.optional(),
    geo: geoPoint.optional(),
    openingHours: z.array(openingHours).optional(),
    sameAs: z.array(z.string().url()).optional(),
  })
  .optional();

/* -------------------------------------------------------------------------- */
/* Schéma racine                                                              */
/* -------------------------------------------------------------------------- */

export const clientConfigSchema = z.object({
  identity,
  industry: z.enum(INDUSTRIES).default("other"),
  audience,
  goals,
  design,
  features,
  recipes,
  pages: z.array(page).optional(),
  collections: z.array(collection).optional(),
  team: z.array(teamMember).optional(),
  form,
  seo,
  analytics,
  privacy,
  proposal,
  contact,
});

/** Entrée AVANT défauts/validation (tout optionnel sauf identity.name). */
export type ClientConfigInput = z.input<typeof clientConfigSchema>;
/** Sortie APRÈS parsing (défauts appliqués). */
export type ClientConfig = z.output<typeof clientConfigSchema>;
