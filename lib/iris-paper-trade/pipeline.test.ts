import { beforeEach, describe, expect, it } from "vitest"

import type { CandleBar } from "@/lib/api/candles"
import type { InsightHome, NewsHome } from "@/lib/api/types"
import { assembleMarketContext, serializeMarketContextForLlm } from "@/lib/iris-paper-trade/market-context"
import { isPaperTradeIntent } from "@/lib/iris-paper-trade/intent"
import { parsePaperDecision } from "@/lib/iris-paper-trade/parse"
import { PAPER_TRADE_TOOLS } from "@/lib/iris-paper-trade/schema"
import { planIrisPaperTrade } from "@/lib/iris-paper-trade/plan"
import { executeIrisPaperPlan } from "@/lib/iris-paper-trade/execute"
import { confirmIrisPaperProposal } from "@/lib/iris-paper-trade/run"
import { IRIS_SAMPLE_PROMPTS, PAPER_TRADE_SAMPLE_PROMPT, PAPER_TRADE_SAMPLE_PROMPT_EN_LEGACY, PAPER_TRADE_SAMPLE_PROMPT_EN_PREV, PAPER_TRADE_SAMPLE_PROMPT_FA } from "@/lib/iris-paper-trade/types"
import { calculateRiskBasedSize, PAPER_AI_RISK_FRACTION } from "@/lib/iris-paper-trade/size"
import {
  emptyPaperState,
  marketFillFee,
  openPaperTrade,
} from "@/lib/paper-trading"
import {
  getPaperSnapshot,
  paperOpenTrade,
  replacePaperState,
} from "@/lib/paper-trading/store"

const NOW = 1_700_000_000_000

function bars(closes: number[]): CandleBar[] {
  return closes.map((c, i) => ({
    t: NOW - (closes.length - 1 - i) * 15 * 60_000,
    o: c,
    h: c + 2,
    l: c - 2,
    c,
  }))
}

const insight: InsightHome = {
  summary: {
    id: 1,
    generated_at: NOW / 1000,
    created_at: NOW / 1000,
    symbol: "ETH",
    timeframe: "15m",
    stance: "LONG",
    bias: "BULLISH",
    headline: "ETH leans long",
    explanation: "Models favor upside.",
    calmness_label: "Quiet",
    reward_risk_ratio: 2,
    expected_move_pct: 1.2,
  },
  predictions: [
    {
      uuid: "p1",
      market: "ETH",
      timestamp: NOW / 1000,
      created_at: NOW / 1000,
      classifiers: {
        long: {
          p: 0.62,
          p0: 0.5,
          thr: 0.55,
          margin: 0.07,
          edge: 0.12,
          policy: 1,
          signal: true,
          policy_signal: true,
        },
        short: {
          p: 0.31,
          p0: 0.5,
          thr: 0.55,
          margin: -0.19,
          edge: -0.1,
          policy: 0,
          signal: false,
          policy_signal: false,
        },
        breakout: {
          p: 0.4,
          p0: 0.5,
          thr: 0.55,
          margin: -0.1,
          edge: -0.05,
          policy: 0,
          signal: false,
          policy_signal: false,
        },
        fast: {
          p: 0.51,
          p0: 0.5,
          thr: 0.55,
          margin: 0.01,
          edge: 0.02,
          policy: 0,
          signal: false,
          policy_signal: false,
        },
      },
      geometry: { vol: 0.2, mfe: 1, mae: 0.4, rr: 2 },
    },
  ],
}

const news: NewsHome = {
  analytics: [
    {
      id: 1,
      generated_at: NOW / 1000,
      created_at: NOW / 1000,
      timeframes: {},
      ai_summaries: { eth: "ETH bid on ETF flow." },
    },
  ],
  news: [
    {
      id: "n1",
      title: "ETF inflows continue",
      summary: "Funds added ETH.",
      source: "wire",
      url: "https://example.com",
      published_at: NOW / 1000,
      metrics: {
        impact_score: 8,
        overall_sentiment: 0.4,
        assets: {
          btc: { confidence: 0, relevance: 0, score: 0 },
          eth: { confidence: 1, relevance: 1, score: 1 },
          dxy: { confidence: 0, relevance: 0, score: 0 },
          xau: { confidence: 0, relevance: 0, score: 0 },
        },
      },
    },
  ],
}

