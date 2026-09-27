import { chromium, devices } from "@playwright/test"
import { mkdir, writeFile, readdir } from "node:fs/promises"
import path from "node:path"

const BASE = process.env.SHOT_BASE ?? "https://127.0.0.1:3000"
const OUT = path.resolve("tmp/iphone13-screenshots")
const d = devices["iPhone 13"]

async function shot(page, name) {
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    type: "png",
    fullPage: false,
  })
  console.log("✓", name)
}

async function go(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 })
  await page.waitForTimeout(1500)
  const accept = page.getByRole("button", { name: /Accept all/i })
  if (await accept.isVisible().catch(() => false)) {
    await accept.click()
    await page.waitForTimeout(400)
  }
  await page
    .addStyleTag({
      content: `[aria-label="Open Next.js Dev Tools"], nextjs-portal { display:none !important }`,
    })
    .catch(() => {})
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    ...d,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
  })
  await context.addInitScript(() => {
    const raw = JSON.stringify({
      version: "v1",
      analytics: true,
      advertising: false,
      timestamp: Date.now(),
    })
    try {
      localStorage.setItem("exur-cookie-consent", raw)
    } catch {}
    document.cookie = `exur-cookie-consent=${encodeURIComponent(raw)}; Path=/; Max-Age=31536000; SameSite=Lax`
  })

  const page = await context.newPage()

  try {
    // Chat
    await go(page, `${BASE}/`)
    await page.getByText(/What can I help with/i).first().waitFor({ timeout: 60_000 })
    await shot(page, "01-chat-starters")

    await page.getByRole("button", { name: /Response depth|Fast/i }).first().click()
    await page.waitForTimeout(400)
    await shot(page, "02-response-depth")
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    await page.getByRole("button", { name: /^Sign in$|Free/i }).first().click()
    await page.waitForTimeout(450)
    await shot(page, "03-account-menu")
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    await page.getByRole("button", { name: /Chat history/i }).first().click()
    await page.waitForTimeout(600)
    await shot(page, "04-sidebar")

    await page.getByRole("button", { name: /^News$/i }).first().click()
    await page.waitForTimeout(1800)
    await shot(page, "05-news")
    await page.evaluate(() => {
      for (const el of document.querySelectorAll(
        "[data-slot='scroll-area-viewport'], .overflow-y-auto"
      ))
        el.scrollTop += 500
    })
    await page.waitForTimeout(350)
    await shot(page, "06-news-scroll")

    const closeNews = page.getByRole("button", { name: /Close news/i })
    if (await closeNews.count()) await closeNews.first().click()
    await page.waitForTimeout(300)

    // reopen sidebar → settings
    const hist = page.getByRole("button", { name: /Chat history/i })
    if (await hist.count()) {
      await hist.first().click()
      await page.waitForTimeout(500)
    }
    const settings = page.getByRole("button", { name: /Settings/i })
    if (await settings.count()) {
      await settings.first().click()
      await page.waitForTimeout(450)
      await shot(page, "07-settings")
      await page.keyboard.press("Escape")
    }

    // Landing
    await go(page, `${BASE}/home`)
    await page.waitForTimeout(800)
    await shot(page, "08-landing")
    await page.evaluate(() => window.scrollBy(0, 800))
    await page.waitForTimeout(400)
    await shot(page, "09-landing-mid")
    const menu = page.getByRole("button", { name: /Open menu/i })
    if (await menu.count()) {
      await menu.first().click()
      await page.waitForTimeout(400)
      await shot(page, "10-landing-menu")
      await page.keyboard.press("Escape")
    }

    for (const [name, route] of [
      ["11-what-is-exur", "/what-is-exur"],
      ["12-about", "/about"],
      ["13-signals", "/ai-trading-signals"],
      ["14-upgrade", "/upgrade"],
      ["15-privacy", "/privacy"],
      ["16-terms", "/terms"],
    ]) {
      await go(page, `${BASE}${route}`)
      await page.waitForTimeout(700)
      await shot(page, name)
    }

    // Starter chat
    await go(page, `${BASE}/`)
    await page.getByText(/What can I help with|STARTERS/i).first().waitFor({ timeout: 60_000 })
    const starter = page.getByRole("button", { name: /Market pulse/i }).first()
    await starter.click()
    await page.waitForTimeout(4000)
    await shot(page, "17-chat-sending")
    await page.waitForTimeout(10000)
    await shot(page, "18-chat-reply")

    const files = (await readdir(OUT)).filter((f) => f.endsWith(".png")).sort()
    await writeFile(
      path.join(OUT, "README.txt"),
      `iPhone 13 — 390×844 @3x\nBase: ${BASE}\n${new Date().toISOString()}\n\n${files.map((f) => `- ${f}`).join("\n")}\n`
    )
    console.log(`\nDone: ${files.length} screens → ${OUT}`)
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
