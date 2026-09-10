import { beforeEach, describe, expect, it } from "vitest"

import { emptyPaperState } from "@/lib/paper-trading/engine"
import { replacePaperState } from "@/lib/paper-trading/store"
import { PaperTradingAdapter } from "@/lib/trading/paper-adapter"

describe("PaperTradingAdapter", () => {
  beforeEach(() => replacePaperState(emptyPaperState()))

  it("normalizes paper account, position, fills, and history into the trading contract", async () => {
    const adapter = new PaperTradingAdapter()
    const opened = await adapter.placeOrder({
      symbol: "ETH",
      side: "BUY",
      type: "MARKET",
      quantity: "1",
      referencePrice: "2000",
      leverage: 5,
      marginMode: "CROSS",
      stopLoss: "1900",
      takeProfit: "2200",
    })

    expect(opened.ok).toBe(true)
    expect(adapter.getCapabilities().canTrade).toBe(true)
    expect(adapter.getAccount().providerId).toBe("paper")
    expect(adapter.getPositions()).toHaveLength(1)
    expect(adapter.getPositions()[0]).toMatchObject({
      symbol: "ETH",
      side: "LONG",
      quantity: "1",
      stopLoss: "1900",
      takeProfit: "2200",
    })
    expect(Number(adapter.getPositions()[0]?.entryPrice)).toBeCloseTo(2000, 0)
    expect(adapter.getPositions()[0]?.leverage.value).toBe(5)
    expect(adapter.getFills()).toHaveLength(1)
    expect(typeof adapter.getFills()[0]?.price).toBe("string")

    const position = adapter.getPositions()[0]!
    const leverage = await adapter.updateLeverage(position.id, 10)
    expect(leverage.ok).toBe(true)
    expect(adapter.getPositions()[0]?.leverage.value).toBe(10)

    const protectedPosition = await adapter.updatePositionProtection(position.id, {
      stopLoss: "1950",
      takeProfit: "2300",
    })
    expect(protectedPosition.ok).toBe(true)
    expect(adapter.getPositions()[0]).toMatchObject({
      stopLoss: "1950",
      takeProfit: "2300",
    })

    adapter.reconcileMarket({
      symbol: "ETH",
      intervalMs: 60_000,
      bars: [
        {
          t: Date.now() + 60_000,
          o: 2000,
          h: 2060,
          l: 1990,
          c: 2050,
        },
      ],
    })
    expect(Number(adapter.getPositions()[0]?.markPrice)).toBeCloseTo(2050)

    const closed = await adapter.closePosition(position.id, "2100")
    expect(closed.ok).toBe(true)
    expect(adapter.getPositions()).toHaveLength(0)
    expect(adapter.getHistory()[0]).toMatchObject({
      symbol: "ETH",
      side: "LONG",
      reason: "MANUAL",
    })
    expect(Number(adapter.getHistory()[0]?.exitPrice)).toBeCloseTo(2100, 0)
  })

  it("can hold concurrent paper positions across ETH and BTC", async () => {
    const adapter = new PaperTradingAdapter()
    const eth = await adapter.placeOrder({
      symbol: "ETH",
      side: "BUY",
      type: "MARKET",
      quantity: "1",
      referencePrice: "2000",
      leverage: 5,
      marginMode: "CROSS",
    })
    const btc = await adapter.placeOrder({
      symbol: "BTC",
      side: "SELL",
      type: "MARKET",
      quantity: "0.1",
      referencePrice: "60000",
      leverage: 5,
      marginMode: "CROSS",
    })

    expect(eth.ok).toBe(true)
    expect(btc.ok).toBe(true)
    expect(adapter.getPositions()).toHaveLength(2)
    expect(adapter.getPositions().map((p) => p.symbol).sort()).toEqual(["BTC", "ETH"])
  })

  it("supports the generic open-order modify and cancel lifecycle", async () => {
    const adapter = new PaperTradingAdapter()
    const placed = await adapter.placeOrder({
      symbol: "ETH",
      side: "BUY",
      type: "LIMIT",
      quantity: "1",
      price: "1900",
      referencePrice: "2000",
      leverage: 5,
      marginMode: "CROSS",
    })

    expect(placed.ok).toBe(true)
    expect(adapter.getOpenOrders()).toHaveLength(1)
    const orderId = adapter.getOpenOrders()[0]!.id

    const modified = await adapter.modifyOrder(orderId, {
      quantity: "2",
      price: "1850",
    })
    expect(modified.ok).toBe(true)
    expect(adapter.getOpenOrders()[0]).toMatchObject({
      quantity: "2",
      price: "1850",
      status: "OPEN",
    })

    const cancelled = await adapter.cancelOrder(orderId)
    expect(cancelled.ok).toBe(true)
    expect(adapter.getOpenOrders()).toHaveLength(0)
    if (cancelled.ok) expect(cancelled.order?.status).toBe("CANCELLED")
  })
})
