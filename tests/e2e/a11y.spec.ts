import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility audit (axe-core) on the two shipped pages.
 * Serious/critical WCAG issues fail the build. `pnpm test:a11y` runs this file.
 */
async function audit(page: import("@playwright/test").Page, url: string) {
  await page.goto(url);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  // Let entrance animations (Reveal/SplitText, ~1s with stagger) finish:
  // axe sampling mid-transition blends opacities and reports false contrast.
  await page.waitForTimeout(1500);
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
}

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

  test("lab has no serious or critical violations", async ({ page }) => {
    // /lab mounts WebGL canvases; axe's color sampling needs extra time there.
    test.setTimeout(120_000);
    const results = await audit(page, "/lab");
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

  test("ace-lab (Studio) has no serious or critical violations", async ({ page }) => {
    test.setTimeout(120_000);
    const results = await audit(page, "/ace-lab");
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
