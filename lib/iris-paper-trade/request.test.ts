import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api/co-pilot", () => ({
  sendCoPilotChat: vi.fn(),
}))

import { sendCoPilotChat } from "@/lib/api/co-pilot"
import { requestPaperTradeDecision } from "@/lib/iris-paper-trade/request"
import { PAPER_TRADE_TOOLS } from "@/lib/iris-paper-trade/schema"
import type { MarketContextPacket } from "@/lib/iris-paper-trade/types"

const mockedSend = vi.mocked(sendCoPilotChat)

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
    mockedSend.mockReset()
    mockedSend.mockResolvedValue({
      session_id: "sess-1",
      output_text: "",
      tool_calls: [],
    })
  })

  it("sends paper-trade tools without leaking MARKET_CONTEXT into message", async () => {
    const userMessage = "Scan live ETH and propose a paper trade if valid."
    await requestPaperTradeDecision({
      userMessage,
      packet: packet(),
      conversationId: "sess-1",
      history: [],
    })

    expect(mockedSend).toHaveBeenCalledOnce()
    const call = mockedSend.mock.calls[0]?.[0]
    expect(call?.message).toBe(userMessage)
    expect(call?.message).not.toContain("MARKET_CONTEXT")
    expect(call?.message).not.toContain(
      "You are IRIS evaluating ONE user-initiated"
    )
    expect(call?.instructions).toContain("open_paper_trade")
    expect(call?.instructions).toContain("MARKET_CONTEXT")
    expect(call?.clientContext).toMatchObject({
      active_page: "chat",
      active_symbol: "",
      available_ui_actions: ["show_trade_signal"],
    })
    const timezone = call?.clientContext?.timezone
    if (timezone != null) {
      expect(timezone).toMatch(/^[+-]\d{2}:\d{2}$/)
    }
    expect(call?.tools).toEqual(PAPER_TRADE_TOOLS)
    expect(call?.toolChoice).toBe("required")
    expect(call?.parallelToolCalls).toBe(false)
  })
})
