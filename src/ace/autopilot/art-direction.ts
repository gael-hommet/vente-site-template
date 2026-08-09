import type { ArtDirection, AutopilotIntent } from "./types";

/**
 * ACE AUTOPILOT — direction artistique AUTONOME.
 *
 * L'utilisateur final ne doit pas devenir directeur artistique. ACE tranche.
 *
 * Ce module produit une direction DÉFENDABLE et déterministe à partir du
 * secteur et des mots de style de la demande. Ce n'est pas un tirage au sort :
 * chaque secteur a un parti-pris argumenté (`rationale`), et les indices de
 * style de l'utilisateur peuvent le déplacer.
 *
 * L'agent (Claude) peut ensuite AFFINER cette base — le champ `agentSupplied`
 * distingue honnêtement une direction calculée d'une direction retravaillée.
 */

type Recipes = ArtDirection["recipes"];

interface SectorProfile {
  preset: string;
  motionIntensity: ArtDirection["motionIntensity"];
  webglIntensity: ArtDirection["webglIntensity"];
  density: ArtDirection["density"];
  recipes: Recipes;
  concept: string;
  why: string;
}

/**
 * Partis-pris par secteur. Chaque ligne encode une intuition de métier :
 * un cabinet médical doit rassurer (sobre, lisible), un joaillier doit faire
 * désirer (cinématique, contrasté), un architecte doit montrer la matière.
 */
const SECTOR_PROFILES: Record<string, SectorProfile> = {
  hospitality: {
    preset: "atelier",
    motionIntensity: "cinematic",
    webglIntensity: "none",
    density: "comfortable",
    recipes: {
      hero: "media-first",
      navigation: "minimal-header",
      projects: "editorial-index",
      storytelling: "chaptered-story",
      conversion: "appointment-ready",
      layout: "editorial-layout",
    },
    concept:
      "L'accueil avant tout : on doit avoir faim, ou envie d'y dormir, dès la première image.",
    why: "En hospitalité, la photo et l'ambiance décident. Le média passe devant le texte, la réservation reste à un geste.",
  },
  architecture: {
    preset: "onyx",
    motionIntensity: "cinematic",
    webglIntensity: "accent",
    density: "spacious",
    recipes: {
      hero: "split-narrative",
      navigation: "editorial-folio",
      projects: "case-study-sequence",
      storytelling: "alternating-narrative",
      conversion: "premium-inquiry",
      layout: "editorial-layout",
    },
    concept:
      "La matière et le trait : de grands vides, des lignes nettes, le projet comme démonstration.",
    why: "Un architecte se juge sur ses réalisations : la collection est le cœur, le blanc tournant fait le sérieux.",
  },
  luxury: {
    preset: "onyx",
    motionIntensity: "cinematic",
    webglIntensity: "accent",
    density: "spacious",
    recipes: {
      hero: "media-first",
      navigation: "immersive-overlay",
      projects: "visual-grid",
      storytelling: "immersive-scroll",
      conversion: "premium-inquiry",
      layout: "immersive-layout",
    },
    concept: "Le désir avant l'information : lenteur, contraste profond, rareté.",
    why: "Le luxe se vend par la retenue et la mise en scène, pas par l'accumulation d'arguments.",
  },
  medical: {
    preset: "neutral",
    motionIntensity: "subtle",
    webglIntensity: "none",
    density: "comfortable",
    recipes: {
      hero: "typographic",
      navigation: "minimal-header",
      projects: "editorial-index",
      storytelling: "linear-sections",
      conversion: "appointment-ready",
      layout: "institutional-layout",
    },
    concept: "Rassurer : clarté, lisibilité, prise de rendez-vous évidente.",
    why: "En santé, la confiance passe par la sobriété. Toute esbroufe visuelle dessert le praticien.",
  },
  "professional-services": {
    preset: "neutral",
    motionIntensity: "subtle",
    webglIntensity: "none",
    density: "comfortable",
    recipes: {
      hero: "typographic",
      navigation: "minimal-header",
      projects: "case-study-sequence",
      storytelling: "data-led-story",
      conversion: "qualification-form",
      layout: "institutional-layout",
    },
    concept:
      "Crédibilité : preuves, méthode, cadre. On qualifie le prospect au lieu de le séduire.",
    why: "Avocats, conseils et experts se choisissent sur la compétence perçue et la clarté du process.",
  },
  "real-estate": {
    preset: "atelier",
    motionIntensity: "cinematic",
    webglIntensity: "none",
    density: "comfortable",
    recipes: {
      hero: "media-first",
      navigation: "minimal-header",
      projects: "visual-grid",
      storytelling: "chaptered-story",
      conversion: "qualification-form",
      layout: "editorial-layout",
    },
    concept: "Faire visiter avant de convaincre : le bien se montre, le contact se qualifie.",
    why: "L'immobilier vend un espace : la déambulation visuelle prime, le formulaire trie les intentions.",
  },
  automotive: {
    preset: "onyx",
    motionIntensity: "cinematic",
    webglIntensity: "immersive",
    density: "comfortable",
    recipes: {
      hero: "media-first",
      navigation: "minimal-header",
      projects: "visual-grid",
      storytelling: "immersive-scroll",
      conversion: "appointment-ready",
      layout: "product-layout",
    },
    concept: "L'objet en majesté : rotation, reflets, détail mécanique.",
    why: "L'automobile est un produit qu'on tourne autour ; la 3D y a un sens réel, pas décoratif.",
  },
  culture: {
    preset: "atelier",
    motionIntensity: "cinematic",
    webglIntensity: "none",
    density: "spacious",
    recipes: {
      hero: "typographic",
      navigation: "editorial-folio",
      projects: "editorial-index",
      storytelling: "chaptered-story",
      conversion: "minimal-contact",
      layout: "editorial-layout",
    },
    concept: "Le programme comme récit : place à l'œuvre, typographie affirmée.",
    why: "Une institution culturelle porte un propos ; la mise en page doit être un geste éditorial.",
  },
  technology: {
    preset: "neutral",
    motionIntensity: "subtle",
    webglIntensity: "accent",
    density: "compact",
    recipes: {
      hero: "split-narrative",
      navigation: "minimal-header",
      projects: "case-study-sequence",
      storytelling: "data-led-story",
      conversion: "qualification-form",
      layout: "editorial-layout",
    },
    concept: "Démontrer plutôt qu'affirmer : le produit, la preuve, le chiffre.",
    why: "En tech, la crédibilité vient de la démonstration et de la densité d'information utile.",
  },
  industry: {
    preset: "neutral",
    motionIntensity: "subtle",
    webglIntensity: "accent",
    density: "compact",
    recipes: {
      hero: "split-narrative",
      navigation: "minimal-header",
      projects: "case-study-sequence",
      storytelling: "data-led-story",
      conversion: "qualification-form",
      layout: "institutional-layout",
    },
    concept: "Le savoir-faire prouvé : process, capacités, références.",
    why: "L'industrie s'adresse à des acheteurs techniques : précision et preuve avant l'émotion.",
  },
};

