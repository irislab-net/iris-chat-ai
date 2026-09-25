import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  getStoredConsent,
  hasAnalyticsConsent,
  resetConsentCache,
  setStoredConsent,
} from "@/lib/consent"

/**
 * Consent preference persistence (TEST-003).
 * Banner UI is covered by Playwright e2e; this locks the storage contract.
 */
describe("consent preferences (unit)", () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    resetConsentCache()
    vi.stubGlobal("window", {
      dataLayer: [],
      gtag: vi.fn(),
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

  it("reject path stores analytics=false", () => {
    const prefs = setStoredConsent({ analytics: false })
    expect(prefs.analytics).toBe(false)
    expect(hasAnalyticsConsent(prefs)).toBe(false)
    expect(JSON.parse(store[CONSENT_STORAGE_KEY]).version).toBe(CONSENT_VERSION)
  })

  it("accept path stores analytics=true", () => {
    setStoredConsent({ analytics: true })
    expect(getStoredConsent()?.analytics).toBe(true)
  })
})
