import { describe, expect, it } from "vitest"

import { buildChartOverlayModel } from "@/lib/chart/overlay-model"
import type { Order, Position } from "@/lib/trading/types"

/** Chart overlay model must derive purely from TradingAdapter domain objects. */
describe("chart adapter independence", () => {
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

  const openOrder: Order = {
    id: "order-1",
    exchangeOrderId: null,
    clientOrderId: null,
    symbol: "ETH",
    side: "BUY",
    type: "LIMIT",
    triggerKind: "NONE",
    status: "OPEN",
    quantity: "1",
    filledQuantity: "0",
    averageFillPrice: null,
    price: "1950",
    triggerPrice: null,
    timeInForce: "GTC",
    reduceOnly: false,
    linkedPositionId: null,
    createdAt: 1,
    updatedAt: 1,
    rejectionReason: null,
  }

  it("does not require paper-specific state beyond normalized domain objects", () => {
    const model = buildChartOverlayModel({
      symbol: "ETH",
      positions: [position],
      openOrders: [openOrder],
      fills: [
        {
          id: "fill-1",
          orderId: "order-1",
          exchangeTradeId: null,
          symbol: "ETH",
          side: "BUY",
          quantity: "0.5",
          price: "2000",
          fee: "1",
          feeAsset: "USDC",
          realizedPnl: "0",
          createdAt: 1_700_000_100_000,
        },
      ],
      history: [],
      draft: null,
      showDraft: false,
      openPosition: position,
      interactive: true,
      prediction: null,
    })

    expect(model.lines.some((line) => line.kind === "open-order")).toBe(true)
    expect(model.lines.some((line) => line.kind === "average-entry")).toBe(true)
    expect(model.marks.some((mark) => mark.id.startsWith("fill:"))).toBe(true)
    expect(model.marks.some((mark) => mark.id.startsWith("open:"))).toBe(true)
  })
})
