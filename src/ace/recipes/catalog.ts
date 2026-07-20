/**
 * Catalogue des recipes — PUR DONNÉES (aucun import de composant React). Source
 * unique des ids disponibles par famille : consommée par la validation ET par le
 * générateur (contexte Node, où importer des composants next/image casserait).
 * Le registre (registry.ts) pare chaque id de son composant ; un test garantit
 * l'absence de dérive entre catalogue et registre.
 */
export const RECIPE_IDS = {
  hero: ["typographic", "media-first", "split-narrative"],
  navigation: ["minimal-header", "editorial-folio", "immersive-overlay", "traditional-premium"],
  projects: ["visual-grid", "editorial-index", "horizontal-chapters", "case-study-sequence"],
  storytelling: [
    "linear-sections",
    "alternating-narrative",
    "chaptered-story",
    "data-led-story",
    "immersive-scroll",
  ],
  conversion: ["minimal-contact", "premium-inquiry", "qualification-form", "appointment-ready"],
  layout: ["editorial-layout", "immersive-layout", "product-layout", "institutional-layout"],
} as const;

export const MOTION_PROFILE_IDS = ["restrained", "editorial", "cinematic", "immersive"] as const;
export const SCENE_PROFILE_IDS = [
  "no-scene",
  "ambient-accent",
  "product-focus",
  "immersive-environment",
] as const;

export type RecipeSelectionFamily = keyof typeof RECIPE_IDS;

export interface RecipeSelectionIssue {
  family: string;
  id: string;
  available: readonly string[];
}

/**
 * Vérifie qu'une sélection `recipes.*` (contrat client) ne référence que des ids
 * existants. Renvoie les manquants (vide = OK). Chaque famille est optionnelle.
 * Pur données — utilisable côté Node (générateur).
 */
export function validateRecipeSelection(
  selection: Partial<Record<RecipeSelectionFamily, string | undefined>>,
): RecipeSelectionIssue[] {
  const issues: RecipeSelectionIssue[] = [];
  (Object.keys(RECIPE_IDS) as RecipeSelectionFamily[]).forEach((family) => {
    const id = selection[family];
    if (id && !(RECIPE_IDS[family] as readonly string[]).includes(id)) {
      issues.push({ family, id, available: RECIPE_IDS[family] });
    }
  });
  return issues;
}
