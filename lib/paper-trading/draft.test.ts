import { describe, expect, it, beforeEach, afterEach } from "vitest"

import {
  clearDraftLevel,
  commitDraftStopLoss,
  commitDraftTakeProfit,
  createPaperTradeDraft,
  dragDraftLevel,
  projectedPnlAt,
  snapDraftPrice,
} from "@/lib/paper-trading/draft"
import {
  emptyPaperState,
  modifyPaperPosition,
  openPaperTrade,
  pnlOf,
  reconcilePaperBars,
} from "@/lib/paper-trading/engine"
import { usePaperExecution } from "@/lib/paper-trading/execution"

beforeEach(() => {
  usePaperExecution({
    marketSlippageBps: 0,
    takerFeeBps: 0,
    makerFeeBps: 0,
  })
})

afterEach(() => {
  usePaperExecution(null)
})

describe("paper trade draft bracket", () => {
  const entry = 1887

  it("LONG valid SL placement", () => {
    const draft = createPaperTradeDraft("LONG", 1, entry)
    const next = commitDraftStopLoss(draft, 1860)
    expect(next?.stopLoss).toBe(1860)
  })

  it("LONG invalid SL rejected", () => {
    const draft = createPaperTradeDraft("LONG", 1, entry)
    expect(commitDraftStopLoss(draft, 1900)).toBeNull()
    expect(commitDraftStopLoss(draft, entry)).toBeNull()
  })

  it("LONG valid TP placement", () => {
    const draft = createPaperTradeDraft("LONG", 1, entry)
    const next = commitDraftTakeProfit(draft, 1925)
    expect(next?.takeProfit).toBe(1925)
  })

  it("LONG invalid TP rejected", () => {
    const draft = createPaperTradeDraft("LONG", 1, entry)
    expect(commitDraftTakeProfit(draft, 1800)).toBeNull()
  })

  it("SHORT valid SL placement", () => {
    const draft = createPaperTradeDraft("SHORT", 2, entry)
    const next = commitDraftStopLoss(draft, 1910)
    expect(next?.stopLoss).toBe(1910)
  })

  it("SHORT valid TP placement", () => {
    const draft = createPaperTradeDraft("SHORT", 2, entry)
    const next = commitDraftTakeProfit(draft, 1850)
    expect(next?.takeProfit).toBe(1850)
  })

  it("SHORT invalid SL/TP rejected", () => {
    const draft = createPaperTradeDraft("SHORT", 1, entry)
    expect(commitDraftStopLoss(draft, 1800)).toBeNull()
    expect(commitDraftTakeProfit(draft, 1950)).toBeNull()
  })

  it("pointer price rounding snaps consistently", () => {
    expect(snapDraftPrice(1887.456789)).toBe(1887.46)
    expect(snapDraftPrice(0.1234567)).toBe(0.123457)
  })

  it("projected PnL matches engine pnlOf", () => {
    const draft = createPaperTradeDraft("LONG", 3, entry)
    const level = 1900
    expect(projectedPnlAt(draft.side, draft.entryPrice, draft.quantity, level)).toBe(
      pnlOf("LONG", entry, 3, level)
    )
    const short = createPaperTradeDraft("SHORT", 2, entry)
    expect(
      projectedPnlAt(short.side, short.entryPrice, short.quantity, 1850)
    ).toBe(pnlOf("SHORT", entry, 2, 1850))
  })

  it("draft → open position carries exact levels", () => {
    let draft = createPaperTradeDraft("LONG", 1.5, entry)
    draft = commitDraftStopLoss(draft, 1860)!
    draft = commitDraftTakeProfit(draft, 1925)!
    const opened = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: draft.side,
      quantity: draft.quantity,
      entryPrice: draft.entryPrice,
      stopLoss: draft.stopLoss,
      takeProfit: draft.takeProfit,
    })
    expect(opened.error).toBeUndefined()
    expect(opened.position?.stopLoss).toBe(1860)
    expect(opened.position?.takeProfit).toBe(1925)
    expect(opened.position?.quantity).toBe(1.5)
    expect(opened.state.positions).toHaveLength(1)
  })

  it("drag existing draft SL / reject invalid drag", () => {
    let draft = createPaperTradeDraft("LONG", 1, entry)
    draft = commitDraftStopLoss(draft, 1860)!
    const moved = dragDraftLevel(draft, "stopLoss", 1850)
    expect(moved?.stopLoss).toBe(1850)
    expect(dragDraftLevel(draft, "stopLoss", 1900)).toBeNull()
  })

  it("drag existing draft TP / reject invalid drag", () => {
    let draft = createPaperTradeDraft("LONG", 1, entry)
    draft = commitDraftTakeProfit(draft, 1925)!
    const moved = dragDraftLevel(draft, "takeProfit", 1940)
    expect(moved?.takeProfit).toBe(1940)
    expect(dragDraftLevel(draft, "takeProfit", 1800)).toBeNull()
  })

  it("draft removal clears level", () => {
    let draft = createPaperTradeDraft("LONG", 1, entry)
    draft = commitDraftStopLoss(draft, 1860)!
    draft = commitDraftTakeProfit(draft, 1925)!
    draft = clearDraftLevel(draft, "stopLoss")
    expect(draft.stopLoss).toBeNull()
    expect(draft.takeProfit).toBe(1925)
    draft = clearDraftLevel(draft, "takeProfit")
    expect(draft.takeProfit).toBeNull()
  })

  it("same-symbol opposite market closes the net position", () => {
    const first = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: entry,
      stopLoss: 1860,
      takeProfit: 1925,
    })
    const second = openPaperTrade(first.state, {
      symbol: "ETH",
      side: "SHORT",
      quantity: 1,
      entryPrice: entry,
      stopLoss: null,
      takeProfit: null,
    })
    expect(second.error).toBeUndefined()
    expect(second.state.positions).toHaveLength(0)
    expect(second.state.history[0]?.reason).toBe("manual")
  })

  it("open-position SL/TP drag modify + reconciliation still works", () => {
    const openedAt = 1_000_000
    const INTERVAL = 60_000
    let state = openPaperTrade(emptyPaperState(), {
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: entry,
      stopLoss: 1860,
      takeProfit: 1925,
    }).state
    // Pin openedAt for deterministic bars
    const id = state.positions[0]!.id
    state = {
      ...state,
      positions: state.positions.map((p) =>
        p.id === id
          ? { ...p, openedAt, lastCheckedAt: openedAt }
          : p
      ),
    }

    const modified = modifyPaperPosition(state, id, { stopLoss: 1855 })
    expect(modified.error).toBeUndefined()
    expect(modified.position?.stopLoss).toBe(1855)

    const invalid = modifyPaperPosition(modified.state, id, { takeProfit: 1800 })
    expect(invalid.error).toBeTruthy()

    const cleared = modifyPaperPosition(modified.state, id, { takeProfit: null })
    expect(cleared.position?.takeProfit).toBeNull()

    const reconciled = reconcilePaperBars(
      cleared.state,
      "ETH",
      [{ t: openedAt + INTERVAL, h: entry + 1, l: 1854, c: 1854.5 }],
      { intervalMs: INTERVAL, now: openedAt + INTERVAL * 2 }
    )
    expect(reconciled.positions).toHaveLength(0)
    expect(reconciled.history[0]?.reason).toBe("sl")
  })
})
