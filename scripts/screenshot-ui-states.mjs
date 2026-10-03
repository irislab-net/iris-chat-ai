/**
 * Full UI screenshot pack — iPhone 13 (390×844).
 *
 * Captures:
 *   • Every public marketing / product / legal route (full page)
 *   • Every landing section (#hero, #features, …)
 *   • Major content sections on citation / legal pages
 *   • Desk states: empty+news, setup card, wait card
 *
 * Usage:
 *   pnpm screenshots:ui
 *   PLAYWRIGHT_BASE_URL=https://localhost:3000 pnpm screenshots:ui
 */

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, devices } from "@playwright/test"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const OUT_DIR = path.join(ROOT, "screenshots")

const CANDIDATE_BASE_URLS = [
  process.env.PLAYWRIGHT_BASE_URL,
  "https://local.exur.ai:3000",
  "https://127.0.0.1:3000",
  "https://localhost:3000",
].filter(Boolean)

/** Resolved at runtime by probeBaseUrl(). */
let BASE_URL = String(CANDIDATE_BASE_URLS[0] ?? "https://127.0.0.1:3000").replace(
  /\/$/,
  ""
)

const IPHONE_13 = devices["iPhone 13"]
/** Full iPhone 13 CSS size (Playwright device inset is 664 — we override). */
const VIEWPORT = { width: 390, height: 844 }

const CONSENT = JSON.stringify({
  version: "v1",
  analytics: false,
  advertising: false,
  timestamp: Date.now(),
})

/** Full-page routes to capture. */
const FULL_PAGES = [
  { path: "/home", file: "page-home-landing-full.png", label: "Marketing landing" },
  { path: "/", file: "page-desk-full.png", label: "Live desk (default)" },
  { path: "/upgrade", file: "page-upgrade-full.png", label: "Plans & pricing" },
  { path: "/billing", file: "page-billing-full.png", label: "Credits & billing" },
  { path: "/what-is-exur", file: "page-what-is-exur-full.png", label: "What is Exur" },
  { path: "/about", file: "page-about-full.png", label: "About" },
  {
    path: "/ai-trading-signals",
    file: "page-ai-trading-signals-full.png",
    label: "AI trading signals",
  },
  { path: "/privacy", file: "page-privacy-full.png", label: "Privacy" },
  { path: "/security", file: "page-security-full.png", label: "Security" },
  { path: "/terms", file: "page-terms-full.png", label: "Terms" },
  { path: "/refund", file: "page-refund-full.png", label: "Refund" },
]

/** Landing (/home) section element shots — ids from components/landing/modern/*. */
const LANDING_SECTIONS = [
  { id: "hero", file: "section-home-hero.png" },
  { id: "features", file: "section-home-features.png" },
  { id: "how-it-works", file: "section-home-how-it-works.png" },
  { id: "desk", file: "section-home-desk.png" },
  { id: "signal-wait", file: "section-home-signal-wait.png" },
  { id: "signals", file: "section-home-signals.png" },
  { id: "about", file: "section-home-about.png" },
  { id: "try", file: "section-home-guest-trial.png" },
  { id: "pricing", file: "section-home-pricing.png" },
  { id: "faq", file: "section-home-faq.png" },
  { id: "get-started", file: "section-home-cta.png" },
]

/** Section shots on long content pages. */
const CONTENT_SECTIONS = [
  {
    path: "/what-is-exur",
    sections: [
      "what-exur-is",
      "what-exur-is-not",
      "who-exur-is-for",
      "exur-features",
      "exur-faq",
      "exur-official",
    ],
  },
  {
    path: "/ai-trading-signals",
    sections: ["signals-what", "signals-who", "signals-faq"],
  },
  {
    path: "/about",
    sections: ["about-hello"],
  },
  {
    path: "/privacy",
    sections: [
      "privacy-controller",
      "privacy-age",
      "privacy-collect",
      "privacy-ai",
      "privacy-cookies",
      "privacy-legal-basis",
      "privacy-processors",
      "privacy-terms-refund",
      "privacy-retention",
      "request-data-deletion",
      "privacy-disclaimer",
      "privacy-company",
    ],
  },
  {
    path: "/security",
    sections: ["security-program", "security-reporting", "security-faq"],
  },
  {
    path: "/terms",
    sections: [
      "terms-disclaimer",
      "terms-eligibility",
      "terms-accounts",
      "terms-usage",
      "terms-availability",
      "terms-ip",
      "terms-liability",
      "terms-governing-law",
      "terms-modifications",
      "terms-company",
      "terms-contact",
    ],
  },
  {
    path: "/refund",
    sections: [
      "refund-free-tier",
      "refund-non-refundable",
      "refund-cancellation",
      "refund-outages",
      "refund-fraud",
      "refund-contact",
    ],
  },
]

