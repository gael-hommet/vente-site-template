import { createRegistry } from "@/ace/core";
import type {
  ConversionProps,
  HeroProps,
  LayoutProps,
  MotionProfile,
  NavProps,
  ProjectsProps,
  Recipe,
  RecipeMeta,
  SceneProfile,
  StorytellingProps,
} from "./types";

// Heroes
import { TypographicHero } from "./heroes/TypographicHero";
import { MediaFirstHero } from "./heroes/MediaFirstHero";
import { SplitNarrativeHero } from "./heroes/SplitNarrativeHero";
// Navigation
import { MinimalHeader } from "./navigation/MinimalHeader";
import { EditorialFolio } from "./navigation/EditorialFolio";
import { ImmersiveOverlay } from "./navigation/ImmersiveOverlay";
import { TraditionalPremium } from "./navigation/TraditionalPremium";
// Projects
import { VisualGrid } from "./projects/VisualGrid";
import { EditorialIndex } from "./projects/EditorialIndex";
import { HorizontalChapters } from "./projects/HorizontalChapters";
import { CaseStudySequence } from "./projects/CaseStudySequence";
// Storytelling
import { LinearSections } from "./storytelling/LinearSections";
import { AlternatingNarrative } from "./storytelling/AlternatingNarrative";
import { ChapteredStory } from "./storytelling/ChapteredStory";
import { DataLedStory } from "./storytelling/DataLedStory";
import { ImmersiveScroll } from "./storytelling/ImmersiveScroll";
// Conversion
import { MinimalContact } from "./conversion/MinimalContact";
import { PremiumInquiry } from "./conversion/PremiumInquiry";
import { QualificationForm } from "./conversion/QualificationForm";
import { AppointmentReady } from "./conversion/AppointmentReady";
// Layouts
import { EditorialLayout, ImmersiveLayout, ProductLayout, InstitutionalLayout } from "./layouts";
// Profiles (data)
import { MOTION_PROFILES } from "./motion/profiles";
import { SCENE_PROFILES } from "./scenes/profiles";

/**
 * Registres de recipes par famille (fail-fast sur doublon d'id). Le contrat
 * client sélectionne une recette par id ; `validateRecipeSelection` refuse tout
 * id inexistant (quality gate du générateur).
 */

const meta = (
  id: string,
  family: RecipeMeta["family"],
  title: string,
  description: string,
  tags: readonly string[],
) => ({ id, family, title, description, tags }) as const;

const heroes = createRegistry<Recipe<HeroProps>>("recipes:hero", [
  {
    ...meta("typographic", "hero", "Typographique", "Le titre est l'image, sans média.", [
      "typography-first",
      "no-media",
    ]),
    Component: TypographicHero,
  },
  {
    ...meta("media-first", "hero", "Média plein cadre", "Média plein écran + voile, immersif.", [
      "media-first",
      "immersive",
    ]),
    Component: MediaFirstHero,
  },
  {
    ...meta("split-narrative", "hero", "Récit scindé", "Récit à gauche, panneau média à droite.", [
      "split",
      "media",
    ]),
    Component: SplitNarrativeHero,
  },
]);

const navigation = createRegistry<Recipe<NavProps>>("recipes:navigation", [
  {
    ...meta("minimal-header", "navigation", "En-tête minimal", "Barre fine, dense faible.", [
      "minimal",
    ]),
    Component: MinimalHeader,
  },
  {
    ...meta("editorial-folio", "navigation", "Folio éditorial", "Liens numérotés, aéré.", [
      "editorial",
      "folio",
    ]),
    Component: EditorialFolio,
  },
  {
    ...meta("immersive-overlay", "navigation", "Overlay immersif", "Menu plein écran au clic.", [
      "immersive",
      "overlay",
    ]),
    Component: ImmersiveOverlay,
  },
  {
    ...meta("traditional-premium", "navigation", "Premium classique", "Liens centrés, soulignés.", [
      "classic",
    ]),
    Component: TraditionalPremium,
  },
]);

const projects = createRegistry<Recipe<ProjectsProps>>("recipes:projects", [
  {
    ...meta("visual-grid", "projects", "Grille visuelle", "Cartes média-en-tête.", [
      "grid",
      "media",
    ]),
    Component: VisualGrid,
  },
  {
    ...meta("editorial-index", "projects", "Index éditorial", "Sommaire en lignes.", [
      "index",
      "typographic",
    ]),
    Component: EditorialIndex,
  },
  {
    ...meta("horizontal-chapters", "projects", "Chapitres horizontaux", "Défilement horizontal.", [
      "horizontal",
      "immersive",
    ]),
    Component: HorizontalChapters,
  },
  {
    ...meta("case-study-sequence", "projects", "Séquence d'études de cas", "Sections alternées.", [
      "sequence",
      "editorial",
    ]),
    Component: CaseStudySequence,
  },
]);

