import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  LEGAL_ACCEPTANCE_STORAGE_KEY,
  getLegalAcceptance,
  hasAcceptedCurrentLegal,
  recordLegalAcceptance,
  resetLegalAcceptanceCache,
} from "@/lib/legal-acceptance"
import { LEGAL_ACCEPTANCE_VERSION } from "@/lib/legal"

describe("legal acceptance", () => {
  let store: Record<string, string>
  let cookieJar: string

  beforeEach(() => {
    store = {}
    cookieJar = ""
    resetLegalAcceptanceCache()
    vi.stubGlobal("window", {
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
    resetLegalAcceptanceCache()
    vi.unstubAllGlobals()
  })

  it("starts without acceptance", () => {
    expect(hasAcceptedCurrentLegal()).toBe(false)
    expect(getLegalAcceptance()).toBeNull()
  })

  it("records acceptance for the current legal version", () => {
    const prefs = recordLegalAcceptance()
    expect(prefs.version).toBe(LEGAL_ACCEPTANCE_VERSION)
    expect(prefs.terms).toBe(true)
    expect(prefs.privacy).toBe(true)
    expect(hasAcceptedCurrentLegal()).toBe(true)
    expect(store[LEGAL_ACCEPTANCE_STORAGE_KEY]).toContain(
      `"version":"${LEGAL_ACCEPTANCE_VERSION}"`
    )
    expect(cookieJar).toContain("exur-legal-acceptance=")
  })

  it("rejects stale legal versions", () => {
    store[LEGAL_ACCEPTANCE_STORAGE_KEY] = JSON.stringify({
      version: "v0",
      terms: true,
      privacy: true,
      timestamp: Date.now(),
    })
    resetLegalAcceptanceCache()
    expect(hasAcceptedCurrentLegal()).toBe(false)
  })

  it("is idempotent once recorded", () => {
    const first = recordLegalAcceptance()
    const second = recordLegalAcceptance()
    expect(second).toBe(first)
  })
})