/** Secteur inconnu : un éditorial premium sobre, jamais un choix au hasard. */
const FALLBACK_PROFILE: SectorProfile = {
  preset: "neutral",
  motionIntensity: "subtle",
  webglIntensity: "none",
  density: "comfortable",
  recipes: {
    hero: "typographic",
    navigation: "minimal-header",
    projects: "editorial-index",
    storytelling: "linear-sections",
    conversion: "minimal-contact",
    layout: "editorial-layout",
  },
  concept: "Éditorial premium sobre : lisible, crédible, sans effet gratuit.",
  why: "Secteur non identifié : on choisit la valeur sûre plutôt qu'un parti-pris inadapté.",
};

/** Indices de style qui poussent vers plus de retenue. */
const CALM_HINTS = ["sobre", "minimaliste", "épuré", "rassurant", "institutionnel", "naturel"];
/** Indices de style qui poussent vers plus de spectacle. */
const BOLD_HINTS = ["cinématique", "immersif", "audacieux", "luxe"];
/** Indices qui réchauffent la palette. */
const WARM_HINTS = ["chaleureux", "artisanal", "naturel"];

/**
 * Calcule la direction artistique. Déterministe : mêmes entrées, même sortie.
 * `agentSupplied` reste false — c'est une base solide, pas une validation
 * créative.
 */
export function decideArtDirection(
  intent: AutopilotIntent,
  options: { hasUsableAssets?: boolean } = {},
): ArtDirection {
  const profile = (intent.industry && SECTOR_PROFILES[intent.industry]) || FALLBACK_PROFILE;

  const hints = intent.styleHints.map((h) => h.toLowerCase());
  const wantsCalm = hints.some((h) => CALM_HINTS.includes(h));
  const wantsBold = hints.some((h) => BOLD_HINTS.includes(h));
  const wantsWarm = hints.some((h) => WARM_HINTS.includes(h));

  let motionIntensity = profile.motionIntensity;
  let webglIntensity = profile.webglIntensity;
  let preset = profile.preset;
  let recipes = profile.recipes;
  const adjustments: string[] = [];

  // Le client fournit de vraies photos : les montrer vaut mieux qu'une page
  // purement typographique. On promeut le hero au format média.
  if (options.hasUsableAssets === true && recipes.hero === "typographic") {
    recipes = { ...recipes, hero: "media-first" };
    adjustments.push(
      "visuels fournis par le client : hero porté par l'image plutôt que par la typographie",
    );
  }

  // La demande explicite de l'utilisateur prime sur le parti-pris sectoriel.
  if (wantsCalm && !wantsBold) {
    motionIntensity = motionIntensity === "cinematic" ? "subtle" : motionIntensity;
    webglIntensity = "none";
    adjustments.push("retenue demandée : animation adoucie, pas de 3D");
  }
  if (wantsBold && !wantsCalm) {
    motionIntensity = "cinematic";
    adjustments.push("spectacle demandé : narration cinématique au scroll");
  }
  if (wantsWarm && preset === "onyx") {
    preset = "atelier";
    adjustments.push("chaleur demandée : palette matiérée plutôt que contraste froid");
  }

  const rationale = [
    profile.why,
    ...adjustments,
    intent.deliverable === "demo"
      ? "Démonstration privée : le site est monté en noindex, sans publication."
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    concept: profile.concept,
    preset,
    motionIntensity,
    webglIntensity,
    density: profile.density,
    recipes,
    rationale,
    agentSupplied: false,
  };
}

/**
 * La direction retenue exige-t-elle des médias GÉNÉRÉS ?
 *
 * Deux conditions cumulatives :
 *  1. le parti-pris repose vraiment sur l'image (hero média/immersif animé) ;
 *  2. aucun asset exploitable n'a été fourni.
 *
 * Autrement dit : une entreprise qui fournit ses propres photos n'a AUCUN
 * besoin d'un générateur — bloquer sur l'absence de provider serait absurde.
 * Inversement, un parti-pris purement éditorial ne réclame jamais de génération.
 */
export function requiresGeneratedMedia(
  direction: ArtDirection,
  options: { hasUsableAssets?: boolean } = {},
): boolean {
  if (options.hasUsableAssets === true) return false;
  return direction.motionIntensity === "cinematic" && direction.recipes.hero === "media-first";
}

/** Secteurs couverts par un parti-pris dédié (le reste tombe sur le fallback). */
export const PROFILED_SECTORS = Object.keys(SECTOR_PROFILES);
