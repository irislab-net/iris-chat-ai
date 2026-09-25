import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  applyConsentUpdate,
  getStoredConsent,
  hasAnalyticsConsent,
  resetConsentCache,
  setStoredConsent,
} from "@/lib/consent"

describe("consent", () => {
  const gtag = vi.fn()
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    resetConsentCache()
    gtag.mockClear()
    vi.stubGlobal("window", {
      gtag,
      dataLayer: [],
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
    })
  })

  afterEach(() => {
    resetConsentCache()
    vi.unstubAllGlobals()
  })

  it("returns null when nothing is stored", () => {
    expect(getStoredConsent()).toBeNull()
    expect(hasAnalyticsConsent(null)).toBe(false)
  })

  it("persists and reads consent preferences", () => {
    const prefs = setStoredConsent({ analytics: true })
    expect(prefs.version).toBe(CONSENT_VERSION)
    expect(prefs.analytics).toBe(true)
    expect(getStoredConsent()?.analytics).toBe(true)
    expect(store[CONSENT_STORAGE_KEY]).toContain('"analytics":true')
    expect(gtag).toHaveBeenCalledWith(
      "consent",
      "update",
      expect.objectContaining({ analytics_storage: "granted" })
    )
  })

  it("returns a stable snapshot reference while raw storage is unchanged", () => {
    setStoredConsent({ analytics: true })
    const a = getStoredConsent()
    const b = getStoredConsent()
    expect(a).toBe(b)
  })

  it("rejects stale consent versions", () => {
    resetConsentCache()
    store[CONSENT_STORAGE_KEY] = JSON.stringify({
      version: "v0",
      analytics: true,
      advertising: false,
      timestamp: Date.now(),
    })
    expect(getStoredConsent()).toBeNull()
  })

  it("applies consent updates through gtag", () => {
    applyConsentUpdate({ analytics: false, advertising: false })
    expect(gtag).toHaveBeenCalledWith(
      "consent",
      "update",
      expect.objectContaining({
        analytics_storage: "denied",
        ad_storage: "denied",
      })
    )
  })
})
