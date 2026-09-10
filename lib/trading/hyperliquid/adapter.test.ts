import { beforeEach, describe, expect, it, vi } from "vitest"

import { HyperliquidTradingAdapter } from "@/lib/trading/hyperliquid/adapter"
import type {
  HyperliquidRawSnapshot,
  HyperliquidReadOnlyTransport,
  HyperliquidStreamHandlers,
} from "@/lib/trading/hyperliquid/transport"

const ADDRESS = "0x1111111111111111111111111111111111111111"

function validRawSnapshot(): HyperliquidRawSnapshot {
  return {
    metaAndAssetContexts: [
      {
        universe: [
          { name: "ETH", szDecimals: 4, maxLeverage: 50 },
          { name: "OLD", szDecimals: 2, maxLeverage: 3, isDelisted: true },
        ],
      },
      [],
    ],
    clearinghouseState: {
      marginSummary: {
        accountValue: "1000.5",
        totalMarginUsed: "100.25",
      },
      withdrawable: "900.25",
      assetPositions: [
        {
          position: {
            coin: "ETH",
            szi: "2",
            entryPx: "1900",
            positionValue: "4000",
            unrealizedPnl: "200",
            leverage: { type: "cross", value: 5 },
            maxLeverage: 50,
            marginUsed: "800",
            liquidationPx: "1000",
          },
        },
      ],
    },
    openOrders: [
      {
        coin: "ETH",
        oid: 42,
        side: "B",
        orderType: "Limit",
        origSz: "5",
        sz: "2",
        limitPx: "1800",
        reduceOnly: false,
        timestamp: 1_700_000_000_000,
      },
    ],
    fills: [
      {
        coin: "ETH",
        oid: 40,
        tid: 99,
        side: "B",
        sz: "1",
        px: "1900",
        fee: "0.2",
        feeToken: "USDC",
        closedPnl: "0",
        time: 1_699_999_999_000,
      },
    ],
  }
}

class FakeTransport implements HyperliquidReadOnlyTransport {
  handlers: HyperliquidStreamHandlers | null = null
  fetchSnapshot = vi.fn(async () => validRawSnapshot())

  subscribe(_address: string, handlers: HyperliquidStreamHandlers): () => void {
    this.handlers = handlers
    return () => {
      this.handlers = null
    }
  }
}

describe("HyperliquidTradingAdapter", () => {
  let transport: FakeTransport

  beforeEach(() => {
    transport = new FakeTransport()
  })

  it("normalizes account, markets, positions, open orders, and fills", async () => {
    const adapter = new HyperliquidTradingAdapter(ADDRESS, transport, () => 1234)
    await adapter.initialize()

    expect(adapter.getCapabilities()).toMatchObject({
      canTrade: false,
      canCancelOrders: false,
      canUpdateLeverage: false,
    })
    expect(adapter.getMarkets()).toEqual([
      expect.objectContaining({ symbol: "ETH", status: "ACTIVE", maxLeverage: 50 }),
      expect.objectContaining({ symbol: "OLD", status: "UNAVAILABLE" }),
    ])
    expect(adapter.getAccount()).toMatchObject({
      providerId: "hyperliquid",
      accountId: ADDRESS,
      status: "READY",
      equity: "1000.5",
      availableBalance: "900.25",
      initialMarginUsed: "100.25",
      updatedAt: 1234,
    })
    expect(adapter.getPositions()[0]).toMatchObject({
      id: "hl:ETH",
      symbol: "ETH",
      side: "LONG",
      quantity: "2",
      entryPrice: "1900",
      markPrice: "2000",
      unrealizedPnl: "200",
      liquidationPrice: "1000",
      source: "EXTERNAL",
    })
    expect(adapter.getOpenOrders()[0]).toMatchObject({
      id: "hl:42",
      exchangeOrderId: "42",
      side: "BUY",
      status: "PARTIALLY_FILLED",
      quantity: "5",
      filledQuantity: "3",
    })
    expect(adapter.getFills()[0]).toMatchObject({
      id: "hl:99",
      orderId: "hl:40",
      exchangeTradeId: "99",
      realizedPnl: "0",
    })
    adapter.dispose()
  })

  it("reports an unavailable API without inventing account data", async () => {
    transport.fetchSnapshot.mockRejectedValueOnce(new Error("offline"))
    const adapter = new HyperliquidTradingAdapter(ADDRESS, transport)
    await adapter.initialize()

    expect(adapter.getAccount()).toMatchObject({
      status: "ERROR",
      equity: null,
      availableBalance: null,
      balances: [],
    })
    adapter.dispose()
  })

  it("rejects malformed responses and preserves an explicit error state", async () => {
    transport.fetchSnapshot.mockResolvedValueOnce({
      ...validRawSnapshot(),
      clearinghouseState: { assetPositions: "not-an-array" },
    })
    const adapter = new HyperliquidTradingAdapter(ADDRESS, transport)
    await adapter.initialize()
    expect(adapter.getAccount().status).toBe("ERROR")
    adapter.dispose()
  })

  it("marks last-known data stale after websocket disconnect or age threshold", async () => {
    let now = 1_000
    const adapter = new HyperliquidTradingAdapter(
      ADDRESS,
      transport,
      () => now,
      500
    )
    await adapter.initialize()
    expect(adapter.getAccount().status).toBe("READY")

    transport.handlers?.onStatus("DISCONNECTED")
    expect(adapter.getAccount().status).toBe("STALE")

    await adapter.initialize()
    now = 2_000
    adapter.evaluateStaleness()
    expect(adapter.getAccount().status).toBe("STALE")
    adapter.dispose()
  })

  it("has no executable capability and rejects every mutation locally", async () => {
    const adapter = new HyperliquidTradingAdapter(ADDRESS, transport)
    const results = await Promise.all([
      adapter.placeOrder({ symbol: "ETH", side: "BUY", type: "MARKET", quantity: "1" }),
      adapter.cancelOrder("42"),
      adapter.modifyOrder("42", { quantity: "2" }),
      adapter.closePosition("hl:ETH"),
      adapter.updateLeverage("hl:ETH", 10),
      adapter.updatePositionProtection("hl:ETH", { stopLoss: "1800" }),
    ])

    expect(results).toHaveLength(6)
    for (const result of results) {
      expect(result).toMatchObject({
        ok: false,
        error: { code: "CAPABILITY_UNAVAILABLE" },
      })
    }
    expect(transport.fetchSnapshot).not.toHaveBeenCalled()
    adapter.dispose()
  })
})
