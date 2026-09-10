import { describe, expect, it } from "vitest"

import { buildChartOverlayModel, buildExecutionMarks } from "@/lib/chart/overlay-model"
import { timeframeToTvResolution, tvResolutionToHyperliquidInterval } from "@/lib/chart/resolution"
import type { TradeDraft } from "@/lib/trading/draft"
import type { Position } from "@/lib/trading/types"

describe("chart resolution mapping", () => {
  it("maps desk timeframes to TradingView resolutions", () => {
    expect(timeframeToTvResolution("15m")).toBe("15")
    expect(timeframeToTvResolution("1h")).toBe("60")
    expect(timeframeToTvResolution("1d")).toBe("1D")
  })

  it("maps TradingView resolutions back to Hyperliquid intervals", () => {
    expect(tvResolutionToHyperliquidInterval("15")).toBe("15m")
    expect(tvResolutionToHyperliquidInterval("60")).toBe("1h")
    expect(tvResolutionToHyperliquidInterval("1D")).toBe("1d")
  })
})

describe("chart overlay model", () => {
  const position: Position = {
    id: "paper:ETH",
    symbol: "ETH",
    side: "LONG",
    quantity: "1",
    entryPrice: "2000",
    markPrice: "2050",
    unrealizedPnl: "50",
    realizedPnl: "0",
    leverage: { value: 5, max: 50 },
    marginMode: "CROSS",
    marginUsed: "400",
    isolatedMargin: null,
    liquidationPrice: "1500",
    liquidationStatus: "NONE",
    stopLoss: "1900",
    takeProfit: "2200",
    openedAt: 1_700_000_000_000,
  }

  it("builds entry, mark, SL, TP, and liquidation lines for a position", () => {
    const model = buildChartOverlayModel({
      symbol: "ETH",
      positions: [position],
      history: [],
      draft: null,
      showDraft: false,
      openPosition: position,
      liquidationPrice: 1500,
      interactive: true,
    })

    expect(model.lines.map((line) => line.id)).toEqual([
      "paper:ETH:entry",
      "paper:ETH:mark",
      "paper:ETH:liq",
      "paper:ETH:tp",
      "paper:ETH:sl",
    ])
    expect(model.lines.find((line) => line.field === "stopLoss")?.draggable).toBe(true)
    expect(model.lines.some((line) => line.kind === "average-entry")).toBe(true)
  })

  it("builds draft overlays before submit", () => {
    const draft: TradeDraft = {
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      stopLoss: 1900,
      takeProfit: 2200,
    }

    const model = buildChartOverlayModel({
      symbol: "ETH",
      positions: [],
      history: [],
      draft,
      showDraft: true,
      openPosition: null,
      interactive: true,
    })

    expect(model.lines.some((line) => line.id === "draft:entry")).toBe(true)
    expect(model.lines.some((line) => line.id === "draft:sl")).toBe(true)
  })

  it("builds execution marks for opens and closes", () => {
    const marks = buildExecutionMarks(
      [position],
      [
        {
          id: "hist-1",
          positionId: "paper:ETH",
          symbol: "ETH",
          side: "LONG",
          quantity: "1",
          entryPrice: "2000",
          exitPrice: "2100",
          realizedPnl: "100",
          openedAt: 1_700_000_000_000,
          closedAt: 1_700_000_600_000,
          reason: "MANUAL",
        },
      ],
      "ETH"
    )

    expect(marks.length).toBeGreaterThanOrEqual(3)
    expect(marks.some((mark) => mark.text === "B")).toBe(true)
    expect(marks.some((mark) => mark.text === "X")).toBe(true)
  })
})