function packetAt(price: number) {
  const assembled = assembleMarketContext({
    now: NOW,
    candles: bars([price - 10, price - 4, price]),
    insight,
    news,
  })
  if (!assembled.ok) throw new Error(assembled.error)
  return assembled.packet
}

describe("IRIS paper-trade intent", () => {
  it("matches the chat sample prompt", () => {
    expect(isPaperTradeIntent(PAPER_TRADE_SAMPLE_PROMPT)).toBe(true)
    expect(isPaperTradeIntent(PAPER_TRADE_SAMPLE_PROMPT_EN_PREV)).toBe(true)
    expect(isPaperTradeIntent(PAPER_TRADE_SAMPLE_PROMPT_EN_LEGACY)).toBe(true)
    expect(isPaperTradeIntent(PAPER_TRADE_SAMPLE_PROMPT_FA)).toBe(true)
    expect(IRIS_SAMPLE_PROMPTS).toHaveLength(3)
    expect(isPaperTradeIntent(IRIS_SAMPLE_PROMPTS[0]?.text ?? "")).toBe(false)
    expect(isPaperTradeIntent(IRIS_SAMPLE_PROMPTS[1]?.text ?? "")).toBe(false)
    expect(isPaperTradeIntent(IRIS_SAMPLE_PROMPTS[2]?.text ?? "")).toBe(false)
  })

  it("does not treat a regular co-pilot question as a trade request", () => {
    expect(isPaperTradeIntent("Should I long ETH this candle?")).toBe(false)
    expect(isPaperTradeIntent("What is the news pulse?")).toBe(false)
  })
})

describe("MarketContext builder", () => {
  it("builds a compact timestamped packet from live price, candles, insight, models, news", () => {
    const assembled = assembleMarketContext({
      now: NOW,
      candles: bars([1800, 1810, 1820, 1830]),
      insight,
      news,
    })
    expect(assembled.ok).toBe(true)
    if (!assembled.ok) return
    const p = assembled.packet
    expect(p.asOf).toBe(NOW)
    expect(p.asOfIso).toBe(new Date(NOW).toISOString())
    expect(p.symbol).toBe("ETH")
    expect(p.live.price).toBe(1830)
    expect(p.live.source).toBe("hyperliquid")
    expect(p.trend.recentCloses.length).toBeGreaterThan(0)
    expect(p.insight?.stance).toBe("LONG")
    expect(p.models?.long.signal).toBe(true)
    expect(p.news.items).toHaveLength(1)
    expect(typeof p.news.items[0]?.publishedAt).toBe("number")
    expect(p.news.ethSummary).toContain("ETF")
    expect(JSON.stringify(p).length).toBeLessThan(4000)
    const llm = serializeMarketContextForLlm(p, NOW)
    expect(llm.news).toEqual({
      ethSummary: "ETH bid on ETF flow.",
      items: [
        {
          title: "ETF inflows continue",
          impact: 8,
          sentiment: 0.4,
          publishedAt: "0m ago",
        },
      ],
    })
  })

  it("fails closed without a live price", () => {
    const assembled = assembleMarketContext({
      now: NOW,
      candles: [],
      insight,
      news,
    })
    expect(assembled.ok).toBe(false)
  })
})

