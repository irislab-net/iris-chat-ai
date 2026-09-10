import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from "@/lib/api/client"
import { requestPaperTradeDecision } from "@/lib/iris-paper-trade/request"
import { PAPER_TRADE_TOOLS } from "@/lib/iris-paper-trade/schema"
import type { MarketContextPacket } from "@/lib/iris-paper-trade/types"

const mockedFetch = vi.mocked(apiFetch)

function packet(): MarketContextPacket {
  const asOf = Date.now()
  return {
    asOf,
    asOfIso: new Date(asOf).toISOString(),
    symbol: "ETH",
    timeframe: "15m",
    live: { price: 1850, barTime: asOf, source: "hyperliquid" },
    trend: {
      bars: 3,
      closeFirst: 1840,
      closeLast: 1850,
      changePct: 0.5,
      recentCloses: [1840, 1845, 1850],
    },
    volatility: { rangePct: 1, atrPct: 0.8 },
    insight: null,
    models: null,
    news: { ethSummary: null, items: [] },
  }
}

describe("requestPaperTradeDecision", () => {
  beforeEach(() => {
    mockedFetch.mockReset()
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        session_id: "sess-1",
        output_text: "",
        tool_calls: [],
      }),
    } as Response)
  })

  it("sends paper-trade tools without leaking model instructions into message", async () => {
    const userMessage = "Scan live ETH and propose a paper trade if valid."
    await requestPaperTradeDecision({
      userMessage,
      packet: packet(),
      conversationId: "sess-1",
      history: [],
    })

    expect(mockedFetch).toHaveBeenCalledOnce()
    const body = JSON.parse(String(mockedFetch.mock.calls[0]?.[1]?.body))
    expect(body.message).toContain(userMessage)
    expect(body.message).not.toContain("You are IRIS evaluating ONE user-initiated")
    expect(body.instructions).toContain("open_paper_trade")
    expect(body.tools).toEqual(PAPER_TRADE_TOOLS)
    expect(body.tool_choice).toBe("required")
    expect(body.parallel_tool_calls).toBe(false)
  })
})
