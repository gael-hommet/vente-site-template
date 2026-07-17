import { test, expect } from "@playwright/test";

/**
 * Local lead form on /lab: validation errors on empty submit, and a successful
 * submission via the local simulated endpoint (no third-party service in dev).
 */
test.describe("Local lead form", () => {
  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/lab");
    const form = page.locator("form").first();
    await form.getByRole("button", { name: /Envoyer ma demande/i }).click();
    // Field-level errors are rendered and associated (aria-invalid on inputs).
    await expect(page.getByText(/Nom trop court/i)).toBeVisible();
    await expect(page.getByText(/Email invalide/i)).toBeVisible();
    await expect(page.getByText(/Consentement requis/i)).toBeVisible();
  });

  test("submits successfully through the local endpoint", async ({ page }) => {
    // Reaching the form crosses the map section; MapLibre on software GL
    // (headless) can block the main thread for seconds while it boots.
    test.setTimeout(120_000);
    await page.goto("/lab");
    const form = page.locator("form").first();
    // Required labels render as "Nom *" — anchor on the label start.
    await form.getByLabel(/^Nom\b/).fill("Jean Dupont");
    await form.getByLabel(/^Email\b/).fill("jean.dupont@example.com");
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: /Envoyer ma demande/i }).click();
    await expect(page.getByText(/votre demande est bien reçue/i)).toBeVisible();
  });
});
