import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearTradingProfile,
  parseTradingProfile,
  readTradingProfile,
  tradingProfileForClientContext,
  tradingProfileToDraft,
  writeTradingProfile,
} from "@/lib/trading-profile"

describe("trading profile", () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.stubGlobal("window", {
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
    vi.unstubAllGlobals()
  })

  it("parses a valid profile", () => {
    expect(
      parseTradingProfile({
        experience_level: "advanced",
        country: "  Iran  ",
        target_market: "crypto",
        risk_tolerance: "low",
      })
    ).toEqual({
      experience_level: "advanced",
      country: "Iran",
      target_market: "crypto",
      risk_tolerance: "low",
    })
  })

  it("accepts not_sure values", () => {
    expect(
      parseTradingProfile({
        experience_level: "not_sure",
        target_market: "not_sure",
        risk_tolerance: "not_sure",
      })
    ).toEqual({
      experience_level: "not_sure",
      target_market: "not_sure",
      risk_tolerance: "not_sure",
    })
  })

  it("rejects invalid profiles", () => {
    expect(parseTradingProfile({ experience_level: "pro" })).toBeNull()
  })

  it("round-trips through localStorage", () => {
    const saved = writeTradingProfile({
      experience_level: "beginner",
      country: "",
      target_market: "forex",
      risk_tolerance: "high",
    })
    expect(saved).toMatchObject({
      experience_level: "beginner",
      target_market: "forex",
      risk_tolerance: "high",
    })
    expect(saved?.country).toBeUndefined()
    expect(readTradingProfile()).toEqual(saved)
    expect(tradingProfileToDraft(saved).country).toBe("")
  })

  it("defaults draft to not_sure when empty", () => {
    expect(tradingProfileToDraft(null)).toEqual({
      experience_level: "not_sure",
      country: "",
      target_market: "not_sure",
      risk_tolerance: "not_sure",
    })
  })

  it("omits client context when any field is not_sure", () => {
    expect(
      tradingProfileForClientContext({
        experience_level: "beginner",
        target_market: "crypto",
        risk_tolerance: "not_sure",
        country: undefined,
      })
    ).toBeUndefined()
    expect(
      tradingProfileForClientContext({
        experience_level: "beginner",
        target_market: "crypto",
        risk_tolerance: "low",
        country: "Iran",
      })
    ).toEqual({
      experience_level: "beginner",
      target_market: "crypto",
      risk_tolerance: "low",
      country: "Iran",
    })
  })

  it("clears storage", () => {
    writeTradingProfile({
      experience_level: "intermediate",
      country: "US",
      target_market: "multi",
      risk_tolerance: "medium",
    })
    clearTradingProfile()
    expect(readTradingProfile()).toBeNull()
  })
})
