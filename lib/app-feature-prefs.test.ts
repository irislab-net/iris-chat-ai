import { describe, expect, it } from "vitest"

import {
  createAppFeaturePrefsFromEnv,
  parseAppFeatureEnvFlag,
} from "@/lib/app-features"
import {
  getAppFeaturePrefsSnapshot,
  isAppFeatureVisible,
} from "@/lib/app-feature-prefs"

describe("parseAppFeatureEnvFlag", () => {
  it("treats unset and empty as off", () => {
    expect(parseAppFeatureEnvFlag(undefined)).toBe(false)
    expect(parseAppFeatureEnvFlag(null)).toBe(false)
    expect(parseAppFeatureEnvFlag("")).toBe(false)
    expect(parseAppFeatureEnvFlag("   ")).toBe(false)
  })

  it("accepts true / 1 / yes case-insensitively", () => {
    expect(parseAppFeatureEnvFlag("true")).toBe(true)
    expect(parseAppFeatureEnvFlag("TRUE")).toBe(true)
    expect(parseAppFeatureEnvFlag("1")).toBe(true)
    expect(parseAppFeatureEnvFlag("yes")).toBe(true)
    expect(parseAppFeatureEnvFlag(" Yes ")).toBe(true)
  })

  it("rejects other values as off", () => {
    expect(parseAppFeatureEnvFlag("false")).toBe(false)
    expect(parseAppFeatureEnvFlag("0")).toBe(false)
    expect(parseAppFeatureEnvFlag("on")).toBe(false)
    expect(parseAppFeatureEnvFlag("enabled")).toBe(false)
  })
})

describe("createAppFeaturePrefsFromEnv", () => {
  it("defaults every feature to off when env is empty", () => {
    expect(createAppFeaturePrefsFromEnv({})).toEqual({
      signal: false,
      correlation: false,
      volatility: false,
      watchlist: false,
      voice: false,
    })
  })

  it("enables only flags set to true-like values", () => {
    expect(
      createAppFeaturePrefsFromEnv({
        NEXT_PUBLIC_FEATURE_SIGNAL: "true",
        NEXT_PUBLIC_FEATURE_CORRELATION: "false",
        NEXT_PUBLIC_FEATURE_VOLATILITY: "1",
        NEXT_PUBLIC_FEATURE_WATCHLIST: "no",
        NEXT_PUBLIC_FEATURE_VOICE: "yes",
      })
    ).toEqual({
      signal: true,
      correlation: false,
      volatility: true,
      watchlist: false,
      voice: true,
    })
  })
})

describe("app feature prefs snapshot", () => {
  it("exposes a stable env-derived snapshot", () => {
    const snapshot = getAppFeaturePrefsSnapshot()
    expect(Object.keys(snapshot).sort()).toEqual([
      "correlation",
      "signal",
      "voice",
      "volatility",
      "watchlist",
    ])
    for (const id of Object.keys(snapshot) as Array<keyof typeof snapshot>) {
      expect(typeof snapshot[id]).toBe("boolean")
      expect(isAppFeatureVisible(id)).toBe(snapshot[id])
    }
  })
})
