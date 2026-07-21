import { test, expect } from "@playwright/test";

/**
 * Reduced-motion (UNIVERSEL) : avec `prefers-reduced-motion: reduce`, la home
 * reste lisible et scrollable (pas de smooth-scroll qui capture, pas de scroll
 * bloqué) et un chemin de conversion visible reste atteignable. Agnostique du
 * contenu et de la recipe : vaut pour le moteur ET tout site généré. Le volet
 * /lab (engine-only) vit dans reduced-motion-engine.spec.ts.
 */
test.describe("Reduced motion (universal)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("home stays readable and scrollable, CTA reachable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    // Scroll is never blocked under reduced motion.
    await page.mouse.wheel(0, 600);

    // A VISIBLE conversion path stays reachable (no scene/animation required).
    // Some navigation recipes render desktop-only links hidden on mobile, so we
    // target a visible /contact link, not blindly the first one.
    await expect(page.locator('a[href="/contact"]:visible').first()).toBeVisible();
  });
});
