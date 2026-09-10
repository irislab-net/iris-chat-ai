import { describe, expect, it } from "vitest"

import {
  HyperliquidProtocolError,
  mapHyperliquidAccount,
  mapHyperliquidFills,
  mapHyperliquidMarkets,
  mapHyperliquidOrders,
  mapHyperliquidPositions,
  mapHyperliquidSnapshot,
} from "@/lib/trading/hyperliquid/mapping"
import type { HyperliquidRawSnapshot } from "@/lib/trading/hyperliquid/transport"

const ADDRESS = "0x2222222222222222222222222222222222222222"

function baseSnapshot(): HyperliquidRawSnapshot {
  return {
    metaAndAssetContexts: [
      { universe: [{ name: "BTC", szDecimals: 5, maxLeverage: 40 }] },
      [],
    ],
    clearinghouseState: {
      marginSummary: { accountValue: "500", totalMarginUsed: "50" },
      withdrawable: "450",
      assetPositions: [],
    },
    openOrders: [],
    fills: [],
  }
}

describe("Hyperliquid mapping", () => {
  it("maps markets and skips delisted instruments", () => {
    const markets = mapHyperliquidMarkets([
      {
        universe: [
          { name: "ETH", szDecimals: 4, maxLeverage: 50 },
          { name: "DEAD", szDecimals: 2, maxLeverage: 3, isDelisted: true },
        ],
      },
      [],
    ])
    expect(markets).toEqual([
      expect.objectContaining({ symbol: "ETH", status: "ACTIVE", quoteAsset: "USDC" }),
      expect.objectContaining({ symbol: "DEAD", status: "UNAVAILABLE" }),
    ])
  })

  it("maps cross and isolated positions with liquidation price", () => {
    const positions = mapHyperliquidPositions({
      assetPositions: [
        {
          position: {
            coin: "ETH",
            szi: "-1.5",
            entryPx: "3000",
            positionValue: "-4500",
            unrealizedPnl: "-12",
            leverage: { type: "isolated", value: 10 },
            maxLeverage: 50,
            marginUsed: "450",
            liquidationPx: "3500",
          },
        },
        {
          position: {
            coin: "BTC",
            szi: "0",
            entryPx: "60000",
            positionValue: "0",
            unrealizedPnl: "0",
            leverage: { type: "cross", value: 5 },
            maxLeverage: 40,
            marginUsed: "0",
            liquidationPx: null,
          },
        },
      ],
    })
    expect(positions).toHaveLength(1)
    expect(positions[0]).toMatchObject({
      id: "hl:ETH",
      side: "SHORT",
      quantity: "1.5",
      markPrice: "3000",
      marginMode: "ISOLATED",
      isolatedMargin: "450",
      liquidationPrice: "3500",
      source: "EXTERNAL",
    })
  })

  it("maps open orders including trigger types and filled quantity", () => {
    const orders = mapHyperliquidOrders([
      {
        coin: "ETH",
        oid: 7,
        side: "A",
        orderType: "Stop Market",
        origSz: "3",
        sz: "1",
        triggerPx: "2800",
        isTrigger: true,
        reduceOnly: true,
        timestamp: 1_700_000_000_000,
      },
    ])
    expect(orders[0]).toMatchObject({
      id: "hl:7",
      side: "SELL",
      type: "STOP_MARKET",
      triggerKind: "STOP_MARKET",
      quantity: "3",
      filledQuantity: "2",
      triggerPrice: "2800",
      reduceOnly: true,
    })
  })

  it("maps fills from array or websocket envelope", () => {
    const direct = mapHyperliquidFills([
      {
        coin: "BTC",
        oid: 1,
        tid: 55,
        side: "B",
        sz: "0.1",
        px: "60000",
        fee: "1",
        closedPnl: "5",
        time: 1_699_999_000_000,
      },
    ])
    const envelope = mapHyperliquidFills({
      fills: [
        {
          coin: "BTC",
          oid: 2,
          tid: 56,
          side: "A",
          sz: "0.2",
          px: "61000",
          fee: "2",
          closedPnl: "-3",
          time: 1_699_999_500_000,
        },
      ],
    })
    expect(direct[0].id).toBe("hl:55")
    expect(envelope[0].orderId).toBe("hl:2")
  })

  it("builds a full snapshot with account status READY", () => {
    const mapped = mapHyperliquidSnapshot(baseSnapshot(), ADDRESS, 999)
    expect(mapped.snapshot.account).toMatchObject({
      providerId: "hyperliquid",
      accountId: ADDRESS,
      status: "READY",
      equity: "500",
      availableBalance: "450",
      updatedAt: 999,
    })
    expect(mapHyperliquidAccount(baseSnapshot().clearinghouseState, ADDRESS, 999)).toMatchObject({
      status: "READY",
      balances: [{ asset: "USDC", total: "500", available: "450" }],
    })
  })

  it("throws HyperliquidProtocolError on malformed payloads", () => {
    expect(() => mapHyperliquidMarkets(null)).toThrow(HyperliquidProtocolError)
    expect(() => mapHyperliquidPositions({ assetPositions: "bad" })).toThrow(
      HyperliquidProtocolError
    )
    expect(() =>
      mapHyperliquidOrders([{ coin: "ETH", oid: 1, side: "X", sz: "1", timestamp: 1 }])
    ).toThrow(HyperliquidProtocolError)
    expect(() => mapHyperliquidFills({ fills: "bad" })).toThrow(HyperliquidProtocolError)
  })
})
