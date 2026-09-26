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
  let cookieJar: string

  beforeEach(() => {
    store = {}
    cookieJar = ""
    resetConsentCache()
    gtag.mockClear()
    vi.stubGlobal("window", {
      gtag,
      dataLayer: [],
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      location: { hostname: "chat.exur.ai", protocol: "https:" },
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
    expect(cookieJar).toContain("exur-cookie-consent=")
    expect(gtag).toHaveBeenCalledWith(
      "consent",
      "update",
      expect.objectContaining({ analytics_storage: "granted" })
    )
  })

  it("hydrates from the shared cookie when localStorage is empty", () => {
    const raw = JSON.stringify({
      version: CONSENT_VERSION,
      analytics: false,
      advertising: false,
      timestamp: Date.now(),
    })
    cookieJar = `exur-cookie-consent=${encodeURIComponent(raw)}`
    resetConsentCache()
    expect(getStoredConsent()?.analytics).toBe(false)
    expect(store[CONSENT_STORAGE_KEY]).toBe(raw)
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