const SETUP_TICKET = {
  symbol: "ETH",
  side: "LONG",
  quantity: 0,
  markPrice: 3242,
  stopLoss: 3188,
  takeProfit: 3390,
  leverage: 5,
  setup: "Pullback to session VWAP after reclaiming the prior day high.",
  thesis:
    "Buyers defended the higher low; targeting the overnight range high with defined invalidation.",
  timeHorizon: "4–8h",
  entryReason: "VWAP reclaim",
  stopLossReason: "Below higher low",
  takeProfitReason: "Range high",
}

const WAIT_REASON =
  "No clear edge: news impact and tape are mixed, and structure has not confirmed a directional break."

const results = []

function isoNow() {
  return new Date().toISOString()
}

function slugPath(routePath) {
  return routePath.replace(/^\//, "").replace(/\//g, "-") || "root"
}

function buildChatStore(kind) {
  const now = isoNow()
  const id =
    kind === "setup"
      ? "qa-screenshot-setup-session"
      : kind === "wait"
        ? "qa-screenshot-wait-session"
        : "qa-screenshot-empty-session"

  if (kind === "empty") {
    return {
      version: 1,
      activeId: id,
      deletedIds: [],
      conversations: [],
    }
  }

  const userContent =
    kind === "setup"
      ? "Should I long ETH on this pullback?"
      : "Is there a trade on BTC right now?"

  const assistant =
    kind === "setup"
      ? {
          id: "qa-assistant-setup",
          role: "assistant",
          content:
            "Here is a structured setup. This is information, not an order.",
          createdAt: now,
          paperTicket: SETUP_TICKET,
        }
      : {
          id: "qa-assistant-wait",
          role: "assistant",
          content: "Better to wait for a cleaner read.",
          createdAt: now,
          noTradeReason: WAIT_REASON,
        }

  return {
    version: 1,
    activeId: id,
    deletedIds: [],
    conversations: [
      {
        id,
        title: userContent.slice(0, 48),
        createdAt: now,
        updatedAt: now,
        pinned: false,
        history: [
          { role: "user", content: userContent },
          { role: "assistant", content: assistant.content },
        ],
        messages: [
          {
            id: "qa-user-1",
            role: "user",
            content: userContent,
            createdAt: now,
          },
          assistant,
        ],
      },
    ],
  }
}

function consentInit() {
  return [
    ({ consent }) => {
      localStorage.setItem("exur-cookie-consent", consent)
    },
    { consent: CONSENT },
  ]
}

function deskSeedInit(deskMode) {
  const chatStore = buildChatStore(
    deskMode === "setup" ? "setup" : deskMode === "wait" ? "wait" : "empty"
  )
  const shellPrefs = {
    chatOpen: true,
    chatMode: "focused",
    newsOpen: deskMode === "initial",
    panelLayouts: {},
  }
  return [
    ({ consent, chatStoreJson, shellPrefsJson }) => {
      localStorage.setItem("exur-cookie-consent", consent)
      localStorage.setItem("iris-chat-v1:guest", chatStoreJson)
      localStorage.setItem("iris-shell-layout-prefs", shellPrefsJson)
      localStorage.removeItem("iris-chat-v1")
    },
    {
      consent: CONSENT,
      chatStoreJson: JSON.stringify(chatStore),
      shellPrefsJson: JSON.stringify(shellPrefs),
    },
  ]
}

async function stubChatHistoryApis(page) {
  await page.route("**/v1/chat/history**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], limit: 100, offset: 0, total: 0 }),
    })
  })
  await page.route("**/v1/chat/sessions**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], limit: 100, offset: 0, total: 0 }),
    })
  })
}

