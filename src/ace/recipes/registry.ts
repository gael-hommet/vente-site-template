import { createRegistry } from "@/ace/core";
import type { HeroProps, Recipe } from "./types";
import { TypographicHero } from "./heroes/TypographicHero";
import { MediaFirstHero } from "./heroes/MediaFirstHero";
import { SplitNarrativeHero } from "./heroes/SplitNarrativeHero";

/**
 * Registres de recipes par famille (fail-fast sur doublon d'id). Le client
 * sélectionne une recette par son id via `client.config.ts:recipes.*` ; le
 * générateur/Studio la résout ici. Chaque famille grandit indépendamment.
 */

const heroRecipes: readonly Recipe<HeroProps>[] = [
  {
    id: "typographic",
    family: "hero",
    title: "Typographique",
    description: "Le titre est l'image. Sans média, grands blancs, éditorial.",
    tags: ["typography-first", "editorial", "no-media"],
    Component: TypographicHero,
  },
  {
    id: "media-first",
    family: "hero",
    title: "Média plein cadre",
    description: "Média plein écran + voile, titre en surimpression. Immersif.",
    tags: ["media-first", "immersive", "full-bleed"],
    Component: MediaFirstHero,
  },
  {
    id: "split-narrative",
    family: "hero",
    title: "Récit scindé",
    description: "Récit à gauche, panneau média à droite. Équilibré.",
    tags: ["split", "editorial", "media"],
    Component: SplitNarrativeHero,
  },
];

const heroes = createRegistry<Recipe<HeroProps>>("recipes:hero", heroRecipes);

export const HERO_RECIPES = heroes.list();
export const getHeroRecipe = (id: string): Recipe<HeroProps> => heroes.get(id);
export const hasHeroRecipe = (id: string): boolean => heroes.has(id);

/** Toutes les familles de recipes disponibles (pour le Studio). */
export const RECIPE_FAMILIES = {
  hero: heroes.list(),
} as const;
