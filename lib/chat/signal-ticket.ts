import type { PaperSide } from "@/lib/chat/trade-signal"

/** Ticket for the in-chat trade-signal card (`show_trade_signal`). */
export type TradeSignalTicket = {
  symbol: string
  side: PaperSide
  quantity: number
  markPrice: number
  stopLoss: number
  takeProfit: number
  leverage: number
  setup: string
  thesis: string
  /** Optional display fields from `show_trade_signal` (omit when absent). */
  timeHorizon?: string
  entryReason?: string
  stopLossReason?: string
  takeProfitReason?: string
}

/** @deprecated Use TradeSignalTicket — kept for persisted message field compatibility. */
export type PaperTradeTicket = TradeSignalTicket
