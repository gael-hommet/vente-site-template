import { test, expect } from "@playwright/test";

/**
 * Reduced-motion: with `prefers-reduced-motion: reduce`, the site must stay
 * fully readable and interactive (no smooth-scroll hijack, no blocked scroll),
 * and the lab reports the state as ACTIF.
 */
test.describe("Reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("home stays readable and scrollable under reduced motion", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Scroll is never blocked: the page can move.
    await page.mouse.wheel(0, 600);
    await expect(page.getByRole("link", { name: /Ouvrir le laboratoire/i })).toBeVisible();
  });

  test("lab reports reduced motion as active", async ({ page }) => {
    await page.goto("/lab");
    // Exact match: the default (substring, case-insensitive) also hits "inactif".
    await expect(page.getByText("ACTIF", { exact: true })).toBeVisible();
  });
});
