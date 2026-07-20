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
      "Design Language — presets (live)",
      /Tokens & contrastes/,
      /Matrice recipes/,
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
    // Pick a preset that is NOT currently active (a generated site may already
    // run under onyx/atelier via NEXT_PUBLIC_ACE_PRESET).
    const inactive = group.locator('button[aria-pressed="false"]').first();
    const label = (await inactive.textContent()) ?? "";
    await inactive.click();
    await expect(group.getByRole("button", { name: label })).toHaveAttribute(
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

  test("recipe matrix switches family/preset and stays reachable by keyboard", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/ace-lab");
    const section = page.locator("#ace-recipes").locator("..");
    await section.scrollIntoViewIfNeeded();

    // Default family renders the 3 hero recipes.
    await expect(section.getByText("typographic")).toBeVisible();

    // Switching family swaps the rendered recipes.
    await section.getByRole("button", { name: /Navigation \(/ }).click();
    await expect(section.getByText("minimal-header")).toBeVisible();
    await expect(section.getByText("typographic")).toHaveCount(0);

    // Switching the Design Language preset actually changes injected tokens —
    // scoped to the matrix's own wrapper, never :root (it must not fight the
    // page's global PresetPreview switcher above it).
    const select = section.getByRole("combobox", { name: "Choix du preset Design Language" });
    const scoped = page.locator("[data-recipe-matrix]");
    const before = await scoped.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--brand").trim(),
    );
    const rootBefore = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--brand").trim(),
    );
    await select.selectOption("precision-dark");
    const after = await scoped.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--brand").trim(),
    );
    const rootAfter = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--brand").trim(),
    );
    expect(after).not.toBe(before);
    // The page's global :root brand token must be untouched by the matrix.
    expect(rootAfter).toBe(rootBefore);

    // Family buttons are reachable and activatable via keyboard.
    const heroesButton = section.getByRole("button", { name: /Heroes \(/ });
    await heroesButton.focus();
    await expect(heroesButton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(section.getByText("typographic")).toBeVisible();

    expect(pageErrors, `Uncaught errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
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
