import { describe, expect, it } from "vitest"

import type { InsightSummary } from "@/lib/api/types"
import {
  SIGNAL_TO_PAPER_PREFILL_BLOCKED_BY_SETUP_CONTRACT,
  evaluatePaperTradePrefill,
  insightToPaperTradeSource,
  isActionablePaperSource,
  paperTicketPrefillFromSource,
} from "@/lib/paper-trading/source"

const summary: InsightSummary = {
  id: 42,
  generated_at: 1_700_000_000,
  created_at: 1_700_000_000,
  symbol: "ETH",
  timeframe: "15m",
  stance: "LONG",
  bias: "BULLISH",
  headline: "ETH leans long",
  explanation: "Models favor upside.",
  calmness_label: "Quiet",
  reward_risk_ratio: 2,
  expected_move_pct: 1.2,
}

describe("paper trade source gate (Class C)", () => {
  it("documents setup-contract block", () => {
    expect(SIGNAL_TO_PAPER_PREFILL_BLOCKED_BY_SETUP_CONTRACT).toBe(true)
  })

  it("maps insight to context-only source without ticket fields", () => {
    const src = insightToPaperTradeSource(summary)
    expect(src.sourceType).toBe("IRIS_CONTEXT")
    expect(src.marketId).toBe("ETH")
    expect(src.stance).toBe("LONG")
    expect(src.side).toBeUndefined()
    expect(src.entryPrice).toBeUndefined()
    expect(src.stopLoss).toBeUndefined()
    expect(src.takeProfit).toBeUndefined()
  })

  it("never treats insight context as actionable", () => {
    const src = insightToPaperTradeSource(summary)
    expect(isActionablePaperSource(src)).toBe(false)
    const cap = evaluatePaperTradePrefill(src)
    expect(cap.blocked).toBe(true)
    expect(cap.reason).toContain("SIGNAL_TO_PAPER_PREFILL_BLOCKED_BY_SETUP_CONTRACT")
    expect(paperTicketPrefillFromSource(src)).toEqual({})
  })

  it("does not unlock prefill even if a future setup-shaped object is passed while gate is on", () => {
    expect(
      isActionablePaperSource({
        sourceType: "IRIS_SETUP",
        marketId: "ETH",
        side: "long",
        entryPrice: 100,
        stopLoss: 95,
        takeProfit: 110,
      })
    ).toBe(false)
  })

  it("does not treat IRIS_AI execution metadata as ticket prefill", () => {
    expect(
      isActionablePaperSource({
        sourceType: "IRIS_AI",
        marketId: "ETH",
        side: "long",
        entryPrice: 1850,
        stopLoss: 1800,
        takeProfit: 1900,
      })
    ).toBe(false)
    expect(
      evaluatePaperTradePrefill({
        sourceType: "IRIS_AI",
        marketId: "ETH",
      }).blocked
    ).toBe(true)
  })
})
