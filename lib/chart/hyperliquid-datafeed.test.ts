import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import { HyperliquidChartDatafeed } from "@/lib/chart/hyperliquid-datafeed"
import type { ChartExecutionMark } from "@/lib/chart/types"

vi.mock("@/lib/api/candles", () => ({
  hyperliquidCoin: (symbol: string) => (symbol === "ETH" ? "ETH" : null),
  fetchHyperliquidCandles: vi.fn(async () => [
    { t: 1_700_000_000_000, o: 2000, h: 2010, l: 1990, c: 2005 },
  ]),
  subscribeHyperliquidCandles: vi.fn(() => () => undefined),
}))

describe("HyperliquidChartDatafeed", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("exposes supported resolutions on ready", async () => {
    const datafeed = new HyperliquidChartDatafeed(() => [])
    const config = await new Promise<{ supported_resolutions: string[] }>((resolve) => {
      datafeed.onReady(resolve)
      vi.runAllTimers()
    })
    expect(config.supported_resolutions).toContain("15")
  })

  it("updates marks provider without recreating datafeed", () => {
    const marks: ChartExecutionMark[] = [
      {
        id: "m1",
        time: 100,
        color: "#fff",
        text: "B",
        label: "Buy",
        labelFontColor: "#000",
        minSize: 10,
      },
    ]
    const datafeed = new HyperliquidChartDatafeed(() => [])
    datafeed.setMarksProvider(() => marks)

    let result: ChartExecutionMark[] = []
    datafeed.getMarks(
      {
        name: "ETH",
        ticker: "ETH",
        description: "",
        type: "crypto",
        session: "24x7",
        timezone: "Etc/UTC",
        exchange: "Hyperliquid",
        listed_exchange: "Hyperliquid",
        format: "price",
        minmov: 1,
        pricescale: 100,
        has_intraday: true,
        has_daily: true,
        has_weekly_and_monthly: true,
        supported_resolutions: ["15"],
        volume_precision: 4,
        data_status: "streaming",
      },
      0,
      200,
      (items) => {
        result = items
      },
      "15"
    )
    vi.runAllTimers()
    expect(result).toHaveLength(1)
  })
})
