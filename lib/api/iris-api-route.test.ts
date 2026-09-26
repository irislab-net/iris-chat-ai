import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { proxyIrisApiRequest } from "@/lib/api/iris-api-route"

describe("proxyIrisApiRequest", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("forwards cookies and POST body to IRIS_API_ORIGIN", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "tok", expires_at: "2099" }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    )

    const res = await proxyIrisApiRequest(
      new Request("https://chat.exur.ai/v1/auth/refresh", {
        method: "POST",
        headers: {
          cookie: "refresh_token=abc",
          "content-type": "application/json",
        },
        body: "{}",
      }),
      "/v1/auth/refresh"
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.exur.ai/v1/auth/refresh",
      expect.objectContaining({
        method: "POST",
        body: "{}",
      })
    )
    const upstreamInit = fetchMock.mock.calls[0][1] as RequestInit
    expect((upstreamInit.headers as Headers).get("cookie")).toBe(
      "refresh_token=abc"
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      access_token: "tok",
      expires_at: "2099",
    })
  })

  it("short-circuits refresh without a refresh_token cookie", async () => {
    const res = await proxyIrisApiRequest(
      new Request("https://chat.exur.ai/v1/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
      "/v1/auth/refresh"
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(res.status).toBe(204)
  })

  it("proxies news requests to IRIS_API_ORIGIN", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )

    const res = await proxyIrisApiRequest(
      new Request("https://chat.exur.ai/v1/news/latest"),
      "/v1/news/latest"
    )

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.exur.ai/v1/news/latest",
      expect.objectContaining({ method: "GET" })
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [] })
  })

  it("proxies payment invoice requests to IRIS_API_ORIGIN", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ invoices: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )

    const res = await proxyIrisApiRequest(
      new Request("https://chat.exur.ai/v1/payments/invoices", {
        headers: { authorization: "Bearer access-token" },
      }),
      "/v1/payments/invoices"
    )

    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api.exur.ai/v1/payments/invoices",
      expect.objectContaining({ method: "GET" })
    )
    const upstreamInit = fetchMock.mock.calls.at(-1)?.[1] as RequestInit
    expect((upstreamInit.headers as Headers).get("authorization")).toBe(
      "Bearer access-token"
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ invoices: [] })
  })
})
