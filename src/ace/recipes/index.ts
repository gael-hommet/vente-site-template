/**
 * ACE Recipes — compositions génériques, composables et sans identité client.
 * Sélectionnées par id depuis le contrat client (`recipes.*`).
 */
export type {
  Recipe,
  RecipeMeta,
  RecipeFamily,
  RecipeCta,
  HeroProps,
  NavProps,
  NavLink,
  ProjectsProps,
  CollectionItem,
  StorytellingProps,
  StoryChapter,
  ConversionProps,
} from "./types";

export {
  HERO_RECIPES,
  getHeroRecipe,
  hasHeroRecipe,
  RECIPE_FAMILIES,
} from "./registry";

export { TypographicHero } from "./heroes/TypographicHero";
export { MediaFirstHero } from "./heroes/MediaFirstHero";
export { SplitNarrativeHero } from "./heroes/SplitNarrativeHero";