describe("structured paper decision parse (fail-closed)", () => {
  it("declares strict function tools with additionalProperties false", () => {
    for (const tool of PAPER_TRADE_TOOLS) {
      expect(tool.function.strict).toBe(true)
      expect(tool.function.parameters.additionalProperties).toBe(false)
    }
  })
  it("accepts a strict open_paper_trade tool call", () => {
    const parsed = parsePaperDecision({
      toolCalls: [
        {
          function: {
            name: "open_paper_trade",
            arguments: JSON.stringify({
              symbol: "ETH",
              direction: "LONG",
              setup: "Hold above range",
              stopLoss: 1800,
              takeProfit: 1900,
              leverage: 5,
              thesis: "Models and news align.",
            }),
          },
        },
      ],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.decision.action).toBe("OPEN_PAPER_TRADE")
  })

  it("accepts the /v1/chat tool_name + input shape", () => {
    const parsed = parsePaperDecision({
      toolCalls: [
        {
          tool_name: "open_paper_trade",
          execution_target: "server",
          input: JSON.stringify({
            symbol: "ETH",
            direction: "LONG",
            setup: "Hold above range",
            stopLoss: 1800,
            takeProfit: 1900,
            leverage: 5,
            thesis: "Models and news align.",
          }),
        },
      ],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.decision.action).toBe("OPEN_PAPER_TRADE")
  })

  it("accepts NO_TRADE", () => {
    const parsed = parsePaperDecision({
      message: JSON.stringify({ action: "NO_TRADE", reason: "Mixed models." }),
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.decision.action).toBe("NO_TRADE")
  })

  it("rejects free-form prose", () => {
    const parsed = parsePaperDecision({
      message: "Sure, I opened a long for you at 1830 with tight risk.",
    })
    expect(parsed.ok).toBe(false)
  })

  it("rejects extra engine-owned fields like size or fee", () => {
    const parsed = parsePaperDecision({
      toolCalls: [
        {
          function: {
            name: "open_paper_trade",
            arguments: {
              symbol: "ETH",
              direction: "LONG",
              setup: "Breakout",
              stopLoss: 1800,
              takeProfit: 1900,
              leverage: 5,
              thesis: "Go",
              size: 10,
              fee: 1.2,
            },
          },
        },
      ],
    })
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toContain("EXTRA_PROPERTIES")
  })

  it("rejects multiple tool calls", () => {
    const parsed = parsePaperDecision({
      toolCalls: [
        { function: { name: "no_trade", arguments: { reason: "A" } } },
        { function: { name: "no_trade", arguments: { reason: "B" } } },
      ],
    })
    expect(parsed.ok).toBe(false)
    if (parsed.ok) return
    expect(parsed.error).toBe("MULTIPLE_TOOL_CALLS")
  })
})

describe("IRIS paper-trade plan + engine (fail-closed)", () => {
  const context = packetAt(1850)

  it("NO_TRADE does not mutate paper state", () => {
    const state = emptyPaperState()
    const result = executeIrisPaperPlan({
      decision: { action: "NO_TRADE", args: { reason: "No setup." } },
      context,
      state,
      now: NOW,
    })
    expect(result.status).toBe("no_trade")
    expect(state.positions).toHaveLength(0)
    expect(state.fills).toHaveLength(0)
    expect(state.orders).toHaveLength(0)
  })

  it("rejects inverted LONG levels without opening", () => {
    const state = emptyPaperState()
    const result = executeIrisPaperPlan({
      decision: {
        action: "OPEN_PAPER_TRADE",
        args: {
          symbol: "ETH",
          direction: "LONG",
          setup: "Bad SL",
          stopLoss: 1900,
          takeProfit: 1800,
          leverage: 5,
          thesis: "Nope",
        },
      },
      context,
      state,
      now: NOW,
    })
    expect(result.status).toBe("rejected")
    expect(state.positions).toHaveLength(0)
  })

  it("opens a LONG with risk-based size, IRIS_AI source, fees and slippage", () => {
    const state = emptyPaperState()
    const mark = context.live.price
    const stopLoss = mark * 0.985
    const takeProfit = mark * 1.03
    const result = executeIrisPaperPlan({
      decision: {
        action: "OPEN_PAPER_TRADE",
        args: {
          symbol: "ETH",
          direction: "LONG",
          setup: "Dip hold",
          stopLoss,
          takeProfit,
          leverage: 5,
          thesis: "Stance and models favor upside.",
        },
      },
      context,
      state,
      now: NOW,
    })
    expect(result.status).toBe("opened")
    if (result.status !== "opened") return

    const { price, fee } = marketFillFee("BUY", result.quantity, mark)
    expect(result.position.source).toBe("IRIS_AI")
    expect(result.position.side).toBe("LONG")
    expect(result.position.entryPrice).toBe(price)
    expect(result.position.entryPrice).toBeGreaterThan(mark)
    expect(result.position.stopLoss).toBe(stopLoss)
    expect(result.position.takeProfit).toBe(takeProfit)
    expect(result.state.fills[0]?.fee).toBeCloseTo(fee)
    expect(result.state.account.balance).toBeLessThan(state.account.balance)

    const sized = calculateRiskBasedSize({
      state,
      side: "LONG",
      markPrice: mark,
      stopLoss,
      leverage: 5,
    })
    expect(sized.ok).toBe(true)
    if (!sized.ok) return
    expect(result.quantity).toBe(sized.quantity)
    expect(result.quantity).toBeGreaterThan(0)
    const risk = state.account.equity * PAPER_AI_RISK_FRACTION
    expect(result.quantity * Math.abs(mark - stopLoss)).toBeCloseTo(risk, 0)
  })

  it("opens a SHORT with valid SL/TP below/above live price inverted", () => {
    const state = emptyPaperState()
    const mark = context.live.price
    const result = executeIrisPaperPlan({
      decision: {
        action: "OPEN_PAPER_TRADE",
        args: {
          symbol: "ETH",
          direction: "SHORT",
          setup: "Failed break",
          stopLoss: mark * 1.015,
          takeProfit: mark * 0.97,
          leverage: 3,
          thesis: "Short model and range fade.",
        },
      },
      context,
      state,
      now: NOW,
    })
    expect(result.status).toBe("opened")
    if (result.status !== "opened") return
    expect(result.position.side).toBe("SHORT")
    expect(result.position.source).toBe("IRIS_AI")
    expect(result.position.entryPrice).toBeLessThan(mark)
    expect(result.position.stopLoss).toBeGreaterThan(mark)
    expect(result.position.takeProfit).toBeLessThan(mark)
    expect(result.state.fills[0]?.fee).toBeGreaterThan(0)
  })

  it("does not open when a position already exists", () => {
    let state = emptyPaperState()
    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 1850,
    }).state
    const planned = planIrisPaperTrade({
      decision: {
        action: "OPEN_PAPER_TRADE",
        args: {
          symbol: "ETH",
          direction: "SHORT",
          setup: "Fade",
          stopLoss: 1880,
          takeProfit: 1800,
          leverage: 3,
          thesis: "Already in.",
        },
      },
      context,
      state,
      now: NOW,
    })
    expect(planned.status).toBe("rejected")
    if (planned.status !== "rejected") return
    expect(planned.reason).toBe("EXISTING_POSITION")
  })
})

describe("confirmIrisPaperProposal", () => {
  beforeEach(() => {
    replacePaperState(emptyPaperState())
  })

  it("does not mutate paper state until confirm, then opens IRIS_AI with fees and slippage", () => {
    const mark = 1850
    const stopLoss = mark * 0.985
    const takeProfit = mark * 1.03
    const sized = calculateRiskBasedSize({
      state: emptyPaperState(),
      side: "LONG",
      markPrice: mark,
      stopLoss,
      leverage: 5,
    })
    expect(sized.ok).toBe(true)
    if (!sized.ok) return

    expect(getPaperSnapshot().positions).toHaveLength(0)

    const ticket = {
      symbol: "ETH" as const,
      side: "LONG" as const,
      quantity: sized.quantity,
      markPrice: mark,
      stopLoss,
      takeProfit,
      leverage: 5,
      setup: "Dip hold",
      thesis: "Stance and models favor upside.",
    }

    const result = confirmIrisPaperProposal(ticket)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const snap = getPaperSnapshot()
    expect(snap.positions).toHaveLength(1)
    expect(snap.positions[0]?.source).toBe("IRIS_AI")
    expect(snap.positions[0]?.side).toBe("LONG")
    const { price, fee } = marketFillFee("BUY", sized.quantity, mark)
    expect(snap.positions[0]?.entryPrice).toBe(price)
    expect(snap.positions[0]?.entryPrice).toBeGreaterThan(mark)
    expect(snap.fills[0]?.fee).toBeCloseTo(fee)
    expect(result.message).toContain("Paper trade opened")
  })

  it("rejects confirm when a position already exists", () => {
    const opened = paperOpenTrade({
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 1850,
    })
    expect(opened.ok).toBe(true)
    const before = getPaperSnapshot()

    const result = confirmIrisPaperProposal({
      symbol: "ETH",
      side: "SHORT",
      quantity: 0.4,
      markPrice: 1850,
      stopLoss: 1880,
      takeProfit: 1800,
      leverage: 3,
      setup: "Fade",
      thesis: "Already in.",
    })
    expect(result.ok).toBe(false)
    expect(getPaperSnapshot().positions).toHaveLength(before.positions.length)
  })
})
