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
  let cookieJar: string

  beforeEach(() => {
    store = {}
    cookieJar = ""
    resetConsentCache()
    vi.stubGlobal("window", {
      dataLayer: [],
      gtag: vi.fn(),
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      location: { hostname: "localhost", protocol: "http:" },
    })
    vi.stubGlobal("document", {
      get cookie() {
        return cookieJar
      },
      set cookie(value: string) {
        const [pair] = value.split(";")
        const eq = pair.indexOf("=")
        const name = pair.slice(0, eq)
        const rawValue = pair.slice(eq + 1)
        if (value.includes("Max-Age=0")) {
          cookieJar = cookieJar
            .split("; ")
            .filter((part) => part && !part.startsWith(`${name}=`))
            .join("; ")
          return
        }
        const next = `${name}=${rawValue}`
        const others = cookieJar
          .split("; ")
          .filter((part) => part && !part.startsWith(`${name}=`))
        cookieJar = [...others, next].filter(Boolean).join("; ")
      },
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
