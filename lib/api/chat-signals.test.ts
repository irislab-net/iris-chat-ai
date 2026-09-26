import { describe, expect, it } from "vitest"

import { tradeSignalToPaperTicket } from "@/lib/api/chat-signals"
import type { TradeSignalItem } from "@/lib/api/types"

function baseSignal(overrides: Partial<TradeSignalItem> = {}): TradeSignalItem {
  return {
    uid: "11111111-1111-1111-1111-111111111111",
    session_id: "sess-1",
    source: "chat_tool",
    outcome: "signal",
    final_status: null,
    content_hash: "a".repeat(64),
    created_at: "2026-09-21T10:00:00Z",
    hash_ok: true,
    symbol: "ETHUSDT",
    direction: "long",
    setup: "Range Bounce",
    entry: 2626,
    stop_loss: 2623.5,
    take_profit: 2632,
    leverage: 10,
    thesis: "Bid-side pressure",
    entry_reason: "Support hold",
    stop_loss_reason: "Below range",
    take_profit_reason: "Range high",
    time_horizon: "intraday",
    ...overrides,
  }
}

describe("tradeSignalToPaperTicket", () => {
  it("maps a verified signal onto a paper ticket", () => {
    expect(tradeSignalToPaperTicket(baseSignal())).toEqual({
      symbol: "ETH",
      side: "LONG",
      quantity: 0,
      markPrice: 2626,
      stopLoss: 2623.5,
      takeProfit: 2632,
      leverage: 10,
      setup: "Range Bounce",
      thesis: "Bid-side pressure",
      timeHorizon: "intraday",
      entryReason: "Support hold",
      stopLossReason: "Below range",
      takeProfitReason: "Range high",
    })
  })

  it("returns null when hash is not ok or levels are incomplete", () => {
    expect(tradeSignalToPaperTicket(baseSignal({ hash_ok: false }))).toBeNull()
    expect(
      tradeSignalToPaperTicket(baseSignal({ outcome: "no_trade" }))
    ).toBeNull()
    expect(
      tradeSignalToPaperTicket(baseSignal({ stop_loss: undefined }))
    ).toBeNull()
    expect(
      tradeSignalToPaperTicket(baseSignal({ direction: "sideways" }))
    ).toBeNull()
  })
})
