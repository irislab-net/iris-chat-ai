import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api/config", () => ({
  authUrl: (path: string) => path,
  getAuthDestination: () => "/",
  isChatAppHost: () => true,
  loginWithGoogleUrl: () => "/login",
}))

vi.mock("@/lib/auth-pwa", () => ({
  clearAuthPwaPending: vi.fn(),
  markAuthPwaPending: vi.fn(),
  persistAuthReturnTo: vi.fn(),
}))

vi.mock("@/lib/display-mode", () => ({
  isStandaloneDisplay: () => false,
}))

vi.mock("@/lib/user-avatar", () => ({
  normalizeUser: <T>(user: T) => user,
}))

import {
  consumePlanUpgradePendingRefresh,
  establishSessionAfterPlanUpgrade,
  hasPlanUpgradePendingRefresh,
  markPlanUpgradePendingRefresh,
  PLAN_UPGRADE_PENDING_REFRESH_KEY,
  storeTokenPair,
} from "@/lib/api/auth"

describe("plan upgrade pending refresh flag", () => {
  beforeEach(() => {
    const storage = new Map<string, string>()
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    })
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value)
        },
        removeItem: (key: string) => {
          storage.delete(key)
        },
        clear: () => storage.clear(),
      },
      configurable: true,
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "sessionStorage")
    Reflect.deleteProperty(globalThis, "window")
  })

  it("marks, reports, and consumes the pending-refresh flag", () => {
    expect(hasPlanUpgradePendingRefresh()).toBe(false)
    expect(consumePlanUpgradePendingRefresh()).toBe(false)

    markPlanUpgradePendingRefresh()
    expect(sessionStorage.getItem(PLAN_UPGRADE_PENDING_REFRESH_KEY)).toBe(
      "true"
    )
    expect(hasPlanUpgradePendingRefresh()).toBe(true)
    expect(consumePlanUpgradePendingRefresh()).toBe(true)
    expect(hasPlanUpgradePendingRefresh()).toBe(false)
    expect(consumePlanUpgradePendingRefresh()).toBe(false)
  })
})

describe("establishSessionAfterPlanUpgrade", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    const storage = new Map<string, string>()
    Object.defineProperty(globalThis, "window", {
      value: globalThis,
      configurable: true,
    })
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value)
        },
        removeItem: (key: string) => {
          storage.delete(key)
        },
        clear: () => storage.clear(),
      },
      configurable: true,
    })
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockReset()
    storeTokenPair({
      access_token: "stale-free",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    Reflect.deleteProperty(globalThis, "sessionStorage")
    Reflect.deleteProperty(globalThis, "window")
  })

  function tokenResponse(accessToken: string) {
    return new Response(
      JSON.stringify({
        access_token: accessToken,
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }

  function meResponse(tier: "free" | "pro") {
    const now = new Date().toISOString()
    return new Response(
      JSON.stringify({
        id: "u1",
        email: "a@b.c",
        tier,
        role: "user",
        created_at: now,
        updated_at: now,
        last_login_at: now,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }

  it("mints once when no pending upgrade flag", async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse("access-1"))
      .mockResolvedValueOnce(meResponse("free"))

    const session = await establishSessionAfterPlanUpgrade()
    expect(session.user.tier).toBe("free")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("keeps minting until /me reports Plus, then clears the flag", async () => {
    markPlanUpgradePendingRefresh()
    fetchMock
      .mockResolvedValueOnce(tokenResponse("access-free"))
      .mockResolvedValueOnce(meResponse("free"))
      .mockResolvedValueOnce(tokenResponse("access-pro"))
      .mockResolvedValueOnce(meResponse("pro"))

    const pending = establishSessionAfterPlanUpgrade()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(350)
    const session = await pending

    expect(session.user.tier).toBe("pro")
    expect(session.access_token).toBe("access-pro")
    expect(hasPlanUpgradePendingRefresh()).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it("leaves the pending flag when Plus never appears", async () => {
    markPlanUpgradePendingRefresh()
    fetchMock.mockReset()
    for (let i = 0; i < 5; i++) {
      fetchMock.mockResolvedValueOnce(tokenResponse(`access-${i}`))
      fetchMock.mockResolvedValueOnce(meResponse("free"))
    }

    const pending = establishSessionAfterPlanUpgrade()
    await Promise.resolve()
    await vi.runAllTimersAsync()
    const session = await pending

    expect(session.user.tier).toBe("free")
    expect(hasPlanUpgradePendingRefresh()).toBe(true)
  })
})
