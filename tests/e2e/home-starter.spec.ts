import { test, expect } from "@playwright/test";

/**
 * Assertions spécifiques à la home STARTER du moteur (« Votre promesse »,
 * SplitText, bande de preuve, /engine, pages de démo /offre-/realisations).
 * EXCLU des sites générés (voir ENGINE_ONLY_TESTS) : un site client remplace
 * la home par ConfiguredHome et réécrit ces contenus. Les assertions
 * universelles vivent dans home.spec.ts.
 */
test.describe("Starter home (engine-only)", () => {
  test("renders the starter hero with SplitText revealed and flagged facts", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible({ timeout: 20_000 });
    await expect(h1).toContainText("Votre promesse");

    // Split-text words must become VISUALLY visible (regression guard).
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const words = document.querySelectorAll("h1 [aria-hidden] span span");
            const first = words.item(0) as HTMLElement | null;
            return first ? getComputedStyle(first).opacity : "missing";
          }),
        { timeout: 15_000 },
      )
      .toBe("1");

    await expect(page.getByText("[À CONFIRMER]").first()).toBeVisible();
    expect(pageErrors, `Uncaught errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
  });
});

test.describe("Starter demo routes (engine-only)", () => {
  for (const { path, h1 } of [
    { path: "/offre", h1: "Notre offre" },
    { path: "/realisations", h1: "Réalisations" },
  ]) {
    test(`${path} renders its h1 without page errors`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (e) => pageErrors.push(e.message));
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
      expect(pageErrors, pageErrors.join("\n")).toHaveLength(0);
    });
  }

  test("the portfolio empty state is a designed state, not a blank page", async ({ page }) => {
    await page.goto("/realisations");
    await expect(page.getByText("Aucune réalisation pour le moment")).toBeVisible();
    await expect(page.getByRole("link", { name: /Discuter d'un projet/i })).toBeVisible();
  });

  test("the engine dashboard lives on /engine (internal)", async ({ page }) => {
    await page.goto("/engine");
    await expect(
      page.getByRole("heading", { level: 1, name: /Aurexia Cinematic Engine/ }),
    ).toBeVisible();
  });
});
