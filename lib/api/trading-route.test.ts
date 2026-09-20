import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { handleTradingApiRoute } from "@/lib/api/trading-route"

describe("handleTradingApiRoute", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    vi.stubEnv("NODE_ENV", "development")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("returns empty wallet and entitlement stubs in local dev", async () => {
    const wallets = await handleTradingApiRoute(
      new Request("https://local.exur.ai:3000/v1/wallets"),
      "/v1/wallets"
    )
    const entitlements = await handleTradingApiRoute(
      new Request("https://local.exur.ai:3000/v1/entitlements"),
      "/v1/entitlements"
    )

    expect(wallets.status).toBe(200)
    expect(await wallets.json()).toEqual({ data: { wallets: [] } })
    expect(entitlements.status).toBe(200)
    expect(await entitlements.json()).toEqual({ data: { entitlements: [] } })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("proxies to IRIS_API_ORIGIN in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { wallets: [{ id: "w1" }] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )

    const res = await handleTradingApiRoute(
      new Request("https://intel.exur.ai/v1/wallets", {
        headers: { authorization: "Bearer test-token" },
      }),
      "/v1/wallets"
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.exur.ai/v1/wallets",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      })
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { wallets: [{ id: "w1" }] } })
  })
})
