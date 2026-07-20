import { test, expect } from "@playwright/test";
import { audit } from "./helpers/a11y-audit";

/**
 * Automated accessibility audit (axe-core) on the shipped client pages.
 * Serious/critical WCAG issues fail the build. `pnpm test:a11y` runs this file.
 */
test.describe("Accessibility (axe)", () => {
  test("home has no serious or critical violations", async ({ page }) => {
    const results = await audit(page, "/");
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(
      serious,
      JSON.stringify(
        serious.map((v) => v.id),
        null,
        2,
      ),
    ).toEqual([]);
  });
});
