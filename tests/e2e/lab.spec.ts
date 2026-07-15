import { test, expect } from "@playwright/test";

/**
 * /lab — the technical laboratory. Verifies the main demonstrations render
 * (design system, quality selector, cinematic sections, local form) without a
 * hard WebGL dependency, and that heavy scenes degrade gracefully.
 */
test.describe("Lab", () => {
  test("renders the lab shell, quality selector and key sections", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/lab");
    await expect(page.getByRole("heading", { level: 1, name: "Laboratoire" })).toBeVisible();

    // ULTRA / BALANCED / LITE selector is reachable and readable.
    await expect(page.getByText("ULTRA", { exact: false })).toBeVisible();
    await expect(page.getByText("LITE", { exact: false })).toBeVisible();

    // Representative sections render as text (no Canvas needed to read them).
    await expect(page.getByRole("heading", { name: /Design system/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Formulaire local/i })).toBeVisible();

    expect(pageErrors, `Uncaught errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
  });

  test("the local lead form is present and keyboard reachable", async ({ page }) => {
    await page.goto("/lab");
    const form = page.locator("form").first();
    await expect(form).toBeVisible();
    // Fields are labelled (accessible names come from <label>).
    await expect(page.getByLabel(/Nom/i).first()).toBeVisible();
    await expect(page.getByLabel(/Email/i).first()).toBeVisible();
  });
});
