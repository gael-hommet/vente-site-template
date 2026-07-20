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
  LayoutProps,
  MotionProfile,
  SceneProfile,
} from "./types";

export {
  HERO_RECIPES,
  getHeroRecipe,
  hasHeroRecipe,
  NAVIGATION_RECIPES,
  getNavigationRecipe,
  hasNavigationRecipe,
  PROJECTS_RECIPES,
  getProjectsRecipe,
  hasProjectsRecipe,
  STORYTELLING_RECIPES,
  getStorytellingRecipe,
  hasStorytellingRecipe,
  CONVERSION_RECIPES,
  getConversionRecipe,
  hasConversionRecipe,
  LAYOUT_RECIPES,
  getLayoutRecipe,
  hasLayoutRecipe,
  MOTION_PROFILE_LIST,
  getMotionProfile,
  SCENE_PROFILE_LIST,
  getSceneProfile,
  RECIPE_FAMILIES,
  validateRecipeSelection,
  type RecipeSelectionIssue,
} from "./registry";

export { MOTION_PROFILES } from "./motion/profiles";
export { SCENE_PROFILES } from "./scenes/profiles";
