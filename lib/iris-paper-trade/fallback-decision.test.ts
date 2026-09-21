import { describe, expect, it } from "vitest"

import { synthesizePaperDecisionFromContext } from "@/lib/iris-paper-trade/fallback-decision"
import { planIrisPaperTrade } from "@/lib/iris-paper-trade/plan"
import type { MarketContextPacket } from "@/lib/iris-paper-trade/types"

function ethPacket(): MarketContextPacket {
  const asOf = Date.now()
  return {
    asOf,
    asOfIso: new Date(asOf).toISOString(),
    symbol: "ETH",
    timeframe: "15m",
    live: { price: 2484.3, barTime: asOf - 8 * 60_000, source: "hyperliquid" },
    trend: {
      bars: 24,
      closeFirst: 2487.4,
      closeLast: 2484.3,
      changePct: -0.124628,
      recentCloses: [2482.1, 2483, 2484.3, 2483.6, 2488.6, 2484.9, 2484, 2484.3],
    },
    volatility: { rangePct: 0.012398, atrPct: 0.001915 },
    insight: {
      stance: "WAIT",
      bias: "SHORT",
      headline: "ETH short signal fires but meta confidence is too low; stand aside.",
      calmness: "calm",
      rewardRisk: 5.5,
      expectedMovePct: 1.29,
      generatedAt: asOf - 7 * 24 * 60 * 60_000,
    },
    models: {
      long: { p: 0.314628, edge: -0.355372, signal: true },
      short: { p: 0.755027, edge: 0.065027, signal: true },
      breakout: { p: 0.61696, edge: -0.17304, signal: true },
      fast: { p: 0.613202, edge: -0.116798, signal: true },
    },
    news: {
      ethSummary: null,
      items: [
        {
          title: "Trezor Adopts ERC-7730 Clear Signing Standard",
          impact: 4.5,
          sentiment: 0.3,
          publishedAt: asOf - 46 * 60_000,
        },
      ],
    },
  }
}

describe("synthesizePaperDecisionFromContext", () => {
  it("proposes a SHORT when short model and bias dominate", () => {
    const decision = synthesizePaperDecisionFromContext(ethPacket())
    expect(decision).not.toBeNull()
    if (!decision || decision.action !== "OPEN_PAPER_TRADE") return

    expect(decision.args.direction).toBe("SHORT")
    expect(decision.args.symbol).toBe("ETH")
    expect(decision.args.stopLoss).toBeGreaterThan(2484.3)
    expect(decision.args.takeProfit).toBeLessThan(2484.3)
    expect(decision.args.thesis).toContain("Short model")
  })

  it("passes engine validation for the synthesized ETH short", () => {
    const packet = ethPacket()
    const decision = synthesizePaperDecisionFromContext(packet)
    expect(decision).not.toBeNull()
    if (!decision) return

    const planned = planIrisPaperTrade({
      decision,
      context: packet,
      now: packet.asOf,
    })
    expect(planned.status).toBe("ready")
    if (planned.status !== "ready") return
    expect(planned.side).toBe("SHORT")
    expect(planned.quantity).toBeGreaterThan(0)
  })
})
