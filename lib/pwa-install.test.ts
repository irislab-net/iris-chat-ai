import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  isInstallNudgeOnCooldown,
  isIosLikeDevice,
  markInstallDismissed,
  PWA_INSTALL_DISMISS_KEY,
  clearInstallDismissed,
} from "@/lib/pwa-install"

describe("pwa-install helpers", () => {
  const local = new Map<string, string>()

  beforeEach(() => {
    local.clear()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => local.get(key) ?? null,
      setItem: (key: string, value: string) => {
        local.set(key, String(value))
      },
      removeItem: (key: string) => {
        local.delete(key)
      },
    })
    vi.stubGlobal("window", {
      navigator: {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
        platform: "iPhone",
        maxTouchPoints: 5,
      },
    })
    vi.stubGlobal("navigator", window.navigator)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("detects iOS-like devices", () => {
    expect(isIosLikeDevice()).toBe(true)
  })

  it("tracks install nudge cooldown", () => {
    expect(isInstallNudgeOnCooldown()).toBe(false)
    markInstallDismissed(Date.now())
    expect(local.get(PWA_INSTALL_DISMISS_KEY)).toBeTruthy()
    expect(isInstallNudgeOnCooldown()).toBe(true)
    clearInstallDismissed()
    expect(isInstallNudgeOnCooldown()).toBe(false)
  })
})
