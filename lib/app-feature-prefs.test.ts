import { afterEach, describe, expect, it } from "vitest"

import {
  APP_FEATURE_PREFS_STORAGE_KEY,
  getAppFeaturePrefsSnapshot,
  isAppFeatureVisible,
  parseAppFeaturePrefs,
  resetAppFeaturePrefsCache,
  setAppFeatureVisible,
  writeAppFeaturePrefs,
} from "@/lib/app-feature-prefs"

describe("app feature prefs", () => {
  afterEach(() => {
    localStorage.removeItem(APP_FEATURE_PREFS_STORAGE_KEY)
    resetAppFeaturePrefsCache()
  })

  it("defaults every feature to visible", () => {
    expect(parseAppFeaturePrefs(null)).toEqual({
      signal: true,
      correlation: true,
      volatility: true,
      watchlist: true,
      voice: true,
    })
    expect(isAppFeatureVisible("correlation")).toBe(true)
  })

  it("merges partial stored prefs over defaults", () => {
    expect(parseAppFeaturePrefs({ correlation: false, voice: false })).toEqual({
      signal: true,
      correlation: false,
      volatility: true,
      watchlist: true,
      voice: false,
    })
  })

  it("persists toggles and updates the snapshot", () => {
    setAppFeatureVisible("watchlist", false)
    writeAppFeaturePrefs({ volatility: false })
    expect(getAppFeaturePrefsSnapshot()).toMatchObject({
      watchlist: false,
      volatility: false,
      signal: true,
    })
  })
})
