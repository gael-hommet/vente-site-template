import { test, expect } from "@playwright/test";

/**
 * /ace-lab — the internal engine-validation page. Everything is read from the
 * live registries and rendered server-side: no client JS, no WebGL required.
 */
test.describe("ACE Lab", () => {
  test("renders the engine identity and every registry section", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));

    await page.goto("/ace-lab");
    await expect(page.getByRole("heading", { level: 1, name: "ACE Lab" })).toBeVisible();
    await expect(page.getByText("Aurexia Cinematic Engine")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Modules du moteur" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Design Language/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Motion Library/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Scene Library/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Budgets de performance/ })).toBeVisible();

    expect(pageErrors, `Uncaught errors:\n${pageErrors.join("\n")}`).toHaveLength(0);
  });

  test("exposes the contracts: presets, separation law, mandatory fallbacks, tiers", async ({
    page,
  }) => {
    await page.goto("/ace-lab");

    // The three shipped design presets.
    await expect(page.getByText("(neutral)")).toBeVisible();
    await expect(page.getByText("(onyx)")).toBeVisible();
    await expect(page.getByText("(atelier)")).toBeVisible();

    // Motion Library rows exist for both engines.
    await expect(page.getByRole("cell", { name: "reveal.soft" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "pin.sequence" })).toBeVisible();

    // Scene Library shows fallback alts (the mandatory-fallback contract).
    await expect(page.getByRole("cell", { name: "demo.logo-reveal" })).toBeVisible();
    await expect(page.getByRole("cell", { name: /aperçu statique/ }).first()).toBeVisible();

    // Quality tiers table (scoped: "BALANCED" also appears as scene minTier).
    const budgets = page.getByRole("region", { name: /Budgets de performance/ });
    for (const tier of ["ULTRA", "BALANCED", "LITE"]) {
      await expect(budgets.getByRole("cell", { name: tier, exact: true })).toBeVisible();
    }
  });
});
