import { test, expect } from "@playwright/test";

/**
 * Root page ("/") — the ACE starter home. Verifies server-rendered critical
 * content, keyboard access, conversion paths, and zero uncaught page errors.
 */
test.describe("Starter home", () => {
  test("renders the starter with a single h1 and no page errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/");

    // First navigation may hit a cold `next start` (route chunks stream in
    // lazily) — allow for that without weakening the assertion itself.
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible({ timeout: 20_000 });
    await expect(h1).toContainText("Votre promesse");

    // The split-text words must become VISUALLY visible (regression guard:
    // a clipped word observed by its own IntersectionObserver never fires).
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

    // Unverified facts are visibly flagged — the starter never fakes claims.
    await expect(page.getByText("[À CONFIRMER]").first()).toBeVisible();

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

  test("primary CTA navigates to the contact page and its form", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /Demander un devis/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole("heading", { level: 1, name: "Contact" })).toBeVisible();
    await expect(page.locator("form").first()).toBeVisible();
  });
});

test.describe("Starter routes", () => {
  for (const { path, h1 } of [
    { path: "/offre", h1: "Notre offre" },
    { path: "/realisations", h1: "Réalisations" },
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

  test("the portfolio empty state is a designed state, not a blank page", async ({ page }) => {
    await page.goto("/realisations");
    await expect(page.getByText("Aucune réalisation pour le moment")).toBeVisible();
    await expect(page.getByRole("link", { name: /Discuter d'un projet/i })).toBeVisible();
  });

  test("unknown routes get the designed 404", async ({ page }) => {
    await page.goto("/cette-page-n-existe-pas");
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Retour à l'accueil/i })).toBeVisible();
  });

  test("the engine dashboard lives on /engine (internal)", async ({ page }) => {
    await page.goto("/engine");
    await expect(
      page.getByRole("heading", { level: 1, name: /Aurexia Cinematic Engine/ }),
    ).toBeVisible();
  });
});
