import { test, expect } from "@playwright/test";

/**
 * Formulaire de lead riche de /lab (LeadForm). EXCLU des sites générés (voir
 * ENGINE_ONLY_TESTS) : /lab n'y existe pas. Le formulaire universel de /contact
 * est testé dans forms.spec.ts.
 *
 * /lab est délibérément lourd (scènes, MapLibre sur GL logiciel en headless) :
 * l'hydratation + l'interaction demandent des budgets généreux sur un hôte
 * 2 cœurs.
 */
test.describe("Lab lead form (engine-only)", () => {
  test.describe.configure({ timeout: 120_000 });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/lab");
    const form = page.locator("form").first();
    await form.getByRole("button", { name: /Envoyer ma demande/i }).click();
    await expect(page.getByText(/Nom trop court/i)).toBeVisible();
    await expect(page.getByText(/Email invalide/i)).toBeVisible();
    await expect(page.getByText(/Consentement requis/i)).toBeVisible();
  });

  test("submits successfully through the local endpoint", async ({ page }) => {
    await page.goto("/lab");
    const form = page.locator("form").first();
    await form.getByLabel(/^Nom\b/).fill("Jean Dupont");
    await form.getByLabel(/^Email\b/).fill("jean.dupont@example.com");
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: /Envoyer ma demande/i }).click();
    await expect(page.getByText(/votre demande est bien reçue/i)).toBeVisible();
  });
});
