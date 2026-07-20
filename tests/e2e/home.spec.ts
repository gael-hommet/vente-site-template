import { test, expect } from "@playwright/test";

/**
 * Root page ("/") — universal assertions valid for ANY generated site (the
 * config-driven home) AND the engine's own starter home. Content-agnostic on
 * purpose: no hardcoded copy, so this ships to every client site and stays
 * green whatever the chosen recipes/content.
 */
test.describe("Home (universal)", () => {
  test("renders a single h1 server-side with no page errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1.first()).toBeVisible({ timeout: 20_000 });
    // Exactly one h1 (accessibility: one document title).
    await expect(h1).toHaveCount(1);

    expect(pageErrors, `Uncaught errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
  });

  test("skip link is the first focusable element and targets #main", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const active = page.locator(":focus");
    await expect(active).toHaveText(/Aller au contenu principal/i);
    await expect(active).toHaveAttribute("href", "#main");
    await expect(page.locator("main#main")).toBeAttached();
  });

  test("a conversion path reaches the contact page and its form", async ({ page }) => {
    await page.goto("/");
    const contactLink = page.locator('a[href="/contact"]').first();
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole("heading", { level: 1, name: "Contact" })).toBeVisible();
    await expect(page.locator("form").first()).toBeVisible();
  });

  test("unknown routes get the designed 404", async ({ page }) => {
    await page.goto("/cette-page-n-existe-pas");
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Retour à l'accueil/i })).toBeVisible();
  });
});

test.describe("Standard routes (universal)", () => {
  for (const { path, h1 } of [
    { path: "/a-propos", h1: "Une histoire à raconter" },
    { path: "/contact", h1: "Contact" },
    { path: "/mentions-legales", h1: "Mentions légales" },
  ]) {
    test(`${path} renders its h1 without page errors`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (e) => pageErrors.push(e.message));
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
      expect(pageErrors, pageErrors.join("\n")).toHaveLength(0);
    });
  }
});