const storytelling = createRegistry<Recipe<StorytellingProps>>("recipes:storytelling", [
  {
    ...meta(
      "linear-sections",
      "storytelling",
      "Sections linéaires",
      "Une colonne, rythme régulier.",
      ["linear"],
    ),
    Component: LinearSections,
  },
  {
    ...meta(
      "alternating-narrative",
      "storytelling",
      "Récit alterné",
      "Média/texte gauche-droite.",
      ["alternating"],
    ),
    Component: AlternatingNarrative,
  },
  {
    ...meta("chaptered-story", "storytelling", "Récit chapitré", "Grands numéros, typographique.", [
      "chaptered",
    ]),
    Component: ChapteredStory,
  },
  {
    ...meta(
      "data-led-story",
      "storytelling",
      "Récit par les chiffres",
      "Ouvre sur un repère fort.",
      ["data"],
    ),
    Component: DataLedStory,
  },
  {
    ...meta("immersive-scroll", "storytelling", "Scroll immersif", "Sections plein écran.", [
      "immersive",
    ]),
    Component: ImmersiveScroll,
  },
]);

const conversion = createRegistry<Recipe<ConversionProps>>("recipes:conversion", [
  {
    ...meta("minimal-contact", "conversion", "Contact minimal", "Bloc centré sobre.", ["minimal"]),
    Component: MinimalContact,
  },
  {
    ...meta("premium-inquiry", "conversion", "Demande premium", "Bande brand + carte d'action.", [
      "premium",
    ]),
    Component: PremiumInquiry,
  },
  {
    ...meta("qualification-form", "conversion", "Qualification", "Étapes + CTA.", [
      "qualification",
    ]),
    Component: QualificationForm,
  },
  {
    ...meta("appointment-ready", "conversion", "Prise de rendez-vous", "Carte RDV + appel.", [
      "appointment",
    ]),
    Component: AppointmentReady,
  },
]);

const layouts = createRegistry<Recipe<LayoutProps>>("recipes:layout", [
  {
    ...meta("editorial-layout", "layout", "Éditorial", "Colonne large, aéré.", ["editorial"]),
    Component: EditorialLayout,
  },
  {
    ...meta("immersive-layout", "layout", "Immersif", "Pleine largeur.", ["immersive"]),
    Component: ImmersiveLayout,
  },
  {
    ...meta("product-layout", "layout", "Produit", "Colonne resserrée.", ["product"]),
    Component: ProductLayout,
  },
  {
    ...meta("institutional-layout", "layout", "Institutionnel", "Centré, formel.", [
      "institutional",
    ]),
    Component: InstitutionalLayout,
  },
]);

const motionProfiles = createRegistry<MotionProfile>("recipes:motion-profile", MOTION_PROFILES);
const sceneProfiles = createRegistry<SceneProfile>("recipes:scene-profile", SCENE_PROFILES);

/* -------------------------------------------------------------------------- */
/* API publique par famille                                                   */
/* -------------------------------------------------------------------------- */

export const HERO_RECIPES = heroes.list();
export const getHeroRecipe = (id: string) => heroes.get(id);
export const hasHeroRecipe = (id: string) => heroes.has(id);

export const NAVIGATION_RECIPES = navigation.list();
export const getNavigationRecipe = (id: string) => navigation.get(id);

export const PROJECTS_RECIPES = projects.list();
export const getProjectsRecipe = (id: string) => projects.get(id);

export const STORYTELLING_RECIPES = storytelling.list();
export const getStorytellingRecipe = (id: string) => storytelling.get(id);

export const CONVERSION_RECIPES = conversion.list();
export const getConversionRecipe = (id: string) => conversion.get(id);

export const LAYOUT_RECIPES = layouts.list();
export const getLayoutRecipe = (id: string) => layouts.get(id);

export const MOTION_PROFILE_LIST = motionProfiles.list();
export const getMotionProfile = (id: string) => motionProfiles.get(id);

export const SCENE_PROFILE_LIST = sceneProfiles.list();
export const getSceneProfile = (id: string) => sceneProfiles.get(id);

/** Toutes les familles (pour le Studio). */
export const RECIPE_FAMILIES = {
  hero: heroes.list(),
  navigation: navigation.list(),
  projects: projects.list(),
  storytelling: storytelling.list(),
  conversion: conversion.list(),
  layout: layouts.list(),
} as const;

/* -------------------------------------------------------------------------- */
/* Validation des sélections (déléguée au catalogue pur-données)              */
/* -------------------------------------------------------------------------- */

export { validateRecipeSelection, RECIPE_IDS } from "./catalog";
export type { RecipeSelectionIssue, RecipeSelectionFamily } from "./catalog";
