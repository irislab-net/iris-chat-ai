import { describe, expect, it, beforeEach, afterEach } from "vitest"

import {
  emptyPaperState,
  evaluateBarExecutions,
  markPaperPrice,
  openPaperTrade,
  parsePaperState,
  placePaperOrder,
  reconcilePaperBars,
} from "@/lib/paper-trading/engine"
import {
  applyMarketSlippage,
  getPaperExecution,
  marketFillFee,
  usePaperExecution,
} from "@/lib/paper-trading/execution"

const INTERVAL = 60_000

beforeEach(() => {
  usePaperExecution(null) // real V2.1 defaults
})

afterEach(() => {
  usePaperExecution(null)
})

describe("paper trading V2.1 execution economics", () => {
  it("market BUY applies adverse slippage", () => {
    const mark = 1887.2
    const { price, fee } = marketFillFee("BUY", 1, mark)
    expect(price).toBeGreaterThan(mark)
    expect(price).toBe(applyMarketSlippage("BUY", mark))
    expect(fee).toBeGreaterThan(0)

    const opened = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: mark,
    })
    expect(opened.position?.entryPrice).toBe(price)
    expect(opened.state.fills[0]?.fee).toBeCloseTo(fee)
    expect(opened.state.account.balance).toBeCloseTo(
      emptyPaperState().account.balance - fee
    )
  })

  it("market SELL applies adverse slippage", () => {
    const mark = 1887.2
    const { price, fee } = marketFillFee("SELL", 1, mark)
    expect(price).toBeLessThan(mark)

    const opened = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "SHORT",
      quantity: 1,
      entryPrice: mark,
    })
    expect(opened.position?.entryPrice).toBe(price)
    expect(opened.state.fills[0]?.fee).toBeCloseTo(fee)
  })

  it("charges fee on opening, scale-in, partial close, full close, flip", () => {
    const mark = 2000
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: mark,
    }).state
    const openFee = state.fills[0]!.fee
    expect(openFee).toBeGreaterThan(0)

    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "LONG",
      quantity: 0.5,
      entryPrice: mark,
    }).state
    const scaleFee = state.fills[0]!.fee
    expect(scaleFee).toBeGreaterThan(0)
    expect(state.fills).toHaveLength(2)

    const balAfterScale = state.account.balance

    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "SHORT",
      quantity: 0.4,
      entryPrice: mark,
    }).state
    const partialFee = state.fills[0]!.fee
    expect(partialFee).toBeGreaterThan(0)
    // balance = prior - fee + realized
    expect(state.account.balance).not.toBe(balAfterScale)

    state = openPaperTrade(state, {
      symbol: "ETH",
      side: "SHORT",
      quantity: 2,
      entryPrice: mark,
    }).state
    // full close of remaining long + flip to short
    expect(state.positions[0]?.side).toBe("SHORT")
    expect(state.fills[0]!.fee).toBeGreaterThan(0)
    expect(state.history.length).toBeGreaterThanOrEqual(1)
  })

  it("TP trigger executes with market economics from trigger", () => {
    usePaperExecution({
      marketSlippageBps: 0,
      takerFeeBps: 5,
      makerFeeBps: 0,
    })
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      takeProfit: 2100,
    }).state
    // zero slip so entry stays 2000
    expect(state.positions[0]?.entryPrice).toBe(2000)

    usePaperExecution(null)
    state = markPaperPrice(state, "ETH", 2100)
    expect(state.positions).toHaveLength(0)
    expect(state.history[0]?.reason).toBe("tp")
    const exitFill = state.fills[0]!
    expect(exitFill.fee).toBeGreaterThan(0)
    expect(exitFill.price).toBe(applyMarketSlippage("SELL", 2100))
  })

  it("SL trigger executes with market economics from trigger", () => {
    usePaperExecution({
      marketSlippageBps: 0,
      takerFeeBps: 5,
      makerFeeBps: 0,
    })
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      stopLoss: 1900,
    }).state

    usePaperExecution(null)
    state = markPaperPrice(state, "ETH", 1900)
    expect(state.history[0]?.reason).toBe("sl")
    expect(state.fills[0]!.fee).toBeGreaterThan(0)
    expect(state.fills[0]!.price).toBe(applyMarketSlippage("SELL", 1900))
  })

  it("limit fill uses maker fee and limit price (no slippage)", () => {
    const cfg = getPaperExecution()
    let state = emptyPaperState()
    const placed = placePaperOrder(state, {
      symbol: "ETH",
      side: "BUY",
      type: "LIMIT",
      size: 1,
      price: 1800,
    })
    state = placed.state
    const openedAt = 1_000_000
    state = reconcilePaperBars(
      state,
      "ETH",
      [{ t: openedAt, h: 1810, l: 1790, c: 1805 }],
      { intervalMs: INTERVAL, now: openedAt + INTERVAL * 2 }
    )
    expect(state.positions).toHaveLength(1)
    expect(state.positions[0]?.entryPrice).toBe(1800)
    expect(state.fills[0]?.fee).toBeCloseTo(
      (1800 * 1 * cfg.makerFeeBps) / 10_000
    )
  })

  it("Limit + SL + TP same candle is AMBIGUOUS — no invented order", () => {
    usePaperExecution({
      marketSlippageBps: 0,
      takerFeeBps: 0,
      makerFeeBps: 0,
    })
    const openedAt = 1_000_000
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      stopLoss: 1950,
      takeProfit: 2100,
    }).state
    state = {
      ...state,
      positions: state.positions.map((p) => ({
        ...p,
        openedAt,
        lastCheckedAt: openedAt,
      })),
    }
    state = placePaperOrder(state, {
      symbol: "ETH",
      side: "BUY",
      type: "LIMIT",
      size: 0.5,
      price: 1980,
    }).state

    const bar = { t: openedAt + INTERVAL, h: 2110, l: 1940, c: 2050 }
    const hit = evaluateBarExecutions(
      state,
      "ETH",
      state.positions[0],
      { h: bar.h, l: bar.l, c: bar.c }
    )
    expect(hit.kind).toBe("ambiguous")
    expect(hit.kind === "ambiguous" && hit.orderIds.length).toBeGreaterThanOrEqual(
      3
    )

    const fillsBefore = state.fills.length
    state = reconcilePaperBars(state, "ETH", [bar], {
      intervalMs: INTERVAL,
      now: openedAt + INTERVAL * 2,
    })
    expect(state.history[0]?.reason).toBe("ambiguous")
    // Touched resting orders canceled — not sequentially filled
    const open = state.orders.filter((o) => o.status === "OPEN")
    expect(open).toHaveLength(0)
    // Exactly one closing fill for ambiguity (plus prior open fills)
    const newFills = state.fills.length - fillsBefore
    expect(newFills).toBe(1)
  })

  it("reload / parse produces identical accounting", () => {
    const opened = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 2,
      entryPrice: 1887.2,
      stopLoss: 1800,
      takeProfit: 2000,
    })
    const roundTrip = parsePaperState(JSON.parse(JSON.stringify(opened.state)))
    expect(roundTrip.account.balance).toBe(opened.state.account.balance)
    expect(roundTrip.fills[0]?.fee).toBe(opened.state.fills[0]?.fee)
    expect(roundTrip.fills[0]?.price).toBe(opened.state.fills[0]?.price)
    expect(roundTrip.positions[0]?.entryPrice).toBe(
      opened.state.positions[0]?.entryPrice
    )
  })

  it("historical reconcile is deterministic (identical accounting)", () => {
    usePaperExecution({
      marketSlippageBps: 0,
      takerFeeBps: 5,
      makerFeeBps: 0,
    })
    const openedAt = 1_000_000
    const base = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      takeProfit: 2100,
    }).state
    const pinned = {
      ...base,
      positions: base.positions.map((p) => ({
        ...p,
        openedAt,
        lastCheckedAt: openedAt,
      })),
    }
    const bars = [{ t: openedAt + INTERVAL, h: 2110, l: 2005, c: 2105 }]
    const a = reconcilePaperBars(structuredClone(pinned), "ETH", bars, {
      intervalMs: INTERVAL,
      now: openedAt + INTERVAL * 3,
    })
    const b = reconcilePaperBars(structuredClone(pinned), "ETH", bars, {
      intervalMs: INTERVAL,
      now: openedAt + INTERVAL * 3,
    })
    expect(a.account.balance).toBe(b.account.balance)
    expect(a.fills.map((f) => ({ price: f.price, fee: f.fee }))).toEqual(
      b.fills.map((f) => ({ price: f.price, fee: f.fee }))
    )
    expect(a.history[0]?.realizedPnl).toBe(b.history[0]?.realizedPnl)
  })

  it("no duplicated fees/fills on idempotent reconcile", () => {
    usePaperExecution({
      marketSlippageBps: 0,
      takerFeeBps: 5,
      makerFeeBps: 0,
    })
    const openedAt = 1_000_000
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 2000,
      takeProfit: 2100,
    }).state
    state = {
      ...state,
      positions: state.positions.map((p) => ({
        ...p,
        openedAt,
        lastCheckedAt: openedAt,
      })),
    }
    const bars = [{ t: openedAt + INTERVAL, h: 2110, l: 2005, c: 2105 }]
    state = reconcilePaperBars(state, "ETH", bars, {
      intervalMs: INTERVAL,
      now: openedAt + INTERVAL * 3,
    })
    const fillsAfterFirst = state.fills.length
    const bal = state.account.balance
    state = reconcilePaperBars(state, "ETH", bars, {
      intervalMs: INTERVAL,
      now: openedAt + INTERVAL * 4,
    })
    expect(state.fills.length).toBe(fillsAfterFirst)
    expect(state.account.balance).toBe(bal)
    expect(state.history).toHaveLength(1)
  })

  it("does not use Math.random for economics", () => {
    const src = [
      applyMarketSlippage("BUY", 1000),
      applyMarketSlippage("BUY", 1000),
      marketFillFee("SELL", 2, 2500),
      marketFillFee("SELL", 2, 2500),
    ]
    expect(src[0]).toBe(src[1])
    expect(src[2]).toEqual(src[3])
  })
})
