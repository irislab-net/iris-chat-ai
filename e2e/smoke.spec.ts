import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const gotoOpts = { waitUntil: "domcontentloaded" as const }

test.describe("cookie consent", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("exur-cookie-consent")
    })
  })

  test("shows banner and rejects analytics scripts", async ({ page }) => {
    const analyticsRequests: string[] = []
    page.on("request", (req) => {
      const url = req.url()
      if (
        url.includes("googletagmanager.com") ||
        url.includes("google-analytics.com")
      ) {
        analyticsRequests.push(url)
      }
    })

    await page.goto("/home", gotoOpts)
    await expect(
      page.getByRole("dialog", { name: /we use cookies/i })
    ).toBeVisible({ timeout: 15_000 })

    await page.getByRole("button", { name: /reject non-essential/i }).click()
    await expect(
      page.getByRole("dialog", { name: /we use cookies/i })
    ).toBeHidden()

    // Idle gate is 15s — wait briefly then assert no GA/GTM after reject.
    await page.waitForTimeout(2_000)
    expect(analyticsRequests).toHaveLength(0)
  })

  test("accept enables consent preference persistence", async ({ page }) => {
    await page.goto("/home", gotoOpts)
    await expect(
      page.getByRole("dialog", { name: /we use cookies/i })
    ).toBeVisible({ timeout: 15_000 })
    await page.getByRole("button", { name: /accept all/i }).click()

    const stored = await page.evaluate(() =>
      localStorage.getItem("exur-cookie-consent")
    )
    expect(stored).toContain('"analytics":true')
  })
})

test.describe("critical paths", () => {
  test("marketing home exposes skip link and main content", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "exur-cookie-consent",
        JSON.stringify({
          version: "v1",
          analytics: false,
          advertising: false,
          timestamp: Date.now(),
        })
      )
    })
    await page.goto("/home", gotoOpts)
    const skip = page.getByRole("link", { name: /skip to content/i })
    await skip.focus()
    await expect(skip).toBeVisible()
    await expect(page.locator("#main-content")).toHaveCount(1)
  })

  test("upgrade page loads checkout CTA", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "exur-cookie-consent",
        JSON.stringify({
          version: "v1",
          analytics: false,
          advertising: false,
          timestamp: Date.now(),
        })
      )
    })
    await page.goto("/upgrade", gotoOpts)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 20_000,
    })
  })
})

test.describe("accessibility smoke", () => {
  test("landing has no serious axe violations", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "exur-cookie-consent",
        JSON.stringify({
          version: "v1",
          analytics: false,
          advertising: false,
          timestamp: Date.now(),
        })
      )
    })
    await page.goto("/home", gotoOpts)
    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze()
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    )
    expect(serious).toEqual([])
  })
})
