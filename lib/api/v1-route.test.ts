import { afterEach, describe, expect, it, vi } from "vitest"

import { handleV1ApiRoute } from "@/lib/api/v1-route"

vi.mock("@/lib/api/chat-route", () => ({
  handleChatApiRoute: vi.fn(async () =>
    Response.json({ route: "chat" }, { status: 200 })
  ),
}))

vi.mock("@/lib/api/trading-route", () => ({
  handleTradingApiRoute: vi.fn(async () =>
    Response.json({ route: "trading" }, { status: 200 })
  ),
}))

vi.mock("@/lib/api/iris-api-route", () => ({
  proxyIrisApiRequest: vi.fn(async (_req: Request, path: string) =>
    Response.json({ route: "proxy", path }, { status: 200 })
  ),
}))

import { handleChatApiRoute } from "@/lib/api/chat-route"
import { proxyIrisApiRequest } from "@/lib/api/iris-api-route"
import { handleTradingApiRoute } from "@/lib/api/trading-route"

describe("handleV1ApiRoute", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("routes chat requests to the chat handler", async () => {
    await handleV1ApiRoute(new Request("https://chat.exur.ai/v1/chat/message"), [
      "chat",
      "message",
    ])

    expect(handleChatApiRoute).toHaveBeenCalledWith(
      expect.any(Request),
      "/v1/chat/message"
    )
    expect(handleTradingApiRoute).not.toHaveBeenCalled()
    expect(proxyIrisApiRequest).not.toHaveBeenCalled()
  })

  it("routes trading requests to the trading handler", async () => {
    await handleV1ApiRoute(
      new Request("https://chat.exur.ai/v1/trading/hyperliquid/controls"),
      ["trading", "hyperliquid", "controls"]
    )

    expect(handleTradingApiRoute).toHaveBeenCalledWith(
      expect.any(Request),
      "/v1/trading/hyperliquid/controls"
    )
    expect(proxyIrisApiRequest).not.toHaveBeenCalled()
  })

  it("routes entitlements and wallets to the trading handler", async () => {
    await handleV1ApiRoute(new Request("https://chat.exur.ai/v1/entitlements"), [
      "entitlements",
    ])
    await handleV1ApiRoute(new Request("https://chat.exur.ai/v1/wallets"), ["wallets"])

    expect(handleTradingApiRoute).toHaveBeenCalledTimes(2)
    expect(proxyIrisApiRequest).not.toHaveBeenCalled()
  })

  it("proxies news, insight, auth, payments, and wishlist", async () => {
    const cases = [
      ["news", "home"],
      ["news", "latest"],
      ["insight", "home"],
      ["auth", "refresh"],
      ["payments", "invoices"],
      ["wishlist"],
      ["me"],
    ] as const

    for (const segments of cases) {
      await handleV1ApiRoute(
        new Request(`https://chat.exur.ai/v1/${segments.join("/")}`),
        [...segments]
      )
    }

    expect(proxyIrisApiRequest).toHaveBeenCalledTimes(cases.length)
    expect(proxyIrisApiRequest).toHaveBeenCalledWith(
      expect.any(Request),
      "/v1/news/home"
    )
    expect(proxyIrisApiRequest).toHaveBeenCalledWith(
      expect.any(Request),
      "/v1/wishlist"
    )
  })
})
