import type { ComponentType } from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  RECIPE_FAMILIES,
  validateRecipeSelection,
  MOTION_PROFILE_LIST,
  SCENE_PROFILE_LIST,
  type HeroProps,
  type NavProps,
  type ProjectsProps,
  type StorytellingProps,
  type ConversionProps,
  type LayoutProps,
} from "@/ace/recipes";
import { RECIPE_IDS } from "@/ace/recipes/catalog";

const heroProps: HeroProps = {
  title: "Titre",
  primaryCta: { label: "OK", href: "/x" },
  media: null,
};
const navProps: NavProps = {
  brand: "Marque",
  links: [
    { label: "Un", href: "/un" },
    { label: "Deux", href: "/deux" },
  ],
  cta: { label: "OK", href: "/x" },
};
const projProps: ProjectsProps = {
  items: [
    { title: "A", href: "/a", meta: ["06", "2024"], media: null },
    { title: "B", href: "/b", meta: ["83", "2023"], media: null },
  ],
};
const storyProps: StorytellingProps = {
  chapters: [
    { eyebrow: "01", title: "Ch. 1", body: "Corps un." },
    { eyebrow: "02", title: "Ch. 2", body: "Corps deux." },
  ],
};
const convProps: ConversionProps = {
  title: "Contact",
  primaryCta: { label: "OK", href: "/x" },
  phone: "01",
};
const layoutProps: LayoutProps = {
  header: <header>H</header>,
  children: <section>C</section>,
  footer: <footer>F</footer>,
};

function propsFor(family: string): unknown {
  switch (family) {
    case "hero":
      return heroProps;
    case "navigation":
      return navProps;
    case "projects":
      return projProps;
    case "storytelling":
      return storyProps;
    case "conversion":
      return convProps;
    case "layout":
      return layoutProps;
    default:
      return {};
  }
}

describe("ACE recipes — toutes les familles", () => {
  it("catalogue et registre concordent (aucune dérive)", () => {
    for (const [family, recipes] of Object.entries(RECIPE_FAMILIES)) {
      const registryIds = recipes.map((r) => r.id).sort();
      const catalogIds = [...(RECIPE_IDS as Record<string, readonly string[]>)[family]].sort();
      expect(registryIds, `famille ${family}`).toEqual(catalogIds);
    }
  });

  it("compte minimal par famille (mandat)", () => {
    expect(RECIPE_FAMILIES.hero.length).toBeGreaterThanOrEqual(3);
    expect(RECIPE_FAMILIES.navigation.length).toBeGreaterThanOrEqual(4);
    expect(RECIPE_FAMILIES.projects.length).toBeGreaterThanOrEqual(4);
    expect(RECIPE_FAMILIES.storytelling.length).toBeGreaterThanOrEqual(5);
    expect(RECIPE_FAMILIES.conversion.length).toBeGreaterThanOrEqual(4);
    expect(RECIPE_FAMILIES.layout.length).toBeGreaterThanOrEqual(4);
    expect(MOTION_PROFILE_LIST.length).toBeGreaterThanOrEqual(4);
    expect(SCENE_PROFILE_LIST.length).toBeGreaterThanOrEqual(4);
  });

  it("chaque recette de chaque famille se rend sans crash et produit du DOM", () => {
    for (const [family, recipes] of Object.entries(RECIPE_FAMILIES)) {
      for (const r of recipes) {
        const Comp = r.Component as unknown as ComponentType<Record<string, unknown>>;
        const { container, unmount } = render(<Comp {...(propsFor(family) as object)} />);
        expect(container.textContent, `${family}:${r.id}`).toBeTruthy();
        unmount();
      }
    }
  });

  it("validateRecipeSelection accepte une sélection valide et refuse un id inconnu", () => {
    expect(
      validateRecipeSelection({
        hero: "typographic",
        navigation: "immersive-overlay",
        projects: "visual-grid",
      }),
    ).toEqual([]);
    const bad = validateRecipeSelection({ hero: "nope", conversion: "premium-inquiry" });
    expect(bad).toHaveLength(1);
    expect(bad[0].family).toBe("hero");
    expect(bad[0].available).toContain("typographic");
  });
});
