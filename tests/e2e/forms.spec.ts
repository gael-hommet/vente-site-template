import { test, expect } from "@playwright/test";

/**
 * Formulaire de contact (UNIVERSEL) sur /contact : erreurs de validation au
 * submit vide, puis soumission réussie via l'endpoint local simulé (aucun
 * service tiers en dev). La page /contact existe dans tout site généré, donc
 * ce test vaut partout. Le formulaire riche de /lab (LeadForm) est testé en
 * engine-only (forms-engine.spec.ts).
 */
test.describe("Contact form (universal)", () => {
  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/contact");
    const form = page.locator("form").first();
    await form.getByRole("button", { name: /Envoyer/i }).click();
    // Field-level errors render (shared zod schema, associated to fields).
    await expect(page.getByText(/Nom trop court/i)).toBeVisible();
    await expect(page.getByText(/Email invalide/i)).toBeVisible();
    await expect(page.getByText(/Consentement requis/i)).toBeVisible();
  });

  test("submits successfully through the local endpoint", async ({ page }) => {
    await page.goto("/contact");
    const form = page.locator("form").first();
    await form.getByLabel(/^Nom\b/).fill("Jean Dupont");
    await form.getByLabel(/^Email\b/).fill("jean.dupont@example.com");
    await form
      .getByLabel(/^Message\b/)
      .fill("Bonjour, ceci est un message de test suffisamment long.");
    await form.getByRole("checkbox").check();
    // Anti-spam : le endpoint rejette (422 "too_fast") toute soumission < 1,2 s
    // après l'ouverture du formulaire. Respecter ce contrat (un vrai humain met
    // plus d'une seconde). Sur mobile émulé, remplir+cliquer est plus rapide.
    await page.waitForTimeout(1400);
    await form.getByRole("button", { name: /Envoyer/i }).click();
    await expect(page.getByText(/Message envoyé/i)).toBeVisible();
  });
});
