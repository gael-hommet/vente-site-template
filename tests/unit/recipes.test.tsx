import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HERO_RECIPES, getHeroRecipe, hasHeroRecipe, type HeroProps } from "@/ace/recipes";
import { createRegistry } from "@/ace/core";

const base: HeroProps = {
  eyebrow: "STUDIO",
  title: "Un titre générique",
  subtitle: "Un sous-titre.",
  primaryCta: { label: "Nous contacter", href: "/contact" },
  media: null,
};

describe("ACE recipes — registre heroes", () => {
  it("enregistre les 3 recettes hero distinctes", () => {
    expect(HERO_RECIPES.map((r) => r.id).sort()).toEqual([
      "media-first",
      "split-narrative",
      "typographic",
    ]);
    for (const r of HERO_RECIPES) {
      expect(r.family).toBe("hero");
      expect(r.title.length).toBeGreaterThan(1);
      expect(typeof r.Component).toBe("function");
    }
  });

  it("get/has résolvent par id, get échoue sur inconnu", () => {
    expect(hasHeroRecipe("typographic")).toBe(true);
    expect(hasHeroRecipe("nope")).toBe(false);
    expect(getHeroRecipe("media-first").id).toBe("media-first");
    expect(() => getHeroRecipe("nope")).toThrow();
  });

  it("le registre fail-fast sur id dupliqué", () => {
    expect(() =>
      createRegistry("dup", [
        { id: "x", family: "hero" },
        { id: "x", family: "hero" },
      ]),
    ).toThrow();
  });

  it("chaque recette rend un h1 avec le titre et le CTA primaire", () => {
    for (const r of HERO_RECIPES) {
      const { unmount } = render(<r.Component {...base} />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent("Un titre générique");
      expect(screen.getByRole("link", { name: "Nous contacter" })).toHaveAttribute(
        "href",
        "/contact",
      );
      unmount();
    }
  });

  it("les recettes produisent des compositions différentes (DOM distinct)", () => {
    const html = HERO_RECIPES.map((r) => {
      const { container, unmount } = render(<r.Component {...base} />);
      const h = container.innerHTML;
      unmount();
      return h;
    });
    // 3 rendus, tous différents deux à deux.
    expect(new Set(html).size).toBe(3);
  });
});
