import { test, expect } from "@playwright/test";

/**
 * /ace-lab — the engine's internal laboratory. Server part renders the live
 * registries; client part hosts the interactive demos (preset switcher,
 * contrast meter, motion playground, scene studio, conversion showcase).
 */
test.describe("ACE Lab", () => {
  test("renders the engine identity and every section", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/ace-lab");
    await expect(page.getByRole("heading", { level: 1, name: "ACE Lab" })).toBeVisible();
    await expect(page.getByText("Aurexia Cinematic Engine")).toBeVisible();

    for (const name of [
      "Modules du moteur",
      /Design Language/,
      /Tokens & contrastes/,
      /Motion Library/,
      /Scene Library/,
      /Médias adaptatifs/,
      /Conversion & états UI/,
      /Choix natifs/,
      /Budgets de performance/,
    ]) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }

    expect(pageErrors, `Uncaught errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
  });

  test("preset switcher retints tokens live", async ({ page }) => {
    await page.goto("/ace-lab");
    const group = page.getByRole("group", { name: "Choix du preset" });
    const brandBefore = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--brand").trim(),
    );
    await group.getByRole("button", { name: "Onyx" }).click();
    await expect(group.getByRole("button", { name: "Onyx" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const brandAfter = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--brand").trim(),
    );
    expect(brandAfter).not.toBe(brandBefore);
  });

  test("contrast meter reports AA-passing token pairs", async ({ page }) => {
    await page.goto("/ace-lab");
    // Every measured pair used for text must pass (the engine's own promise).
    await expect(page.getByText("✗ insuffisant")).toHaveCount(0);
    await expect(page.getByText("✓ conforme").first()).toBeVisible();
  });

  test("scene studio can force the fallback and reports the scene contract", async ({ page }) => {
    await page.goto("/ace-lab");
    await page.getByRole("button", { name: "Forcer le fallback" }).click();
    await expect(page.getByRole("button", { name: "Réactiver WebGL" })).toBeVisible();
    await expect(page.getByText("Contrat de la scène")).toBeVisible();
    await expect(page.getByText(/Budget appliqué — tier/)).toBeVisible();
  });

  test("motion playground exposes the orchestration status", async ({ page }) => {
    await page.goto("/ace-lab");
    await expect(page.getByText("Lenis (smooth scroll)")).toBeVisible();
    await expect(page.getByText("ScrollTriggers montés")).toBeVisible();
    await expect(page.getByRole("button", { name: "Rejouer" })).toBeVisible();
  });

  test("conversion showcase mounts the lead form and accessible overlays", async ({ page }) => {
    await page.goto("/ace-lab");
    const section = page.locator("#ace-conversion");
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator("form")).toBeVisible();
    await section.getByRole("button", { name: "Ouvrir un dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
