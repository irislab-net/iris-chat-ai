import type { CandleBar } from "@/lib/api/candles"

/** Provider-bound numeric value. Keep exact exchange values as strings. */
export type DecimalValue = string

export type TradingMode = "demo" | "real"
export type PositionSide = "LONG" | "SHORT"
export type OrderSide = "BUY" | "SELL"
export type MarginMode = "CROSS" | "ISOLATED"

/** Hyperliquid-compatible time in force. */
export type TimeInForce = "GTC" | "IOC" | "ALO" | "FRONTEND_MARKET"

/** Trigger order taxonomy aligned with Hyperliquid order types. */
export type TriggerOrderKind =
  | "NONE"
  | "STOP_LOSS"
  | "TAKE_PROFIT"
  | "STOP_MARKET"

/** Position liquidation risk state (read-only / derived). */
export type LiquidationStatus = "NONE" | "AT_RISK" | "LIQUIDATING" | "LIQUIDATED"

export type FundingRate = {
  symbol: string
  rate: DecimalValue
  updatedAt: number | null
}

export type FundingSnapshot = {
  rates: readonly FundingRate[]
  updatedAt: number | null
}

export type TradingCapabilities = {
  canReadAccount: boolean
  canReadPositions: boolean
  canSubmitOrders: boolean
  canCancelOrders: boolean
  canModifyOrders: boolean
  canUpdateLeverage: boolean
  canClosePositions: boolean
  /** Legacy aggregate — true when order submission is allowed. */
  canTrade: boolean
  canPlaceMarketOrders: boolean
  canPlaceLimitOrders: boolean
  canUseCrossMargin: boolean
  canUseIsolatedMargin: boolean
  canAdjustIsolatedMargin: boolean
  canSetStopLoss: boolean
  canSetTakeProfit: boolean
}

export type Market = {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: "ACTIVE" | "UNAVAILABLE"
  priceDecimals: number | null
  sizeDecimals: number
  maxLeverage: number
}

export type Balance = {
  asset: string
  total: DecimalValue
  available: DecimalValue
}

export type AccountSnapshot = {
  providerId: string
  accountId: string | null
  status: "CONNECTING" | "READY" | "STALE" | "ERROR" | "UNAVAILABLE"
  balances: Balance[]
  equity: DecimalValue | null
  availableBalance: DecimalValue | null
  initialMarginUsed: DecimalValue | null
  maintenanceMarginUsed: DecimalValue | null
  funding: FundingSnapshot | null
  updatedAt: number | null
}

export type Leverage = {
  value: number
  max: number
}

export type Position = {
  id: string
  symbol: string
  side: PositionSide
  quantity: DecimalValue
  entryPrice: DecimalValue
  markPrice: DecimalValue
  unrealizedPnl: DecimalValue
  realizedPnl: DecimalValue | null
  leverage: Leverage
  marginMode: MarginMode
  marginUsed: DecimalValue
  isolatedMargin: DecimalValue | null
  liquidationPrice: DecimalValue | null
  liquidationStatus: LiquidationStatus
  stopLoss: DecimalValue | null
  takeProfit: DecimalValue | null
  openedAt: number | null
  source?: "USER" | "IRIS_AI" | "EXTERNAL"
}

export type OrderStatus =
  | "PENDING"
  | "OPEN"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCEL_PENDING"
  | "CANCELLED"
  | "REJECTED"

export type OrderType =
  | "MARKET"
  | "LIMIT"
  | "STOP_MARKET"
  | "TAKE_PROFIT"
  | "STOP_LOSS"

export type Order = {
  id: string
  exchangeOrderId: string | null
  clientOrderId: string | null
  symbol: string
  side: OrderSide
  type: OrderType
  triggerKind: TriggerOrderKind
  status: OrderStatus
  quantity: DecimalValue
  filledQuantity: DecimalValue
  averageFillPrice: DecimalValue | null
  price: DecimalValue | null
  triggerPrice: DecimalValue | null
  timeInForce: TimeInForce
  reduceOnly: boolean
  linkedPositionId: string | null
  createdAt: number
  updatedAt: number
  rejectionReason: string | null
}

