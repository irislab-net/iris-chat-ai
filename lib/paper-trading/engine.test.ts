import { describe, expect, it, beforeEach, afterEach } from "vitest"

import {
  applyFillToNetPosition,
  closePaperPosition,
  emptyPaperState,
  evaluateBarHit,
  markPaperPrice,
  modifyPaperPosition,
  openOrdersForSymbol,
  openPaperTrade,
  placePaperOrder,
  pnlOf,
  reconcilePaperBars,
} from "@/lib/paper-trading/engine"
import { usePaperExecution } from "@/lib/paper-trading/execution"

const INTERVAL = 60_000

beforeEach(() => {
  // Isolate netting/reconcile semantics from V2.1 economics.
  usePaperExecution({
    marketSlippageBps: 0,
    takerFeeBps: 0,
    makerFeeBps: 0,
  })
})

afterEach(() => {
  usePaperExecution(null)
})

function withCursor(
  state: ReturnType<typeof emptyPaperState>,
  openedAt: number,
  lastCheckedAt = openedAt
) {
  return {
    ...state,
    positions: state.positions.map((p) => ({
      ...p,
      openedAt,
      lastCheckedAt,
    })),
  }
}

function triggersFromState(
  state: ReturnType<typeof emptyPaperState>,
  symbol: string
) {
  const open = openOrdersForSymbol(state, symbol)
  return {
    sl: open.find((o) => o.type === "STOP_LOSS"),
    tp: open.find((o) => o.type === "TAKE_PROFIT"),
  }
}

