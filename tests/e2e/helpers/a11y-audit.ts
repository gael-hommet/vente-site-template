import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Runs an axe-core scan on `url` after its h1 is visible and entrance
 * animations settle (Reveal/SplitText, ~1s with stagger — axe sampling
 * mid-transition blends opacities and reports false contrast).
 */
export async function audit(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  // Generous h1 wait: on the shared 2-core headless host, a cold route hit
  // after heavy specs (MapLibre on software GL) can stream chunks slowly. This
  // is host latency, not a product defect — so we wait rather than fail flaky.
  await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 45_000 });
  await page.waitForTimeout(1500);
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
}
