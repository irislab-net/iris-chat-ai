import { describe, expect, it, beforeEach, afterEach } from "vitest"

import {
  addIsolatedMargin,
  calculateAccountMarginView,
  calculateInitialMargin,
  calculateLiquidationPrice,
  calculateMaintenanceMargin,
  changePositionLeverage,
  emptyPaperState,
  getMaxLeverage,
  isCrossAccountLiquidatable,
  isIsolatedLiquidatable,
  markPaperPrice,
  openOrdersForSymbol,
  openPaperTrade,
  parsePaperState,
  placePaperOrder,
  processLiquidations,
  reconcilePaperBars,
  removeIsolatedMargin,
  TIERED_MARGIN_NOT_MODELED,
  usePaperExecution,
  usePaperInstrumentMaxLeverage,
} from "@/lib/paper-trading"
import { maintenanceMarginRate } from "@/lib/paper-trading/instruments"

const INTERVAL = 60_000

beforeEach(() => {
  usePaperExecution({
    marketSlippageBps: 0,
    takerFeeBps: 0,
    makerFeeBps: 0,
  })
  usePaperInstrumentMaxLeverage({ ETH: 25, BTC: 40 })
})

afterEach(() => {
  usePaperExecution(null)
  usePaperInstrumentMaxLeverage(null)
})

