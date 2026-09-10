export type PaperSide = "LONG" | "SHORT"
export type PaperOrderSide = "BUY" | "SELL"

/** Who opened the net position. Engine-owned; never inferred from model prose. */
export type PaperPositionSource = "USER" | "IRIS_AI"

export type MarginMode = "CROSS" | "ISOLATED"

export type PaperCloseReason =
  | "manual"
  | "tp"
  | "sl"
  | "ambiguous"
  | "liquidation"

export type PaperOrderType =
  | "MARKET"
  | "LIMIT"
  | "STOP_MARKET"
  | "TAKE_PROFIT"
  | "STOP_LOSS"

export type PaperOrderStatus =
  | "PENDING"
  | "OPEN"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELED"
  | "REJECTED"

export type PaperExecutionReason =
  | "USER"
  | "LIQUIDATION"
  | "TP"
  | "SL"
  | "AMBIGUOUS"

import type { TimeInForce } from "@/lib/trading/types"

/** One net open position per symbol. */
export type PaperPosition = {
  id: string
  symbol: string
  side: PaperSide
  /** Absolute size (lots). Same meaning as exchange `size`. */
  quantity: number
  entryPrice: number
  /** Realized PnL accumulated while this net position has been open. */
  realizedPnl: number
  openedAt: number
  /**
   * Exclusive lower bound for historical reconciliation.
   * Only candle activity strictly after this cursor is evaluated.
   * Never moves backwards.
   */
  lastCheckedAt: number
  markPrice: number
  unrealizedPnl: number
  /**
   * Denormalized primary bracket levels for UI/chart.
   * Source of truth is OPEN TAKE_PROFIT / STOP_LOSS orders.
   */
  stopLoss: number | null
  takeProfit: number | null
  /** Default CROSS. Preserved on same-symbol scale-in. */
  marginMode: MarginMode
  /** Position leverage (1 … maxLeverage). */
  leverage: number
  /** Allocated margin for ISOLATED only. */
  isolatedMargin?: number
  /** Present when the opening fill was tagged (e.g. IRIS_AI). */
  source?: PaperPositionSource
}

export type PaperOrder = {
  id: string
  clientOrderId: string | null
  symbol: string
  side: PaperOrderSide
  type: PaperOrderType
  size: number
  price: number | null
  triggerPrice: number | null
  reduceOnly: boolean
  status: PaperOrderStatus
  timeInForce: TimeInForce
  createdAt: number
  updatedAt: number
  /** Position id when placed as a bracket for that net position. */
  linkedPositionId: string | null
  marginMode?: MarginMode
  leverage?: number
  rejectReason?: string
}

export type PaperFill = {
  id: string
  orderId: string
  symbol: string
  side: PaperOrderSide
  size: number
  /** Actual execution price (after slippage when applicable). */
  price: number
  realizedPnl: number
  /** Absolute fee charged on this fill (deducted from balance). */
  fee: number
  createdAt: number
  executionReason?: PaperExecutionReason
}

/** Closed-trade summary for history UI (derived from closing fills). */
export type PaperClosedTrade = {
  id: string
  positionId: string
  symbol: string
  side: PaperSide
  quantity: number
  entryPrice: number
  exitPrice: number
  realizedPnl: number
  openedAt: number
  closedAt: number
  reason: PaperCloseReason
}

export type PaperAccount = {
  /** Paper wallet cash (fees + realized already applied). */
  balance: number
  /** Derived convenience: balance + unrealized (recomputed). */
  equity: number
}

export type PaperState = {
  version: 3
  /** User-configured demo starting capital (USDC). */
  startingBalance: number
  account: PaperAccount
  positions: PaperPosition[]
  orders: PaperOrder[]
  fills: PaperFill[]
  history: PaperClosedTrade[]
}

/** Ticket / market entry convenience (places MARKET + optional brackets). */
export type OpenPaperTradeInput = {
  symbol: string
  side: PaperSide
  quantity: number
  entryPrice: number
  stopLoss?: number | null
  takeProfit?: number | null
  marginMode?: MarginMode
  leverage?: number
  source?: PaperPositionSource
}

export type PlacePaperOrderInput = {
  symbol: string
  side: PaperOrderSide
  type: PaperOrderType
  size: number
  price?: number | null
  triggerPrice?: number | null
  reduceOnly?: boolean
  clientOrderId?: string | null
  timeInForce?: TimeInForce
  /** For MARKET immediate fill. */
  markPrice?: number
  /** Optional cap for partial market fill simulation. */
  maxFillSize?: number
  marginMode?: MarginMode
  leverage?: number
  source?: PaperPositionSource
}

export type PaperBarHit =
  | { kind: "none" }
  | { kind: "sl"; exitPrice: number; orderId: string }
  | { kind: "tp"; exitPrice: number; orderId: string }
  | { kind: "limit"; fillPrice: number; orderId: string }
  | { kind: "stop_market"; exitPrice: number; orderId: string }
  | { kind: "liquidation"; exitPrice: number; positionId: string }
  | { kind: "ambiguous"; exitPrice: number; orderIds: string[] }
