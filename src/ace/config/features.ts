import type { ClientConfig } from "./client-schema";

/**
 * Résolution des feature flags. Certains flags sont EXPLICITES dans la config,
 * d'autres sont DÉRIVÉS des intensités / du contenu (ex. `webglIntensity` ≠
 * "none" ⇒ webgl actif). `resolveFeatures` produit l'ensemble final booléen que
 * le layout, le générateur et les recipes consomment. `findFeatureConflicts`
 * détecte les combinaisons incompatibles (à traiter avant génération).
 */

export interface ResolvedFeatures {
  webgl: boolean;
  smoothScroll: boolean;
  contactForm: boolean;
  collections: boolean;
  i18n: boolean;
  analytics: boolean;
  stickyMobileCta: boolean;
  map: boolean;
  darkMode: boolean;
}

export function resolveFeatures(cfg: ClientConfig): ResolvedFeatures {
  const f = cfg.features;
  const localesCount = cfg.identity.locales?.length ?? 0;
  const collectionsCount = cfg.collections?.length ?? 0;
  return {
    // Explicite si fourni, sinon dérivé de l'intensité WebGL.
    webgl: f.webgl ?? cfg.design.webglIntensity !== "none",
    // Le smooth-scroll n'a de sens qu'en Motion cinématique.
    smoothScroll: f.smoothScroll ?? cfg.design.motionIntensity === "cinematic",
    contactForm: f.contactForm,
    collections: f.collections ?? collectionsCount > 0,
    i18n: f.i18n ?? localesCount > 1,
    analytics: f.analytics ?? cfg.analytics.provider !== "none",
    stickyMobileCta: f.stickyMobileCta,
    map: f.map,
    darkMode: cfg.design.darkMode,
  };
}

export interface FeatureConflict {
  feature: string;
  message: string;
}

/**
 * Détecte les incohérences entre flags explicites et intensités/contenu. Renvoie
 * la liste (vide si tout est cohérent) — le générateur échoue proprement dessus.
 */
export function findFeatureConflicts(cfg: ClientConfig): FeatureConflict[] {
  const out: FeatureConflict[] = [];
  const f = cfg.features;
  const localesCount = cfg.identity.locales?.length ?? 0;
  const collectionsCount = cfg.collections?.length ?? 0;

  if (f.webgl === false && cfg.design.webglIntensity !== "none") {
    out.push({
      feature: "webgl",
      message: `webglIntensity="${cfg.design.webglIntensity}" mais features.webgl=false (incompatible).`,
    });
  }
  if (f.webgl === true && cfg.design.webglIntensity === "none") {
    out.push({
      feature: "webgl",
      message: "features.webgl=true mais webglIntensity=\"none\" (rien à rendre en 3D).",
    });
  }
  if (f.i18n === true && localesCount < 2) {
    out.push({
      feature: "i18n",
      message: "features.i18n=true mais moins de 2 locales déclarées.",
    });
  }
  if (f.analytics === true && cfg.analytics.provider === "none") {
    out.push({
      feature: "analytics",
      message: "features.analytics=true mais analytics.provider=\"none\".",
    });
  }
  if (f.collections === true && collectionsCount === 0) {
    out.push({
      feature: "collections",
      message: "features.collections=true mais aucune collection définie.",
    });
  }
  if (cfg.analytics.provider !== "none" && !cfg.analytics.id) {
    out.push({
      feature: "analytics",
      message: `analytics.provider="${cfg.analytics.provider}" nécessite analytics.id.`,
    });
  }
  return out;
}
