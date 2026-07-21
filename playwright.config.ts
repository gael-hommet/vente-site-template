import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the Vente Site Engine.
 *
 * - Boots the production server (`pnpm build` must run first, or use dev via
 *   PW_DEV=1) and runs specs against it.
 * - Projects cover desktop Chromium, mobile Chromium, Firefox and WebKit.
 *   WebKit/Firefox browsers are only present if `pnpm exec playwright install`
 *   was run; missing browsers simply skip in constrained environments.
 * - Reduced-motion and WebGL-fallback scenarios are exercised via dedicated
 *   specs and project overrides.
 */
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const useDev = process.env.PW_DEV === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  // 15s: first hit on a cold `next start` streams route chunks lazily; on the
  // 2-core host this regularly exceeds 5s without being a product defect.
  expect: { timeout: 15_000 },
  // Serial on the 2-core host: heavy /lab specs (MapLibre on software GL)
  // starve a second worker and make unrelated specs time out.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // forms specs exercise a form flow; the engine-only variant hits /lab's
    // MapLibre on software GL — brutal enough to degrade the shared browser
    // process for tests that follow. Both run in their own project so every
    // other spec gets a fresh browser. Match both forms.spec and
    // forms-engine.spec.
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /forms(-engine)?\.spec/,
    },
    {
      name: "chromium-desktop-forms",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /forms(-engine)?\.spec/,
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
      testIgnore: /forms(-engine)?\.spec/,
    },
    {
      name: "chromium-mobile-forms",
      use: { ...devices["Pixel 7"] },
      testMatch: /forms(-engine)?\.spec/,
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: useDev ? "pnpm dev" : "pnpm start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
