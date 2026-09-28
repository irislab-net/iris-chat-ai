import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearInstallDismissed,
  isInstallNudgeOnCooldown,
  isIosLikeDevice,
  isPwaInstallHost,
  markInstallDismissed,
  PWA_INSTALL_DISMISS_KEY,
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

  it("limits install UI to the chat desk host", () => {
    expect(isPwaInstallHost("chat.exur.ai")).toBe(true)
    expect(isPwaInstallHost("exur.ai")).toBe(false)
    expect(isPwaInstallHost("www.exur.ai")).toBe(false)
    expect(isPwaInstallHost("localhost")).toBe(false)
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