export type Fill = {
  id: string
  orderId: string
  exchangeTradeId: string | null
  symbol: string
  side: OrderSide
  quantity: DecimalValue
  price: DecimalValue
  fee: DecimalValue
  feeAsset: string
  realizedPnl: DecimalValue
  createdAt: number
}

export type ClosedTrade = {
  id: string
  positionId: string
  symbol: string
  side: PositionSide
  quantity: DecimalValue
  entryPrice: DecimalValue
  exitPrice: DecimalValue
  realizedPnl: DecimalValue
  openedAt: number
  closedAt: number
  reason: "MANUAL" | "TAKE_PROFIT" | "STOP_LOSS" | "AMBIGUOUS" | "LIQUIDATION"
}

export type OrderRequest = {
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: DecimalValue
  price?: DecimalValue | null
  triggerPrice?: DecimalValue | null
  reduceOnly?: boolean
  referencePrice?: DecimalValue
  marginMode?: MarginMode
  leverage?: number
  stopLoss?: DecimalValue | null
  takeProfit?: DecimalValue | null
  timeInForce?: TimeInForce
  clientOrderId?: string | null
  source?: "USER" | "IRIS_AI"
}

export type OrderResult =
  | { ok: true; status: "ACCEPTED" | "PENDING"; order: Order | null; position: Position | null }
  | { ok: false; status: "REJECTED"; error: TradingError }

export type TradingError = {
  code:
    | "ADAPTER_UNAVAILABLE"
    | "CAPABILITY_UNAVAILABLE"
    | "INVALID_REQUEST"
    | "ORDER_NOT_FOUND"
    | "POSITION_NOT_FOUND"
    | "PROVIDER_REJECTED"
    | "NOT_READY"
    | "SIGNER_UNAVAILABLE"
    | "ENTITLEMENT_REQUIRED"
    | "PERMISSION_EXPIRED"
    | "REPLAY_DETECTED"
    | "RECONCILIATION_REQUIRED"
    | "UNKNOWN"
  message: string
  retryable: boolean
  providerCode?: string
}

export type ExecutionLifecycleState =
  | "CREATED"
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "REJECTED"
  | "CANCELLED"
  | "FAILED"
  | "RECONCILIATION_REQUIRED"

export type ExecutionAction =
  | "PLACE_MARKET"
  | "CLOSE_POSITION"
  | "CANCEL_ORDER"
  | "MODIFY_ORDER"
  | "UPDATE_LEVERAGE"

export type ExecutionRecord = {
  id: string
  idempotencyKey: string
  clientOrderId: string
  action: ExecutionAction
  lifecycle: ExecutionLifecycleState
  symbol: string
  orderId: string | null
  exchangeOrderId: string | null
  createdAt: number
  updatedAt: number
  error: TradingError | null
}

export type ExecutionAuditEventType =
  | "EXECUTION_CREATED"
  | "EXECUTION_SUBMITTED"
  | "EXECUTION_ACKNOWLEDGED"
  | "EXECUTION_REJECTED"
  | "EXECUTION_RECONCILED"
  | "EXECUTION_FAILED"
  | "EXECUTION_REPLAY_BLOCKED"

export type ExecutionAuditEvent = {
  type: ExecutionAuditEventType
  executionId: string
  userId: string | null
  walletIdentityId: string | null
  idempotencyKey: string
  reason: string | null
  occurredAt: number
}

export type TradingSnapshot = {
  account: AccountSnapshot
  positions: Position[]
  openOrders: Order[]
  fills: Fill[]
  history: ClosedTrade[]
}

export type PositionProtectionUpdate = {
  stopLoss?: DecimalValue | null
  takeProfit?: DecimalValue | null
}

export type OrderUpdate = {
  quantity?: DecimalValue
  price?: DecimalValue | null
  triggerPrice?: DecimalValue | null
}

export type MarketReconciliation = {
  symbol: string
  bars: CandleBar[]
  intervalMs: number
}

export function decimal(value: number | string): DecimalValue {
  return typeof value === "string" ? value : String(value)
}

export function decimalNumber(value: DecimalValue | null | undefined): number {
  if (value == null) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
