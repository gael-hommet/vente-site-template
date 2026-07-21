import { test, expect } from "@playwright/test";

/**
 * Reduced-motion pour les routes INTERNES du moteur (/lab). EXCLU des sites
 * générés (voir ENGINE_ONLY_TESTS) : /lab n'y existe pas. Le volet universel
 * (/ sous reduced-motion) vit dans reduced-motion.spec.ts.
 */
test.describe("Reduced motion (engine-only)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("lab reports reduced motion as active", async ({ page }) => {
    await page.goto("/lab");
    // Exact match: the default (substring, case-insensitive) also hits "inactif".
    await expect(page.getByText("ACTIF", { exact: true })).toBeVisible();
  });
});
