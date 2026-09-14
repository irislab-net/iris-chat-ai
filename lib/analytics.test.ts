import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  GA_MEASUREMENT_ID,
  isAnalyticsEnabled,
  trackCheckoutStart,
  trackEvent,
  trackPurchase,
  trackUpgradeView,
} from "@/lib/analytics"

describe("analytics", () => {
  const gtag = vi.fn()

  beforeEach(() => {
    gtag.mockClear()
    vi.stubGlobal("window", {
      gtag,
      location: { href: "https://chat.irislab.info/" },
    })
    vi.stubGlobal("document", { title: "Exur" })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("uses the production measurement id fallback", () => {
    expect(GA_MEASUREMENT_ID).toBe("G-GLTQZ1G6RX")
  })

  it("no-ops trackEvent when gtag is unavailable", () => {
    vi.stubGlobal("window", {})
    trackEvent("test_event", { foo: "bar" })
    expect(gtag).not.toHaveBeenCalled()
  })

  it("fires custom events through gtag", () => {
    trackEvent("test_event", { foo: "bar" })
    expect(gtag).toHaveBeenCalledWith("event", "test_event", { foo: "bar" })
  })

  it("tracks upgrade funnel events", () => {
    trackUpgradeView()
    trackCheckoutStart({ billing: "monthly" })
    trackPurchase({ billing: "annual", currency: "USDT", value: 500 })

    expect(gtag).toHaveBeenCalledWith("event", "upgrade_view", undefined)
    expect(gtag).toHaveBeenCalledWith("event", "begin_checkout", {
      billing: "monthly",
      plan: "plus",
      currency: "USD",
      value: 49,
    })
    expect(gtag).toHaveBeenCalledWith("event", "purchase", {
      billing: "annual",
      plan: "plus",
      currency: "USDT",
      value: 500,
      item_id: "plus_annual",
      item_name: "Plus",
    })
  })

  it("enables analytics in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(isAnalyticsEnabled()).toBe(true)
  })

  it("disables analytics in development without explicit env", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "")
    expect(isAnalyticsEnabled()).toBe(false)
  })
})
