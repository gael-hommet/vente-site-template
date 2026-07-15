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
  expect: { timeout: 5_000 },
  fullyParallel: false, // 2-core host: keep workers modest.
  workers: process.env.CI ? 1 : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
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