describe("paper trading V2.2 margin + liquidation", () => {
  it("documents TIERED_MARGIN_NOT_MODELED", () => {
    expect(TIERED_MARGIN_NOT_MODELED).toBe(true)
    expect(maintenanceMarginRate("ETH")).toBeCloseTo(1 / 25 / 2)
  })

  it("1x / 10x / max leverage open; above max rejected", () => {
    const s1 = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 1,
      marginMode: "CROSS",
    })
    expect(s1.error).toBeUndefined()
    expect(s1.position?.leverage).toBe(1)

    const s10 = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 10,
      marginMode: "CROSS",
    })
    expect(s10.error).toBeUndefined()
    expect(s10.position?.leverage).toBe(10)

    const sMax = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: getMaxLeverage("ETH"),
      marginMode: "CROSS",
    })
    expect(sMax.error).toBeUndefined()

    const over = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: getMaxLeverage("ETH") + 1,
    })
    expect(over.error).toMatch(/exceeds max/i)
  })

  it("insufficient margin rejected", () => {
    let state = emptyPaperState()
    state = {
      ...state,
      account: { balance: 100, equity: 100 },
    }
    const r = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 1,
    })
    expect(r.error).toBe("INSUFFICIENT_MARGIN")
    expect(r.state.positions).toHaveLength(0)
  })

  it("two CROSS symbols — profitable + losing → account liquidation", () => {
    let state = emptyPaperState()
    state = {
      ...state,
      account: { balance: 500, equity: 500 },
    }
    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 20,
      marginMode: "CROSS",
    }).state
    state = openPaperTrade(state, {
      symbol: "BTC",
      side: "LONG",
      quantity: 0.05,
      entryPrice: 40_000,
      leverage: 20,
      marginMode: "CROSS",
    }).state

    state = markPaperPrice(state, "BTC", 40_000)
    state = markPaperPrice(state, "ETH", 50)

    expect(state.positions.find((p) => p.symbol === "ETH")).toBeUndefined()
    expect(state.history.some((h) => h.reason === "liquidation")).toBe(true)
    expect(
      state.fills.some((f) => f.executionReason === "LIQUIDATION")
    ).toBe(true)
  })

  it("isolated liquidation does not consume cross collateral rescue", () => {
    let state = emptyPaperState()
    state = {
      ...state,
      account: { balance: 50_000, equity: 50_000 },
    }
    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 20,
      marginMode: "ISOLATED",
    }).state
    state = openPaperTrade(state, {
      symbol: "BTC",
      side: "LONG",
      quantity: 0.05,
      entryPrice: 40_000,
      leverage: 5,
      marginMode: "CROSS",
    }).state

    const eth = state.positions.find((p) => p.symbol === "ETH")!
    expect(eth.isolatedMargin).toBeCloseTo(2000 / 20)

    // Drive ETH to isolated liquidation; BTC cross should survive.
    const liq = calculateLiquidationPrice(eth, state)!
    state = markPaperPrice(state, "ETH", Math.max(1, liq - 50))

    expect(state.positions.find((p) => p.symbol === "ETH")).toBeUndefined()
    expect(state.positions.find((p) => p.symbol === "BTC")).toBeDefined()
    expect(
      state.history.find((h) => h.symbol === "ETH")?.reason
    ).toBe("liquidation")
  })

  it("add / remove isolated margin; unsafe remove rejected", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 10,
      marginMode: "ISOLATED",
    }).state
    const pos = state.positions[0]!
    expect(pos.isolatedMargin).toBeCloseTo(200)

    const added = addIsolatedMargin(state, pos.id, 100)
    expect(added.error).toBeUndefined()
    state = added.state
    expect(state.positions[0]!.isolatedMargin).toBeCloseTo(300)

    const unsafe = removeIsolatedMargin(state, pos.id, 250)
    expect(unsafe.error).toBeTruthy()

    const safe = removeIsolatedMargin(state, pos.id, 50)
    expect(safe.error).toBeUndefined()
    expect(safe.state.positions[0]!.isolatedMargin).toBeCloseTo(250)
  })

  it("same-side scale-in increases margin requirement; preserves mode", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 10,
      marginMode: "ISOLATED",
    }).state
    const before = state.positions[0]!.isolatedMargin!
    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2100,
      leverage: 5, // ignored on scale-in
      marginMode: "CROSS", // ignored
    }).state
    const pos = state.positions[0]!
    expect(pos.marginMode).toBe("ISOLATED")
    expect(pos.leverage).toBe(10)
    expect(pos.quantity).toBeCloseTo(2)
    expect(pos.isolatedMargin!).toBeGreaterThan(before)
  })

  it("partial reduce releases proportional isolated margin", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 2,
      entryPrice: 2000,
      leverage: 10,
      marginMode: "ISOLATED",
    }).state
    expect(state.positions[0]!.isolatedMargin).toBeCloseTo(400)
    state = placePaperOrder(state, {
      symbol: "ETH",
      side: "SELL",
      type: "MARKET",
      size: 1,
      markPrice: 2000,
      reduceOnly: true,
    }).state
    expect(state.positions[0]!.quantity).toBeCloseTo(1)
    expect(state.positions[0]!.isolatedMargin).toBeCloseTo(200)
  })

  it("full close releases margin", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 10,
      marginMode: "CROSS",
    }).state
    const used = calculateAccountMarginView(state).initialMarginUsed
    expect(used).toBeCloseTo(200)
    state = placePaperOrder(state, {
      symbol: "ETH",
      side: "SELL",
      type: "MARKET",
      size: 1,
      markPrice: 2000,
      reduceOnly: true,
    }).state
    expect(state.positions).toHaveLength(0)
    expect(calculateAccountMarginView(state).initialMarginUsed).toBe(0)
  })

  it("flip: close portion + new margin; insufficient remainder rejected after close", () => {
    let state = {
      ...emptyPaperState(),
      account: { balance: 2100, equity: 2100 },
    }
    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 20,
      marginMode: "CROSS",
    }).state
    expect(state.positions).toHaveLength(1)

    const result = openPaperTrade(state, {
      symbol: "ETH",
      side: "SHORT",
      quantity: 3,
      entryPrice: 2000,
      leverage: 1,
      marginMode: "CROSS",
    })
    // Closing LONG succeeds; opening 2 SHORT @ 1x needs 4000 IM → remainder dropped.
    expect(result.state.positions).toHaveLength(0)
    expect(result.state.history).toHaveLength(1)
    expect(result.state.history[0]!.side).toBe("LONG")
  })

  it("reduce-only ignores opening-margin requirement", () => {
    let state = emptyPaperState()
    state = {
      ...state,
      account: { balance: 250, equity: 250 },
    }
    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 20,
      marginMode: "CROSS",
    }).state
    const r = placePaperOrder(state, {
      symbol: "ETH",
      side: "SELL",
      type: "MARKET",
      size: 1,
      markPrice: 1900,
      reduceOnly: true,
    })
    expect(r.error).toBeUndefined()
    expect(r.state.positions).toHaveLength(0)
  })

  it("fee affects equity/margin; slippage affects liquidation fill", () => {
    usePaperExecution({
      marketSlippageBps: 10,
      takerFeeBps: 10,
      makerFeeBps: 0,
    })
    let state = emptyPaperState()
    state = {
      ...state,
      account: { balance: 1000, equity: 1000 },
    }
    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 20,
      marginMode: "ISOLATED",
    }).state
    expect(state.account.balance).toBeLessThan(1000)
    const pos = state.positions[0]!
    expect(isIsolatedLiquidatable(pos)).toBe(false)
    const liq = calculateLiquidationPrice(pos, state)!
    state = markPaperPrice(state, "ETH", Math.max(1, liq - 100))
    const liqFill = state.fills.find((f) => f.executionReason === "LIQUIDATION")
    expect(liqFill).toBeDefined()
    expect(liqFill!.fee).toBeGreaterThan(0)
    // Adverse SELL slippage → fill below liquidation reference
    expect(liqFill!.price).toBeLessThan(liq)
  })

  it("same-candle SL + liquidation → AMBIGUOUS", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 20,
      marginMode: "ISOLATED",
      stopLoss: 1900,
    }).state
    const pos = state.positions[0]!
    const openedAt = 1_000_000
    state = {
      ...state,
      positions: state.positions.map((p) => ({
        ...p,
        openedAt,
        lastCheckedAt: openedAt,
      })),
    }
    const liq = calculateLiquidationPrice(pos, state)!
    // Bar touches both SL and liq
    const low = Math.min(liq, 1900) - 10
    state = reconcilePaperBars(
      state,
      "ETH",
      [{ t: openedAt, h: 2010, l: low, c: 1950 }],
      { intervalMs: INTERVAL, now: openedAt + INTERVAL }
    )
    expect(state.history[0]?.reason).toBe("ambiguous")
  })

  it("browser-away liquidation via reconcile; idempotent replay", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 25,
      marginMode: "ISOLATED",
    }).state
    const openedAt = 2_000_000
    state = {
      ...state,
      positions: state.positions.map((p) => ({
        ...p,
        openedAt,
        lastCheckedAt: openedAt,
      })),
    }
    const liq = calculateLiquidationPrice(state.positions[0]!, state)!
    const bars = [
      { t: openedAt, h: 2010, l: 1990, c: 2000 },
      { t: openedAt + INTERVAL, h: 1990, l: liq - 20, c: liq - 10 },
    ]
    const once = reconcilePaperBars(state, "ETH", bars, {
      intervalMs: INTERVAL,
      now: openedAt + 2 * INTERVAL,
    })
    expect(once.positions).toHaveLength(0)
    expect(once.history[0]?.reason).toBe("liquidation")
    const fills = once.fills.filter((f) => f.executionReason === "LIQUIDATION")
    expect(fills).toHaveLength(1)

    const twice = reconcilePaperBars(once, "ETH", bars, {
      intervalMs: INTERVAL,
      now: openedAt + 2 * INTERVAL,
    })
    expect(
      twice.fills.filter((f) => f.executionReason === "LIQUIDATION")
    ).toHaveLength(1)
  })

  it("attached TP/SL canceled after liquidation", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 25,
      marginMode: "ISOLATED",
      stopLoss: 100,
      takeProfit: 3000,
    }).state
    expect(openOrdersForSymbol(state, "ETH")).toHaveLength(2)
    const liq = calculateLiquidationPrice(state.positions[0]!, state)!
    state = markPaperPrice(state, "ETH", Math.max(1, liq - 50))
    expect(openOrdersForSymbol(state, "ETH")).toHaveLength(0)
    expect(
      state.orders.filter((o) => o.type === "STOP_LOSS" || o.type === "TAKE_PROFIT")
        .every((o) => o.status === "CANCELED" || o.status === "FILLED")
    ).toBe(true)
  })

  it("migrates v2 storage to v3 CROSS 1x", () => {
    const migrated = parsePaperState({
      version: 2,
      account: { balance: 100_000, equity: 100_000 },
      positions: [
        {
          id: "p1",
          symbol: "ETH",
          side: "LONG",
          quantity: 1,
          entryPrice: 2000,
          realizedPnl: 0,
          openedAt: 1,
          lastCheckedAt: 1,
          markPrice: 2000,
          unrealizedPnl: 0,
          stopLoss: null,
          takeProfit: null,
        },
      ],
      orders: [],
      fills: [],
      history: [],
    })
    expect(migrated.version).toBe(3)
    expect(migrated.positions[0]!.marginMode).toBe("CROSS")
    expect(migrated.positions[0]!.leverage).toBe(1)
  })

  it("leverage change creates no fill", () => {
    const opened = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 5,
      marginMode: "CROSS",
    }).state
    const fillsBefore = opened.fills.length
    const r = changePositionLeverage(opened, opened.positions[0]!.id, 10)
    expect(r.error).toBeUndefined()
    expect(r.state.fills.length).toBe(fillsBefore)
    expect(r.position?.leverage).toBe(10)
  })

  it("IM and MM formulas", () => {
    expect(calculateInitialMargin(2, 1000, 10)).toBeCloseTo(200)
    const mm = calculateMaintenanceMargin(
      { symbol: "ETH", quantity: 2 },
      1000
    )
    expect(mm).toBeCloseTo(2000 * (1 / 25 / 2))
  })

  it("cross liquidatable helper", () => {
    let state = emptyPaperState()
    state = {
      ...state,
      account: { balance: 200, equity: 200 },
    }
    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      leverage: 25,
      marginMode: "CROSS",
    }).state
    expect(state.positions).toHaveLength(1)
    // Force underwater mark
    state = {
      ...state,
      positions: state.positions.map((p) => ({
        ...p,
        markPrice: 10,
        unrealizedPnl: (10 - 2000) * 1,
      })),
      account: {
        ...state.account,
        equity: state.account.balance + (10 - 2000),
      },
    }
    expect(isCrossAccountLiquidatable(state)).toBe(true)
    state = processLiquidations(state, Date.now())
    expect(state.positions).toHaveLength(0)
  })
})
