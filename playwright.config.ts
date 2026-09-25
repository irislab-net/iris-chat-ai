import { defineConfig, devices } from "@playwright/test"

/**
 * Dev proxy redirects loopback → https://local.exur.ai:3000 (auth cookies).
 * Point Playwright at that origin; CI must map it in /etc/hosts.
 */
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "https://local.exur.ai:3000"

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    ignoreHTTPSErrors: true,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command:
          "node scripts/generate-dev-certs.mjs && pnpm exec next dev --experimental-https --experimental-https-key ./certificates/localhost-key.pem --experimental-https-cert ./certificates/localhost.pem --hostname 0.0.0.0 --port 3000",
        url: `${baseURL}/home`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        ignoreHTTPSErrors: true,
      },
})
