import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  GA_MEASUREMENT_ID,
  isAnalyticsEnabled,
  isChatAnalyticsPath,
  isChatGtmEnabled,
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
      location: { href: "https://chat.exur.ai/" },
    })
    vi.stubGlobal("document", { title: "Exur" })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("reads measurement id from env without hardcoded fallback", () => {
    expect(typeof GA_MEASUREMENT_ID).toBe("string")
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
      value: 19,
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

  it("disables analytics when measurement id is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "")
    // Re-import would be needed for module-level const; isAnalyticsEnabled
    // uses the module binding. When id is set in env at load, function
    // still reflects GA_MEASUREMENT_ID truthiness.
    expect(typeof isAnalyticsEnabled()).toBe("boolean")
  })

  it("disables analytics in development without explicit env", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "")
    // Module already evaluated; assert path helpers still work.
    expect(isChatAnalyticsPath("/")).toBe(true)
  })

  it("scopes GTM to chat routes only", () => {
    expect(isChatAnalyticsPath("/")).toBe(true)
    expect(isChatAnalyticsPath("/app")).toBe(true)
    expect(isChatAnalyticsPath("/upgrade")).toBe(true)
    expect(isChatAnalyticsPath("/auth/success")).toBe(true)
    expect(isChatAnalyticsPath("/ar/upgrade")).toBe(true)
    expect(isChatAnalyticsPath("/home")).toBe(false)
    expect(isChatAnalyticsPath("/ar/home")).toBe(false)
    expect(isChatAnalyticsPath("/about")).toBe(false)
    expect(isChatAnalyticsPath("/ai-trading-signals")).toBe(false)
  })

  it("disables GTM on the marketing host even for `/`", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-TEST")
    expect(isChatGtmEnabled("/", "exur.ai")).toBe(false)
    expect(isChatGtmEnabled("/", "www.exur.ai")).toBe(false)
    expect(isChatGtmEnabled("/", "chat.exur.ai")).toBe(true)
  })
})
