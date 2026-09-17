import { describe, expect, it } from "vitest"

import { PUBLIC_HOME_REVALIDATE_SECONDS } from "@/lib/api/public-home"
import { CANDLE_INTERVAL_MS } from "@/lib/format"
import {
  AUTH_SUCCESS_ROBOTS,
  getSiteOrigin,
  isAppDeskPath,
  PRODUCTION_ORIGIN,
  PUBLIC_INDEXABLE_PATHS,
  ROOT_ROBOTS,
  SITE_DESCRIPTION,
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
    expect(PRODUCTION_ORIGIN).toBe("https://chat.irislab.info")
    expect(getSiteOrigin()).toMatch(/^https:\/\//)
  })

  it("aligns public SSR revalidate with F1 candle length, not invented 6h", () => {
    expect(PUBLIC_HOME_REVALIDATE_SECONDS).toBe(CANDLE_INTERVAL_MS / 1000)
    expect(PUBLIC_HOME_REVALIDATE_SECONDS).toBe(900)
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
      "/home",
      "/about",
      "/ai-trading-signals",
      "/privacy",
      "/terms",
    ])
    expect(PUBLIC_INDEXABLE_PATHS).not.toContain("/auth/success")
    expect(PUBLIC_INDEXABLE_PATHS).not.toContain(UPGRADE_PATH)
  })

  it("exposes verified social URL for trust / Organization sameAs", () => {
    expect(SOCIAL_X_URL).toBe("https://x.com/TheIrisLab")
  })

  it("keeps homepage meta description aligned with financial-assistant copy", () => {
    expect(SITE_DESCRIPTION.toLowerCase()).toContain("ai financial assistant")
    expect(SITE_DESCRIPTION.toLowerCase()).not.toContain("live")
    expect(SITE_DESCRIPTION.toLowerCase()).not.toMatch(/\b6h\b/)
  })
})
