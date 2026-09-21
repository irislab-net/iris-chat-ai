import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MarketContextPacket } from "@/lib/iris-paper-trade/types"
import { BTC_SIGNAL_SAMPLE_PROMPT } from "@/lib/iris-paper-trade/signal-prompts"

vi.mock("@/lib/iris-paper-trade/build-context", () => ({
  buildMarketContextPacket: vi.fn(),
}))

vi.mock("@/lib/iris-paper-trade/request", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/iris-paper-trade/request")>()
  return {
    ...actual,
    requestPaperTradeDecision: vi.fn(),
  }
})

import { buildMarketContextPacket } from "@/lib/iris-paper-trade/build-context"
import { requestPaperTradeDecision } from "@/lib/iris-paper-trade/request"
import { runIrisPaperTradeRequest } from "@/lib/iris-paper-trade/run"

const mockedBuild = vi.mocked(buildMarketContextPacket)
const mockedRequest = vi.mocked(requestPaperTradeDecision)

function livePacket(price: number): MarketContextPacket {
  const asOf = Date.now()
  return {
    asOf,
    asOfIso: new Date(asOf).toISOString(),
    symbol: "ETH",
    timeframe: "15m",
    live: { price, barTime: asOf, source: "hyperliquid" },
    trend: {
      bars: 3,
      closeFirst: price - 10,
      closeLast: price,
      changePct: (10 / (price - 10)) * 100,
      recentCloses: [price - 10, price - 4, price],
    },
    volatility: { rangePct: 1.2, atrPct: 0.8 },
    insight: {
      stance: "LONG",
      bias: "BULLISH",
      headline: "ETH leans long",
      calmness: "calm",
      rewardRisk: 2,
      expectedMovePct: 1.2,
      generatedAt: asOf,
    },
    models: {
      long: { p: 0.7, edge: 0.1, signal: true },
      short: { p: 0.3, edge: -0.2, signal: false },
      breakout: { p: 0.5, edge: 0, signal: false },
      fast: { p: 0.55, edge: 0.02, signal: true },
    },
    news: {
      ethSummary: null,
      items: [
        {
          title: "Headline",
          impact: 8,
          sentiment: 0.4,
          publishedAt: asOf,
        },
      ],
    },
  }
}

describe("runIrisPaperTradeRequest propose", () => {
  beforeEach(() => {
    mockedBuild.mockReset()
    mockedRequest.mockReset()
  })

  it("proposes a ticket without opening a position", async () => {
    const mark = 1850
    const packet = livePacket(mark)
    mockedBuild.mockResolvedValue({ ok: true, packet })
    mockedRequest.mockResolvedValue({
      message: "",
      tool_calls: [
        {
          function: {
            name: "open_paper_trade",
            arguments: JSON.stringify({
              symbol: "ETH",
              direction: "LONG",
              setup: "Dip hold",
              stopLoss: mark * 0.985,
              takeProfit: mark * 1.03,
              leverage: 5,
              thesis: "Stance and models favor upside.",
            }),
          },
        },
      ],
    })

    const result = await runIrisPaperTradeRequest({
      userMessage: "propose a paper trade",
      conversationId: "c1",
      history: [],
    })

    expect(result.status).toBe("proposed")
    if (result.status !== "proposed") return
    expect(result.ticket.side).toBe("LONG")
    expect(result.ticket.stopLoss).toBeLessThan(mark)
    expect(result.ticket.takeProfit).toBeGreaterThan(mark)
    expect(result.message).toContain("Exur setup")
  })

  it("falls back when the API returns unknown-tool failure prose", async () => {
    const mark = 2484.3
    const packet = livePacket(mark)
    packet.insight = {
      stance: "WAIT",
      bias: "SHORT",
      headline: "Short signal",
      calmness: "calm",
      rewardRisk: 5.5,
      expectedMovePct: 1.29,
      generatedAt: packet.asOf,
    }
    packet.models = {
      long: { p: 0.31, edge: -0.35, signal: true },
      short: { p: 0.76, edge: 0.07, signal: true },
      breakout: { p: 0.62, edge: -0.17, signal: true },
      fast: { p: 0.61, edge: -0.12, signal: true },
    }
    packet.volatility = { rangePct: 0.012, atrPct: 0.002 }

    mockedBuild.mockResolvedValue({ ok: true, packet })
    mockedRequest.mockResolvedValue({
      message:
        "I am unable to execute the open_paper_trade function. It appears to be an unknown tool.",
      tool_calls: [],
    })

    const result = await runIrisPaperTradeRequest({
      userMessage: BTC_SIGNAL_SAMPLE_PROMPT,
      conversationId: "c1",
      history: [],
    })

    expect(result.status).toBe("proposed")
    if (result.status !== "proposed") return
    expect(result.message).toContain("Exur setup")
  })

  it("falls back to a deterministic setup when the API returns tool failure prose", async () => {
    const mark = 2484.3
    const packet = livePacket(mark)
    packet.insight = {
      stance: "WAIT",
      bias: "SHORT",
      headline: "Short signal",
      calmness: "calm",
      rewardRisk: 5.5,
      expectedMovePct: 1.29,
      generatedAt: packet.asOf,
    }
    packet.models = {
      long: { p: 0.31, edge: -0.35, signal: true },
      short: { p: 0.76, edge: 0.07, signal: true },
      breakout: { p: 0.62, edge: -0.17, signal: true },
      fast: { p: 0.61, edge: -0.12, signal: true },
    }
    packet.volatility = { rangePct: 0.012, atrPct: 0.002 }

    mockedBuild.mockResolvedValue({ ok: true, packet })
    mockedRequest.mockResolvedValue({
      message:
        "I am unable to execute the `open_paper_trade` function. It appears there is an issue with the tool.",
      tool_calls: [],
    })

    const result = await runIrisPaperTradeRequest({
      userMessage: BTC_SIGNAL_SAMPLE_PROMPT,
      conversationId: "c1",
      history: [],
    })

    expect(result.status).toBe("proposed")
    if (result.status !== "proposed") return
    expect(result.ticket.side).toBe("SHORT")
    expect(result.ticket.symbol).toBe("ETH")
    expect(result.message).toContain("Exur setup")
  })
})
