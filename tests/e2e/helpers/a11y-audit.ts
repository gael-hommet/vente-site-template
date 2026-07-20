import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Runs an axe-core scan on `url` after its h1 is visible and entrance
 * animations settle (Reveal/SplitText, ~1s with stagger — axe sampling
 * mid-transition blends opacities and reports false contrast).
 */
export async function audit(page: Page, url: string) {
  await page.goto(url);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.waitForTimeout(1500);
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
}
