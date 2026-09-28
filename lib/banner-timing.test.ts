import { describe, expect, it } from "vitest"

import {
  shouldShowCookieBanner,
  shouldShowPwaNudge,
} from "@/lib/banner-timing"

describe("banner-timing gates", () => {
  it("shows cookie banner only when undecided and reveal is ready", () => {
    expect(shouldShowCookieBanner(false, false)).toBe(false)
    expect(shouldShowCookieBanner(false, true)).toBe(true)
    expect(shouldShowCookieBanner(true, true)).toBe(false)
  })

  it("shows PWA nudge only when eligible, consent resolved, and reveal ready", () => {
    expect(
      shouldShowPwaNudge({
        eligible: true,
        consentResolved: false,
        revealReady: true,
      })
    ).toBe(false)
    expect(
      shouldShowPwaNudge({
        eligible: true,
        consentResolved: true,
        revealReady: false,
      })
    ).toBe(false)
    expect(
      shouldShowPwaNudge({
        eligible: false,
        consentResolved: true,
        revealReady: true,
      })
    ).toBe(false)
    expect(
      shouldShowPwaNudge({
        eligible: true,
        consentResolved: true,
        revealReady: true,
      })
    ).toBe(true)
  })
})