describe("paper trading engine", () => {
  it("computes long/short pnl", () => {
    expect(pnlOf("LONG", 100, 2, 110)).toBeCloseTo(20)
    expect(pnlOf("SHORT", 100, 2, 90)).toBeCloseTo(20)
    expect(pnlOf("LONG", 100, 1, 90)).toBeCloseTo(-10)
  })

  it("opens a net position and places bracket orders", () => {
    const first = openPaperTrade(emptyPaperState(), {
      symbol: "eth",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      stopLoss: 1900,
      takeProfit: 2200,
    })
    expect(first.error).toBeUndefined()
    expect(first.position?.symbol).toBe("ETH")
    expect(first.position?.stopLoss).toBe(1900)
    expect(first.position?.takeProfit).toBe(2200)
    expect(openOrdersForSymbol(first.state, "ETH")).toHaveLength(2)
  })

  it("same-direction market adds size with weighted average entry", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 1880,
    }).state

    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 0.5,
      entryPrice: 1900,
    }).state

    const pos = state.positions[0]!
    expect(pos.side).toBe("LONG")
    expect(pos.quantity).toBeCloseTo(1.5)
    expect(pos.entryPrice).toBeCloseTo((1880 + 1900 * 0.5) / 1.5)
  })

  it("opposite market reduces; full close goes flat", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 1880,
    }).state

    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "SHORT",
      quantity: 0.4,
      entryPrice: 1900,
    }).state
    expect(state.positions[0]?.quantity).toBeCloseTo(0.6)
    expect(state.positions[0]?.side).toBe("LONG")
    expect(state.positions[0]?.entryPrice).toBe(1880)

    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "SHORT",
      quantity: 0.6,
      entryPrice: 1890,
    }).state
    expect(state.positions).toHaveLength(0)
    expect(state.history.length).toBeGreaterThanOrEqual(1)
  })

  it("opposite market larger than position flips to short", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 1880,
    }).state

    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "SHORT",
      quantity: 1.5,
      entryPrice: 1900,
    }).state

    const pos = state.positions[0]!
    expect(pos.side).toBe("SHORT")
    expect(pos.quantity).toBeCloseTo(0.5)
    expect(pos.entryPrice).toBe(1900)
    expect(state.history[0]?.reason).toBe("manual")
  })

  it("supports independent net positions across symbols", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
    }).state
    state = openPaperTrade(state, {
      symbol: "BTC",
      side: "SHORT",
      quantity: 0.1,
      entryPrice: 100_000,
    }).state
    expect(state.positions).toHaveLength(2)
  })

  it("marks unrealized pnl and closes on TP order", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      takeProfit: 2100,
    }).state

    state = markPaperPrice(state, "ETH", 2050)
    expect(state.positions[0]?.unrealizedPnl).toBeCloseTo(50)

    state = markPaperPrice(state, "ETH", 2100)
    expect(state.positions).toHaveLength(0)
    expect(state.history[0]?.reason).toBe("tp")
    expect(state.history[0]?.realizedPnl).toBeCloseTo(100)
    expect(openOrdersForSymbol(state, "ETH")).toHaveLength(0)
  })

  it("A: historical TP closes after return", () => {
    const openedAt = 1_000_000
    let state = withCursor(
      openPaperTrade(emptyPaperState(), {
        symbol: "ETH",
        side: "LONG",
        quantity: 1,
        entryPrice: 2000,
        takeProfit: 2100,
      }).state,
      openedAt
    )

    state = reconcilePaperBars(
      state,
      "ETH",
      [{ t: openedAt + INTERVAL, h: 2110, l: 2005, c: 2105 }],
      { intervalMs: INTERVAL, now: openedAt + INTERVAL * 3 }
    )

    expect(state.positions).toHaveLength(0)
    expect(state.history[0]?.reason).toBe("tp")
    expect(state.history[0]?.exitPrice).toBe(2100)
  })

  it("B: historical SL closes after return", () => {
    const openedAt = 1_000_000
    let state = withCursor(
      openPaperTrade(emptyPaperState(), {
        symbol: "ETH",
        side: "LONG",
        quantity: 1,
        entryPrice: 2000,
        stopLoss: 1950,
      }).state,
      openedAt
    )

    state = reconcilePaperBars(
      state,
      "ETH",
      [
        { t: openedAt - INTERVAL, h: 2010, l: 1990, c: 2005 },
        { t: openedAt + INTERVAL, h: 1990, l: 1940, c: 1945 },
      ],
      { intervalMs: INTERVAL, now: openedAt + INTERVAL * 3 }
    )

    expect(state.positions).toHaveLength(0)
    expect(state.history[0]?.reason).toBe("sl")
    expect(state.history[0]?.exitPrice).toBe(1950)
  })

  it("C: same candle SL+TP → AMBIGUOUS", () => {
    const openedAt = 1_000_000
    let state = withCursor(
      openPaperTrade(emptyPaperState(), {
        symbol: "ETH",
        side: "LONG",
        quantity: 1,
        entryPrice: 2000,
        stopLoss: 1950,
        takeProfit: 2100,
      }).state,
      openedAt
    )

    state = reconcilePaperBars(
      state,
      "ETH",
      [{ t: openedAt + INTERVAL, h: 2110, l: 1940, c: 2050 }],
      { intervalMs: INTERVAL, now: openedAt + INTERVAL * 2 }
    )

    expect(state.positions).toHaveLength(0)
    expect(state.history[0]?.reason).toBe("ambiguous")
    expect(state.history[0]?.exitPrice).toBe(2050)
  })

  it("partial first candle terminal touch → AMBIGUOUS", () => {
    const openedAt = 1_000_000
    const cursor = openedAt + 30_000
    let state = withCursor(
      openPaperTrade(emptyPaperState(), {
        symbol: "ETH",
        side: "LONG",
        quantity: 1,
        entryPrice: 2000,
        stopLoss: 1950,
      }).state,
      openedAt,
      cursor
    )

    state = reconcilePaperBars(
      state,
      "ETH",
      [{ t: openedAt, h: 2010, l: 1940, c: 1960 }],
      { intervalMs: INTERVAL, now: openedAt + INTERVAL }
    )

    expect(state.positions).toHaveLength(0)
    expect(state.history[0]?.reason).toBe("ambiguous")
  })

  it("D: no terminal event keeps position open and advances cursor", () => {
    const openedAt = 1_000_000
    const now = openedAt + INTERVAL * 3
    let state = withCursor(
      openPaperTrade(emptyPaperState(), {
        symbol: "ETH",
        side: "LONG",
        quantity: 1,
        entryPrice: 2000,
        stopLoss: 1900,
        takeProfit: 2200,
      }).state,
      openedAt
    )

    state = reconcilePaperBars(
      state,
      "ETH",
      [
        { t: openedAt + INTERVAL, h: 2050, l: 1990, c: 2040 },
        { t: openedAt + INTERVAL * 2, h: 2060, l: 2030, c: 2055 },
      ],
      { intervalMs: INTERVAL, now }
    )

    expect(state.positions).toHaveLength(1)
    expect(state.history).toHaveLength(0)
    expect(state.positions[0]?.markPrice).toBe(2055)
    expect(state.positions[0]?.unrealizedPnl).toBeCloseTo(55)
    expect(state.positions[0]?.lastCheckedAt).toBe(now)
  })

  it("idempotent: replaying same bars does not duplicate history", () => {
    const openedAt = 1_000_000
    const now = openedAt + INTERVAL * 3
    let state = withCursor(
      openPaperTrade(emptyPaperState(), {
        symbol: "ETH",
        side: "LONG",
        quantity: 1,
        entryPrice: 2000,
        takeProfit: 2100,
      }).state,
      openedAt
    )
    const bars = [{ t: openedAt + INTERVAL, h: 2110, l: 2005, c: 2105 }]
    state = reconcilePaperBars(state, "ETH", bars, {
      intervalMs: INTERVAL,
      now,
    })
    expect(state.history).toHaveLength(1)
    const firstHistory = state.history[0]!

    state = reconcilePaperBars(state, "ETH", bars, {
      intervalMs: INTERVAL,
      now: now + INTERVAL,
    })
    expect(state.positions).toHaveLength(0)
    expect(state.history).toHaveLength(1)
    expect(state.history[0]?.id).toBe(firstHistory.id)
    expect(state.history[0]?.realizedPnl).toBe(firstHistory.realizedPnl)
  })

  it("does not move lastCheckedAt backwards", () => {
    const openedAt = 1_000_000
    const cursor = openedAt + INTERVAL * 5
    let state = withCursor(
      openPaperTrade(emptyPaperState(), {
        symbol: "ETH",
        side: "LONG",
        quantity: 1,
        entryPrice: 2000,
      }).state,
      openedAt,
      cursor
    )

    state = reconcilePaperBars(
      state,
      "ETH",
      [{ t: openedAt + INTERVAL, h: 2010, l: 1990, c: 2005 }],
      { intervalMs: INTERVAL, now: cursor + 1000 }
    )

    expect(state.positions[0]?.lastCheckedAt).toBeGreaterThanOrEqual(cursor)
  })

  it("evaluateBarHit marks dual touch ambiguous", () => {
    const opened = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      stopLoss: 1950,
      takeProfit: 2100,
    })
    const pos = opened.position!
    const hit = evaluateBarHit(
      pos,
      { h: 2110, l: 1940, c: 2000 },
      triggersFromState(opened.state, "ETH")
    )
    expect(hit.kind).toBe("ambiguous")
  })

  it("manual close records history", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "BTC",
      side: "SHORT",
      quantity: 0.5,
      entryPrice: 100_000,
    }).state
    const id = state.positions[0]!.id
    state = markPaperPrice(state, "BTC", 99_000)
    state = closePaperPosition(state, id, 99_000)
    expect(state.positions).toHaveLength(0)
    expect(state.history[0]?.reason).toBe("manual")
    expect(state.history[0]?.realizedPnl).toBeCloseTo(500)
  })

  it("modifyPaperPosition updates SL/TP orders and rejects invalid", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      stopLoss: 1900,
      takeProfit: 2100,
    }).state
    const id = state.positions[0]!.id

    const ok = modifyPaperPosition(state, id, { stopLoss: 1920 })
    expect(ok.error).toBeUndefined()
    state = ok.state
    expect(state.positions[0]?.stopLoss).toBe(1920)
    expect(
      openOrdersForSymbol(state, "ETH").find((o) => o.type === "STOP_LOSS")
        ?.triggerPrice
    ).toBe(1920)

    const bad = modifyPaperPosition(state, id, { takeProfit: 1800 })
    expect(bad.error).toMatch(/above entry/)
    expect(bad.state.positions[0]?.takeProfit).toBe(2100)
  })

  it("applyFillToNetPosition is the netting primitive", () => {
    let state = emptyPaperState()
    state = applyFillToNetPosition(state, {
      orderId: "a",
      symbol: "ETH",
      side: "BUY",
      size: 1,
      price: 1880,
    })
    state = applyFillToNetPosition(state, {
      orderId: "b",
      symbol: "ETH",
      side: "BUY",
      size: 0.5,
      price: 1900,
    })
    expect(state.positions[0]?.quantity).toBeCloseTo(1.5)
    expect(state.fills).toHaveLength(2)
  })

  it("keeps a net position per symbol so ETH, BTC, and SOL can stay open together", () => {
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
    }).state
    state = openPaperTrade(state, {
      symbol: "BTC",
      side: "SHORT",
      quantity: 0.1,
      entryPrice: 60_000,
    }).state
    state = openPaperTrade(state, {
      symbol: "SOL",
      side: "LONG",
      quantity: 10,
      entryPrice: 150,
    }).state

    expect(state.positions).toHaveLength(3)
    expect(state.positions.map((p) => p.symbol).sort()).toEqual(["BTC", "ETH", "SOL"])
    expect(state.positions.find((p) => p.symbol === "ETH")?.side).toBe("LONG")
    expect(state.positions.find((p) => p.symbol === "BTC")?.side).toBe("SHORT")
  })

  it("placePaperOrder keeps resting LIMIT open", () => {
    const result = placePaperOrder(emptyPaperState(), {
      symbol: "ETH",
      side: "BUY",
      type: "LIMIT",
      size: 1,
      price: 1800,
    })
    expect(result.error).toBeUndefined()
    expect(result.order?.status).toBe("OPEN")
    expect(result.state.positions).toHaveLength(0)
    expect(openOrdersForSymbol(result.state, "ETH")).toHaveLength(1)
  })

  it("stop market can open a position when the trigger trades", () => {
    const placed = placePaperOrder(emptyPaperState(), {
      symbol: "ETH",
      side: "BUY",
      type: "STOP_MARKET",
      size: 1,
      triggerPrice: 2100,
    })
    expect(placed.error).toBeUndefined()
    expect(placed.order?.status).toBe("OPEN")
    expect(placed.state.positions).toHaveLength(0)

    const filled = markPaperPrice(placed.state, "ETH", 2100)
    expect(filled.positions).toHaveLength(1)
    expect(filled.positions[0]?.side).toBe("LONG")
    expect(filled.positions[0]?.quantity).toBeCloseTo(1)
  })

  it("take market buy triggers when price falls to the take level", () => {
    const placed = placePaperOrder(emptyPaperState(), {
      symbol: "ETH",
      side: "BUY",
      type: "TAKE_PROFIT",
      size: 1,
      triggerPrice: 1900,
    })
    expect(placed.error).toBeUndefined()

    const missed = markPaperPrice(placed.state, "ETH", 2000)
    expect(missed.positions).toHaveLength(0)

    const filled = markPaperPrice(placed.state, "ETH", 1900)
    expect(filled.positions).toHaveLength(1)
    expect(filled.positions[0]?.side).toBe("LONG")
  })
})