async function settle(page, ms = 600) {
  await page.waitForLoadState("domcontentloaded").catch(() => {})
  await page.waitForTimeout(ms)
}

async function gotoPage(page, routePath) {
  const response = await page.goto(`${BASE_URL}${routePath}`, {
    waitUntil: "domcontentloaded",
    timeout: 90_000,
  })
  const status = response?.status() ?? 0
  if (!response || status >= 400) {
    console.warn(`  ! ${routePath} → HTTP ${status || "none"}`)
  }
  await settle(page, 900)
  return status
}

async function fullPageShot(page, filename, meta = {}) {
  const filePath = path.join(OUT_DIR, filename)
  await page.screenshot({
    path: filePath,
    fullPage: true,
    animations: "disabled",
  })
  results.push({ file: filename, type: "full-page", ...meta })
  console.log(`  ✓ ${filename}`)
}

async function sectionShot(page, sectionId, filename, meta = {}) {
  const locator = page.locator(`#${sectionId}`).first()
  const count = await locator.count()
  if (count === 0) {
    console.warn(`  ✗ missing #${sectionId} → skip ${filename}`)
    results.push({
      file: filename,
      type: "section",
      id: sectionId,
      skipped: true,
      ...meta,
    })
    return false
  }
  await locator.scrollIntoViewIfNeeded()
  await settle(page, 400)
  const filePath = path.join(OUT_DIR, filename)
  await locator.screenshot({
    path: filePath,
    animations: "disabled",
  })
  results.push({
    file: filename,
    type: "section",
    id: sectionId,
    ...meta,
  })
  console.log(`  ✓ ${filename}`)
  return true
}

async function captureFullPages(context) {
  console.log("\n══ Full pages ══")

  for (const route of FULL_PAGES) {
    console.log(`\n${route.label} (${route.path})`)
    const page = await context.newPage()
    if (route.path === "/") {
      await page.addInitScript(...deskSeedInit("empty"))
      await stubChatHistoryApis(page)
    } else {
      await page.addInitScript(...consentInit())
    }
    await gotoPage(page, route.path)
    await fullPageShot(page, route.file, {
      path: route.path,
      label: route.label,
    })
    await page.close()
  }
}

async function captureLandingSections(context) {
  console.log("\n══ Landing sections (/home) ══")
  const page = await context.newPage()
  const [fn, args] = consentInit()
  await page.addInitScript(fn, args)
  await gotoPage(page, "/home")
  // Give below-fold dynamic sections time to mount.
  await settle(page, 1500)

  for (const section of LANDING_SECTIONS) {
    await sectionShot(page, section.id, section.file, { path: "/home" })
  }

  await page.close()
}

async function captureContentSections(context) {
  console.log("\n══ Content page sections ══")
  const page = await context.newPage()
  const [fn, args] = consentInit()
  await page.addInitScript(fn, args)

  for (const group of CONTENT_SECTIONS) {
    console.log(`\n${group.path}`)
    await gotoPage(page, group.path)
    await settle(page, 800)
    const prefix = slugPath(group.path)
    for (const id of group.sections) {
      await sectionShot(page, id, `section-${prefix}-${id}.png`, {
        path: group.path,
      })
    }
  }

  await page.close()
}

async function captureDeskStates(context) {
  console.log("\n══ Desk UI states ══")

  const states = [
    {
      mode: "initial",
      file: "desk-state-initial-news-empty-chat.png",
      waitFor: '[data-slot="app-shell"]',
    },
    {
      mode: "setup",
      file: "desk-state-setup-card.png",
      waitFor: "text=ETH",
    },
    {
      mode: "wait",
      file: "desk-state-wait-no-trade.png",
      waitFor: "text=Wait",
    },
  ]

  for (const state of states) {
    console.log(`\nDesk state: ${state.mode}`)
    const page = await context.newPage()
    await page.addInitScript(...deskSeedInit(state.mode))
    await stubChatHistoryApis(page)
    await gotoPage(page, "/")
    if (state.waitFor) {
      try {
        await page.locator(state.waitFor).first().waitFor({
          state: "visible",
          timeout: 20_000,
        })
      } catch {
        console.warn(`  ! waitFor failed: ${state.waitFor}`)
      }
    }
    await settle(page, 1200)
    await fullPageShot(page, state.file, {
      path: "/",
      deskMode: state.mode,
    })
    await page.close()
  }
}

