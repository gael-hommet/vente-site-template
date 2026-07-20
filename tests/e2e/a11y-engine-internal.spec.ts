import { test, expect } from "@playwright/test";
import { audit } from "./helpers/a11y-audit";

/**
 * Accessibility audit (axe-core) for the engine-internal routes (/lab,
 * /ace-lab). This file is EXCLUDED from generated client sites (see
 * ENGINE_ONLY_TESTS in scripts/ace/new-site.mjs) — those routes don't exist
 * there. The universal `/` audit lives in a11y.spec.ts and ships to clients.
 */
test.describe("Accessibility (axe) — engine-internal routes", () => {
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
