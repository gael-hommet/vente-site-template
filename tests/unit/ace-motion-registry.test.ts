import { describe, expect, it } from "vitest";
import { MOTION_RECIPES, getMotionRecipe } from "@/ace/motion/registry";

describe("ace-motion registry", () => {
  it("has recipes and stable dotted ids", () => {
    expect(MOTION_RECIPES.length).toBeGreaterThanOrEqual(8);
    for (const recipe of MOTION_RECIPES) {
      expect(recipe.id).toMatch(/^[a-z]+(\.[a-z-]+)+$/);
      expect(recipe.title.length).toBeGreaterThan(2);
      expect(recipe.description.length).toBeGreaterThan(10);
    }
  });

  it("enforces the separation law: Motion/CSS = micro, GSAP = cinematic", () => {
    for (const recipe of MOTION_RECIPES) {
      if (recipe.engine === "gsap") {
        expect(recipe.intent).toBe("cinematic");
      } else {
        expect(recipe.intent).toBe("micro");
      }
    }
  });

  it("every cinematic recipe is declared skippable (anti scroll-jacking)", () => {
    const cinematic = MOTION_RECIPES.filter((r) => r.intent === "cinematic");
    expect(cinematic.length).toBeGreaterThan(0);
    for (const recipe of cinematic) {
      expect(recipe.skippable).toBe(true);
    }
  });

  it("every recipe declares a reduced-motion policy", () => {
    for (const recipe of MOTION_RECIPES) {
      expect(["final-state", "disabled", "static-fallback"]).toContain(recipe.reducedMotion);
    }
  });

  it("loaders resolve to real components (spot-check micro + cinematic)", async () => {
    const reveal = await getMotionRecipe("reveal.soft").load();
    const pinned = await getMotionRecipe("pin.sequence").load();
    expect(typeof reveal).toBe("function");
    expect(typeof pinned).toBe("function");
  });
});
