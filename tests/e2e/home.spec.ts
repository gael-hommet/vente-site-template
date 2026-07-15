import { test, expect } from "@playwright/test";

/**
 * Root page ("/") — the engine dashboard, NOT a client site.
 * Verifies it renders server-side content, is keyboard-accessible, and links to
 * the lab. Also asserts no uncaught page errors occur.
 */
test.describe("Home", () => {
  test("renders the engine dashboard with a single h1 and no page errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/");

    // Single, server-rendered h1 (critical content readable without JS/Canvas).
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Vente Site Engine");

    // Commands and modules are plain text/DOM — no WebGL required.
    await expect(page.getByText("/build-site")).toBeVisible();

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

  test("CTA links to the lab and navigates there", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Ouvrir le laboratoire/i }).click();
    await expect(page).toHaveURL(/\/lab$/);
    await expect(page.getByRole("heading", { level: 1, name: "Laboratoire" })).toBeVisible();
  });
});