async function launchBrowser() {
  // Prefer Playwright's Chromium; fall back to installed Chrome / Edge when
  // the Playwright browser download is blocked (common on restricted networks).
  // MAP local.exur.ai → 127.0.0.1 so loopback HTTPS redirects resolve without
  // editing the system hosts file (see proxy.ts / lib/dev-access).
  const chromeArgs = [
    "--host-resolver-rules=MAP local.exur.ai 127.0.0.1, MAP local.irislab.info 127.0.0.1",
  ]
  const attempts = [
    { name: "chromium", options: { headless: true, args: chromeArgs } },
    {
      name: "chrome",
      options: { headless: true, channel: "chrome", args: chromeArgs },
    },
    {
      name: "msedge",
      options: { headless: true, channel: "msedge", args: chromeArgs },
    },
  ]

  let lastError
  for (const attempt of attempts) {
    try {
      const browser = await chromium.launch(attempt.options)
      console.log(`Browser:  ${attempt.name}`)
      return browser
    } catch (err) {
      lastError = err
      console.warn(`  ! launch ${attempt.name} failed: ${err.message}`)
    }
  }
  throw lastError ?? new Error("No browser available")
}

async function probeBaseUrl(browser) {
  const urls = [
    ...new Set(
      CANDIDATE_BASE_URLS.map((u) => String(u).replace(/\/$/, "")).filter(Boolean)
    ),
  ]

  for (const url of urls) {
    try {
      const context = await browser.newContext({ ignoreHTTPSErrors: true })
      const page = await context.newPage()
      const res = await page.goto(`${url}/home`, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      })
      await context.close()
      if (res && res.status() < 500) {
        BASE_URL = url
        console.log(`Reachable: ${url} (HTTP ${res.status()})`)
        return true
      }
    } catch (err) {
      console.warn(`  ! ${url} → ${err.message.split("\n")[0]}`)
    }
  }
  return false
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  console.log(`Candidates: ${CANDIDATE_BASE_URLS.join(", ")}`)
  console.log(`Output:     ${OUT_DIR}`)
  console.log(`Device:     iPhone 13 emulation @ ${VIEWPORT.width}×${VIEWPORT.height}`)

  const browser = await launchBrowser()

  try {
    const reachable = await probeBaseUrl(browser)
    if (!reachable) {
      throw new Error(
        `Dev server not reachable. Start with: pnpm dev`
      )
    }
    console.log(`Base URL:  ${BASE_URL}`)

    const context = await browser.newContext({
      ...IPHONE_13,
      viewport: VIEWPORT,
      screen: VIEWPORT,
      ignoreHTTPSErrors: true,
      locale: "en-US",
      colorScheme: "light",
    })

    try {
      await captureFullPages(context)
      await captureLandingSections(context)
      await captureContentSections(context)
      await captureDeskStates(context)

      const manifest = {
        generatedAt: isoNow(),
        baseUrl: BASE_URL,
        device: "iPhone 13",
        viewport: VIEWPORT,
        count: results.length,
        captured: results.filter((r) => !r.skipped).length,
        skipped: results.filter((r) => r.skipped).length,
        results,
      }
      await writeFile(
        path.join(OUT_DIR, "manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf8"
      )

      console.log(
        `\nDone. ${manifest.captured} screenshots` +
          (manifest.skipped ? ` (${manifest.skipped} skipped)` : "") +
          ` → ./screenshots`
      )
    } finally {
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error("\nScreenshot run failed:")
  console.error(err)
  console.error(`
Tips:
  • pnpm dev   (or pnpm dev:http)
  • PLAYWRIGHT_BASE_URL=https://localhost:3000 pnpm screenshots:ui
  • pnpm exec playwright install chromium
`)
  process.exit(1)
})
