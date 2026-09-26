import { describe, expect, it, vi } from "vitest"

import {
  PUBLIC_HOME_REVALIDATE_SECONDS,
  PUBLIC_INSIGHT_REVALIDATE_SECONDS,
  PUBLIC_NEWS_REVALIDATE_SECONDS,
} from "@/lib/api/public-home"
import { CANDLE_INTERVAL_MS, NEWS_REFRESH_INTERVAL_MS } from "@/lib/format"
import {
  AUTH_SUCCESS_ROBOTS,
  getLandingHref,
  getMarketingPageHref,
  getSiteOrigin,
  isAppDeskPath,
  LANDING_PATH,
  PRODUCTION_ORIGIN,
  PUBLIC_INDEXABLE_PATHS,
  ROOT_ROBOTS,
  SITE_DESCRIPTION,
  SOCIAL_TELEGRAM_URL,
  SOCIAL_X_URL,
  UPGRADE_PATH,
  UPGRADE_ROBOTS,
} from "@/lib/site"

describe("public SEO site policy (S1/S2)", () => {
  it("treats root as indexable and auth success as noindex", () => {
    expect(ROOT_ROBOTS).toEqual({ index: true, follow: true })
    expect(AUTH_SUCCESS_ROBOTS).toEqual({ index: false, follow: false })
    expect(UPGRADE_ROBOTS).toEqual({ index: false, follow: false })
  })

  it("uses production origin fallback from known deployment host", () => {
    expect(PRODUCTION_ORIGIN).toBe("https://chat.exur.ai")
    expect(getSiteOrigin()).toMatch(/^https:\/\//)
  })

  it("keeps insight SSR cache on F1 candle length and news on a 5m cadence", () => {
    expect(PUBLIC_INSIGHT_REVALIDATE_SECONDS).toBe(CANDLE_INTERVAL_MS / 1000)
    expect(PUBLIC_INSIGHT_REVALIDATE_SECONDS).toBe(900)
    expect(PUBLIC_NEWS_REVALIDATE_SECONDS).toBe(NEWS_REFRESH_INTERVAL_MS / 1000)
    expect(PUBLIC_NEWS_REVALIDATE_SECONDS).toBe(300)
    expect(PUBLIC_HOME_REVALIDATE_SECONDS).toBe(PUBLIC_NEWS_REVALIDATE_SECONDS)
    expect(PUBLIC_HOME_REVALIDATE_SECONDS).not.toBe(6 * 60 * 60)
  })

  it("recognizes root and legacy /app as desk paths", () => {
    expect(isAppDeskPath("/")).toBe(true)
    expect(isAppDeskPath("/app")).toBe(true)
    expect(isAppDeskPath("/home")).toBe(false)
  })

  it("lists only real public indexable paths for sitemap IA", () => {
    expect(PUBLIC_INDEXABLE_PATHS).toEqual([
      "/",
      "/what-is-exur",
      "/about",
      "/ai-trading-signals",
      "/privacy",
      "/security",
      "/terms",
      "/refund",
    ])
    expect(PUBLIC_INDEXABLE_PATHS).not.toContain("/auth/success")
    expect(PUBLIC_INDEXABLE_PATHS).not.toContain(UPGRADE_PATH)
    expect(PUBLIC_INDEXABLE_PATHS).not.toContain("/home")
  })

  it("points landing links at apex `/` (local preview still uses /home)", () => {
    expect(LANDING_PATH).toBe("/")
    vi.stubEnv("NODE_ENV", "development")
    expect(getLandingHref()).toBe("/home")
    vi.stubEnv("NODE_ENV", "production")
    expect(getLandingHref()).toBe("https://exur.ai")
  })

  it("uses absolute apex hrefs for marketing pages from the chat desk", () => {
    vi.stubEnv("NODE_ENV", "development")
    expect(getMarketingPageHref("/privacy")).toBe("/privacy")
    vi.stubEnv("NODE_ENV", "production")
    expect(getMarketingPageHref("/privacy")).toBe("https://exur.ai/privacy")
    expect(getMarketingPageHref("terms")).toBe("https://exur.ai/terms")
  })

  it("exposes verified social URL for trust / Organization sameAs", () => {
    expect(SOCIAL_X_URL).toBe("https://x.com/exur_ai")
    expect(SOCIAL_TELEGRAM_URL).toBe("https://t.me/exur_ai")
  })

  it("keeps homepage meta description aligned with financial-assistant copy", () => {
    expect(SITE_DESCRIPTION.toLowerCase()).toContain("ai financial assistant")
    expect(SITE_DESCRIPTION.toLowerCase()).not.toContain("live")
    expect(SITE_DESCRIPTION.toLowerCase()).not.toMatch(/\b6h\b/)
  })
})
