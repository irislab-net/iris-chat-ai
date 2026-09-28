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
  isLikelyJwt,
  markPlanUpgradePendingRefresh,
  PLAN_UPGRADE_PENDING_REFRESH_KEY,
  storeTokenPair,
} from "@/lib/api/auth"

const JWT_FREE = "aaa.free.sig"
const JWT_PRO = "aaa.pro.sig"
const JWT_ONE = "aaa.one.sig"

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

  it("accepts three-segment JWTs only", () => {
    expect(isLikelyJwt("aaa.bbb.ccc")).toBe(true)
    expect(isLikelyJwt("not-a-jwt")).toBe(false)
    expect(isLikelyJwt("a.b")).toBe(false)
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
      access_token: JWT_FREE,
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
      .mockResolvedValueOnce(tokenResponse(JWT_ONE))
      .mockResolvedValueOnce(meResponse("free"))

    const session = await establishSessionAfterPlanUpgrade()
    expect(session.user.tier).toBe("free")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("polls /me then remints once when Plus appears", async () => {
    markPlanUpgradePendingRefresh()
    fetchMock
      // initial mint
      .mockResolvedValueOnce(tokenResponse(JWT_FREE))
      .mockResolvedValueOnce(meResponse("free"))
      // poll /me → still free
      .mockResolvedValueOnce(meResponse("free"))
      // poll /me → plus
      .mockResolvedValueOnce(meResponse("pro"))
      // final remint
      .mockResolvedValueOnce(tokenResponse(JWT_PRO))
      .mockResolvedValueOnce(meResponse("pro"))

    const pending = establishSessionAfterPlanUpgrade()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(400)
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(900)
    const session = await pending

    expect(session.user.tier).toBe("pro")
    expect(session.access_token).toBe(JWT_PRO)
    expect(hasPlanUpgradePendingRefresh()).toBe(false)
    // 2 refresh + 4 /me (initial me, poll free, poll pro, remint me)
    expect(fetchMock).toHaveBeenCalledTimes(6)
    const refreshCalls = fetchMock.mock.calls.filter(
      (call) => call[0] === "/v1/auth/refresh"
    )
    expect(refreshCalls).toHaveLength(2)
  })

  it("leaves the pending flag when Plus never appears without extra refreshes", async () => {
    markPlanUpgradePendingRefresh()
    fetchMock
      .mockResolvedValueOnce(tokenResponse(JWT_FREE))
      .mockResolvedValueOnce(meResponse("free"))
    for (let i = 0; i < 4; i++) {
      fetchMock.mockResolvedValueOnce(meResponse("free"))
    }

    const pending = establishSessionAfterPlanUpgrade()
    await Promise.resolve()
    await vi.runAllTimersAsync()
    const session = await pending

    expect(session.user.tier).toBe("free")
    expect(hasPlanUpgradePendingRefresh()).toBe(true)
    const refreshCalls = fetchMock.mock.calls.filter(
      (call) => call[0] === "/v1/auth/refresh"
    )
    expect(refreshCalls).toHaveLength(1)
  })
})
