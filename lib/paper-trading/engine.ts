import type {
  MarginMode,
  OpenPaperTradeInput,
  PaperAccount,
  PaperBarHit,
  PaperClosedTrade,
  PaperCloseReason,
  PaperExecutionReason,
  PaperFill,
  PaperOrder,
  PaperOrderSide,
  PaperOrderStatus,
  PaperOrderType,
  PaperPosition,
  PaperPositionSource,
  PaperSide,
  PaperState,
  PlacePaperOrderInput,
} from "@/lib/paper-trading/types"
import { positionIdForProvider } from "@/lib/trading/ids"
import { deriveOrderStatus } from "@/lib/trading/order-state"
import {
  isValidStopLoss,
  isValidTakeProfit,
} from "@/lib/paper-trading/levels"
import {
  limitFillFee,
  marketFillFee,
} from "@/lib/paper-trading/execution"
import {
  PAPER_DEFAULT_LEVERAGE,
  validateLeverage,
} from "@/lib/paper-trading/instruments"
import {
  availableBalance,
  calculateInitialMargin,
  calculateMaintenanceMargin,
  defaultLeverage,
  defaultMarginMode,
  isolatedAllocated,
  planOppositeFill,
  validateMarginForOpen,
} from "@/lib/paper-trading/margin"
import {
  calculateLiquidationPrice,
  crossLiquidationBatchIds,
  isCrossAccountLiquidatable,
  isolatedLiquidationBatchIds,
  liquidationTouchedBar,
} from "@/lib/paper-trading/liquidation"

export const PAPER_STORAGE_KEY = "iris-paper-trading-v2"
export const PAPER_HISTORY_LIMIT = 40
export const PAPER_FILLS_LIMIT = 200
export const PAPER_ORDERS_LIMIT = 100
/** Away reconciliation uses 1m Hyperliquid candles (existing IRIS source). */
export const PAPER_RECONCILE_TIMEFRAME = "1m"
export const PAPER_DEFAULT_BALANCE = 100_000
export const PAPER_MIN_BUDGET = 10
export const PAPER_MAX_BUDGET = 1_000_000
export const PAPER_STATE_VERSION = 3 as const

export function emptyPaperAccount(
  balance = PAPER_DEFAULT_BALANCE
): PaperAccount {
  return { balance, equity: balance }
}

export function emptyPaperState(
  startingBalance = PAPER_DEFAULT_BALANCE
): PaperState {
  return {
    version: PAPER_STATE_VERSION,
    startingBalance,
    account: emptyPaperAccount(startingBalance),
    positions: [],
    orders: [],
    fills: [],
    history: [],
  }
}

export function getPaperStartingBalance(state: PaperState): number {
  const configured = state.startingBalance
  if (typeof configured === "number" && configured > 0) return configured
  const balance = state.account.balance
  if (typeof balance === "number" && balance > 0) return balance
  return PAPER_DEFAULT_BALANCE
}

export function validatePaperBudget(amount: number): string | null {
  if (!Number.isFinite(amount)) return "INVALID_BUDGET"
  if (amount < PAPER_MIN_BUDGET) return "BUDGET_TOO_LOW"
  if (amount > PAPER_MAX_BUDGET) return "BUDGET_TOO_HIGH"
  return null
}

/** Reset demo account to a new starting budget (closes all positions/orders). */
export function resetPaperAccountToBudget(
  state: PaperState,
  budget: number
): PaperState {
  const error = validatePaperBudget(budget)
  if (error) return state
  return emptyPaperState(budget)
}

export function pnlOf(
  side: PaperSide,
  entryPrice: number,
  quantity: number,
  price: number
): number {
  const dir = side === "LONG" ? 1 : -1
  return (price - entryPrice) * quantity * dir
}

export function pnlPct(
  side: PaperSide,
  entryPrice: number,
  price: number
): number {
  if (entryPrice === 0) return 0
  const dir = side === "LONG" ? 1 : -1
  return ((price - entryPrice) / entryPrice) * 100 * dir
}

export function sideToOrderSide(side: PaperSide): PaperOrderSide {
  return side === "LONG" ? "BUY" : "SELL"
}

export function orderSideToPositionSide(side: PaperOrderSide): PaperSide {
  return side === "BUY" ? "LONG" : "SHORT"
}

function newId(): string {
  return crypto.randomUUID()
}

function paperPositionId(symbol: string): string {
  return positionIdForProvider("paper", symbol)
}

function newClientOrderId(): string {
  return `paper:${crypto.randomUUID()}`
}

function orderFilledQty(state: PaperState, orderId: string): number {
  return state.fills
    .filter((fill) => fill.orderId === orderId)
    .reduce((sum, fill) => sum + fill.size, 0)
}

function derivePaperOrderStatus(order: PaperOrder, filledQty: number): PaperOrderStatus {
  if (order.status === "CANCELED" || order.status === "REJECTED") {
    return order.status
  }
  const domainStatus = deriveOrderStatus({
    quantity: String(order.size),
    filledQuantity: String(filledQty),
    cancelled: false,
    rejected: false,
  })
  if (domainStatus === "CANCELLED") return "CANCELED"
  if (domainStatus === "PARTIALLY_FILLED") return "PARTIALLY_FILLED"
  if (domainStatus === "FILLED") return "FILLED"
  if (domainStatus === "REJECTED") return "REJECTED"
  if (domainStatus === "PENDING") return "PENDING"
  return "OPEN"
}

function syncOrderFromFills(state: PaperState, orderId: string, at: number): PaperState {
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) return state
  const filled = orderFilledQty(state, orderId)
  const status = derivePaperOrderStatus(order, filled)
  return {
    ...state,
    orders: state.orders.map((item) =>
      item.id === orderId ? { ...item, status, updatedAt: at } : item
    ),
  }
}

function appendPaperOrderFill(
  state: PaperState,
  orderId: string,
  input: {
    size: number
    price: number
    fee?: number
    reason?: PaperCloseReason
    at?: number
    marginMode?: MarginMode
    leverage?: number
    executionReason?: PaperExecutionReason
    source?: PaperPositionSource
  }
): PaperState {
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) return state
  const already = orderFilledQty(state, orderId)
  const remaining = order.size - already
  const fillSize = Math.min(input.size, remaining)
  if (!(fillSize > 0)) return state

  const at = input.at ?? Date.now()
  const next = applyFillToNetPosition(state, {
    orderId,
    symbol: order.symbol,
    side: order.side,
    size: fillSize,
    price: input.price,
    fee: input.fee ?? 0,
    reason: input.reason ?? "manual",
    at,
    marginMode: input.marginMode ?? order.marginMode,
    leverage: input.leverage ?? order.leverage,
    executionReason: input.executionReason ?? "USER",
    source: input.source,
  })
  return syncOrderFromFills(next, orderId, at)
}

/** Fill remaining quantity on an open or partially filled order (tests / continued execution). */
export function fillPaperOrderPartial(
  state: PaperState,
  orderId: string,
  input: { size: number; price: number; fee?: number; at?: number }
): PaperState {
  return appendPaperOrderFill(state, orderId, input)
}

function advanceCursor(
  pos: PaperPosition,
  nextCheckedAt: number
): PaperPosition {
  return {
    ...pos,
    lastCheckedAt: Math.max(pos.lastCheckedAt, nextCheckedAt),
  }
}

function syncBracketFields(
  pos: PaperPosition,
  orders: PaperOrder[]
): PaperPosition {
  const open = orders.filter(
    (o) =>
      o.status === "OPEN" &&
      o.symbol === pos.symbol &&
      (o.type === "STOP_LOSS" || o.type === "TAKE_PROFIT")
  )
  const sl = open.find((o) => o.type === "STOP_LOSS")
  const tp = open.find((o) => o.type === "TAKE_PROFIT")
  return {
    ...pos,
    stopLoss: sl?.triggerPrice ?? null,
    takeProfit: tp?.triggerPrice ?? null,
  }
}

function syncAllBrackets(state: PaperState): PaperState {
  return {
    ...state,
    positions: state.positions.map((p) => syncBracketFields(p, state.orders)),
  }
}

function recomputeEquity(state: PaperState): PaperState {
  const unrealized = state.positions.reduce((s, p) => s + p.unrealizedPnl, 0)
  return {
    ...state,
    account: {
      ...state.account,
      equity: state.account.balance + unrealized,
    },
  }
}

function pushFill(state: PaperState, fill: PaperFill): PaperState {
  return {
    ...state,
    fills: [fill, ...state.fills].slice(0, PAPER_FILLS_LIMIT),
  }
}

function pushHistory(
  state: PaperState,
  closed: PaperClosedTrade
): PaperState {
  return {
    ...state,
    history: [closed, ...state.history].slice(0, PAPER_HISTORY_LIMIT),
  }
}

function upsertPosition(
  state: PaperState,
  pos: PaperPosition | null,
  symbol: string
): PaperState {
  const key = symbol.trim().toUpperCase()
  const without = state.positions.filter((p) => p.symbol !== key)
  if (!pos) return { ...state, positions: without }
  return { ...state, positions: [...without, pos] }
}

function cancelOpenBracketsForSymbol(
  state: PaperState,
  symbol: string,
  now: number
): PaperState {
  const key = symbol.trim().toUpperCase()
  return {
    ...state,
    orders: state.orders.map((o) =>
      o.status === "OPEN" &&
      o.symbol === key &&
      (o.type === "STOP_LOSS" || o.type === "TAKE_PROFIT")
        ? { ...o, status: "CANCELED" as const, updatedAt: now }
        : o
    ),
  }
}

function resizeOpenBrackets(
  state: PaperState,
  symbol: string,
  size: number,
  positionId: string,
  now: number
): PaperState {
  const key = symbol.trim().toUpperCase()
  return {
    ...state,
    orders: state.orders.map((o) =>
      o.status === "OPEN" &&
      o.symbol === key &&
      (o.type === "STOP_LOSS" || o.type === "TAKE_PROFIT")
        ? {
            ...o,
            size,
            linkedPositionId: positionId,
            updatedAt: now,
          }
        : o
    ),
  }
}

/**
 * Apply a fill to the net position for `symbol`.
 * Same-direction → weighted average entry.
 * Opposite → reduce; excess size flips.
 * Margin mode / leverage on open & flip come from fill input; scale-in preserves.
 */
export function applyFillToNetPosition(
  state: PaperState,
  input: {
    orderId: string
    symbol: string
    side: PaperOrderSide
    size: number
    price: number
    fee?: number
    reason?: PaperCloseReason
    at?: number
    marginMode?: MarginMode
    leverage?: number
    executionReason?: PaperExecutionReason
    source?: PaperPositionSource
  }
): PaperState {
  const symbol = input.symbol.trim().toUpperCase()
  const size = input.size
  const price = input.price
  const fee = input.fee ?? 0
  const at = input.at ?? Date.now()
  if (!(size > 0) || !(price > 0)) return state

  const fill: PaperFill = {
    id: newId(),
    orderId: input.orderId,
    symbol,
    side: input.side,
    size,
    price,
    realizedPnl: 0,
    fee,
    createdAt: at,
    executionReason: input.executionReason ?? "USER",
  }

  // Debit fee immediately (deterministic accounting).
  const stateWithFee: PaperState =
    fee > 0
      ? {
          ...state,
          account: {
            ...state.account,
            balance: state.account.balance - fee,
          },
        }
      : state

  const existing = stateWithFee.positions.find((p) => p.symbol === symbol)
  const fillSide = orderSideToPositionSide(input.side)

  // Flat → open
  if (!existing) {
    const marginMode = input.marginMode ?? defaultMarginMode()
    const leverage = input.leverage ?? defaultLeverage()
    const isolatedMargin =
      marginMode === "ISOLATED"
        ? calculateInitialMargin(size, price, leverage)
        : undefined
    const pos: PaperPosition = {
      id: paperPositionId(symbol),
      symbol,
      side: fillSide,
      quantity: size,
      entryPrice: price,
      realizedPnl: 0,
      openedAt: at,
      lastCheckedAt: at,
      markPrice: price,
      unrealizedPnl: 0,
      stopLoss: null,
      takeProfit: null,
      marginMode,
      leverage,
      isolatedMargin,
      source: input.source,
    }
    let next = pushFill(stateWithFee, fill)
    next = upsertPosition(next, pos, symbol)
    return recomputeEquity(syncAllBrackets(next))
  }

  // Same direction → average in
  if (existing.side === fillSide) {
    const newQty = existing.quantity + size
    const newEntry =
      (existing.entryPrice * existing.quantity + price * size) / newQty
    const addMargin =
      existing.marginMode === "ISOLATED"
        ? calculateInitialMargin(size, price, existing.leverage)
        : 0
    const pos: PaperPosition = {
      ...existing,
      quantity: newQty,
      entryPrice: newEntry,
      markPrice: price,
      unrealizedPnl: pnlOf(existing.side, newEntry, newQty, price),
      lastCheckedAt: Math.max(existing.lastCheckedAt, at),
      isolatedMargin:
        existing.marginMode === "ISOLATED"
          ? isolatedAllocated(existing) + addMargin
          : existing.isolatedMargin,
    }
    let next = pushFill(stateWithFee, fill)
    next = upsertPosition(next, pos, symbol)
    next = resizeOpenBrackets(next, symbol, newQty, pos.id, at)
    return recomputeEquity(syncAllBrackets(next))
  }

  // Opposite direction → reduce / close / flip
  const closeQty = Math.min(existing.quantity, size)
  const realized = pnlOf(existing.side, existing.entryPrice, closeQty, price)
  fill.realizedPnl = realized

  const remaining = existing.quantity - closeQty
  const excess = size - closeQty
  let next = pushFill(stateWithFee, { ...fill })

  // Credit realized to paper balance (fees already deducted).
  next = {
    ...next,
    account: {
      ...next.account,
      balance: next.account.balance + realized,
    },
  }

  const reason = input.reason ?? "manual"

  if (remaining <= 1e-12) {
    // Fully closed
    next = pushHistory(next, {
      id: newId(),
      positionId: existing.id,
      symbol,
      side: existing.side,
      quantity: closeQty,
      entryPrice: existing.entryPrice,
      exitPrice: price,
      realizedPnl: realized,
      openedAt: existing.openedAt,
      closedAt: at,
      reason,
    })
    next = cancelOpenBracketsForSymbol(next, symbol, at)
    next = upsertPosition(next, null, symbol)

    if (excess > 1e-12) {
      // Flip remainder — use order margin config, do not inherit stale isolated.
      const marginMode = input.marginMode ?? defaultMarginMode()
      const leverage = input.leverage ?? defaultLeverage()
      const isolatedMargin =
        marginMode === "ISOLATED"
          ? calculateInitialMargin(excess, price, leverage)
          : undefined
      const flipped: PaperPosition = {
        id: paperPositionId(symbol),
        symbol,
        side: fillSide,
        quantity: excess,
        entryPrice: price,
        realizedPnl: 0,
        openedAt: at,
        lastCheckedAt: at,
        markPrice: price,
        unrealizedPnl: 0,
        stopLoss: null,
        takeProfit: null,
        marginMode,
        leverage,
        isolatedMargin,
        source: input.source,
      }
      next = upsertPosition(next, flipped, symbol)
    }
  } else {
    // Partial reduce — entry unchanged; release proportional isolated margin.
    const iso =
      existing.marginMode === "ISOLATED"
        ? isolatedAllocated(existing) * (remaining / existing.quantity)
        : existing.isolatedMargin
    const pos: PaperPosition = {
      ...existing,
      quantity: remaining,
      realizedPnl: existing.realizedPnl + realized,
      markPrice: price,
      unrealizedPnl: pnlOf(existing.side, existing.entryPrice, remaining, price),
      lastCheckedAt: Math.max(existing.lastCheckedAt, at),
      isolatedMargin: existing.marginMode === "ISOLATED" ? iso : existing.isolatedMargin,
    }
    next = upsertPosition(next, pos, symbol)
    next = resizeOpenBrackets(next, symbol, remaining, pos.id, at)
  }

  return recomputeEquity(syncAllBrackets(next))
}

function validateBracketGeometry(
  side: PaperSide,
  entry: number,
  type: PaperOrderType,
  trigger: number
): string | null {
  if (type === "STOP_LOSS") {
    if (!isValidStopLoss(side, entry, trigger)) {
      return side === "LONG"
        ? "Stop loss must be below entry for LONG"
        : "Stop loss must be above entry for SHORT"
    }
  }
  if (type === "TAKE_PROFIT") {
    if (!isValidTakeProfit(side, entry, trigger)) {
      return side === "LONG"
        ? "Take profit must be above entry for LONG"
        : "Take profit must be below entry for SHORT"
    }
  }
  return null
}

/**
 * Place an order. MARKET fills immediately at markPrice.
 * LIMIT / STOP_* stay OPEN until filled/canceled (LIMIT resting not auto-matched in V2 live path yet —
 * only trigger TP/SL / STOP_MARKET are evaluated on mark/bars).
 */
export function placePaperOrder(
  state: PaperState,
  input: PlacePaperOrderInput
): { state: PaperState; error?: string; order?: PaperOrder } {
  const symbol = input.symbol.trim().toUpperCase()
  if (!symbol) return { state, error: "Symbol required" }
  if (!(input.size > 0)) return { state, error: "Size must be positive" }

  const now = Date.now()
  const pos = state.positions.find((p) => p.symbol === symbol)

  if (input.reduceOnly) {
    if (!pos) return { state, error: "No position to reduce" }
    const closingSide: PaperOrderSide = pos.side === "LONG" ? "SELL" : "BUY"
    if (input.side !== closingSide) {
      return { state, error: "Reduce-only side must close the position" }
    }
  }

  if (
    (input.type === "TAKE_PROFIT" ||
      input.type === "STOP_LOSS" ||
      input.type === "STOP_MARKET") &&
    (input.triggerPrice == null || !(input.triggerPrice > 0))
  ) {
    return { state, error: "Trigger price required" }
  }

  if (input.type === "LIMIT" && (input.price == null || !(input.price > 0))) {
    return { state, error: "Limit price required" }
  }

  if (
    (input.type === "TAKE_PROFIT" || input.type === "STOP_LOSS") &&
    pos &&
    input.reduceOnly
  ) {
    const err = validateBracketGeometry(
      pos.side,
      pos.entryPrice,
      input.type,
      input.triggerPrice!
    )
    if (err) return { state, error: err }
  }

  const requestedMode = input.marginMode ?? defaultMarginMode()
  const requestedLev = input.leverage ?? defaultLeverage()
  const levCheck = validateLeverage(symbol, requestedLev)
  if (!input.reduceOnly && !levCheck.ok) {
    return { state, error: levCheck.error }
  }

  const order: PaperOrder = {
    id: newId(),
    symbol,
    side: input.side,
    type: input.type,
    size: input.size,
    price: input.price ?? null,
    triggerPrice: input.triggerPrice ?? null,
    reduceOnly: Boolean(input.reduceOnly),
    status: input.type === "MARKET" ? "PENDING" : "OPEN",
    createdAt: now,
    updatedAt: now,
    linkedPositionId: pos?.id ?? paperPositionId(symbol),
    clientOrderId: input.clientOrderId ?? newClientOrderId(),
    timeInForce:
      input.timeInForce ?? (input.type === "MARKET" ? "FRONTEND_MARKET" : "GTC"),
    marginMode: requestedMode,
    leverage: requestedLev,
  }

  let next: PaperState = {
    ...state,
    orders: [order, ...state.orders].slice(0, PAPER_ORDERS_LIMIT),
  }

  if (input.type === "MARKET") {
    const mark = input.markPrice
    if (mark == null || !(mark > 0)) {
      return { state, error: "Mark price required for market order" }
    }

    let fillSize = order.size
    if (input.maxFillSize != null && input.maxFillSize > 0) {
      fillSize = Math.min(fillSize, input.maxFillSize)
    }
    if (order.reduceOnly && pos) {
      fillSize = Math.min(fillSize, pos.quantity)
    }

    const fillSide = orderSideToPositionSide(order.side)
    let marginMode = requestedMode
    let leverage = requestedLev

    if (!order.reduceOnly && pos) {
      if (pos.side === fillSide) {
        // Scale-in: preserve position margin config.
        marginMode = pos.marginMode
        leverage = pos.leverage
        const check = validateMarginForOpen({
          state: next,
          symbol,
          side: fillSide,
          size: fillSize,
          markPrice: mark,
          marginMode,
          leverage,
        })
        if (!check.ok) {
          next = {
            ...next,
            orders: next.orders.map((o) =>
              o.id === order.id
                ? {
                    ...o,
                    status: "REJECTED" as const,
                    updatedAt: now,
                    rejectReason: check.error,
                  }
                : o
            ),
          }
          return {
            state: next,
            error: check.error,
            order: {
              ...order,
              status: "REJECTED",
              rejectReason: check.error,
            },
          }
        }
      } else {
        // Opposite: close first; margin-check only opening remainder.
        const plan = planOppositeFill({
          position: pos,
          orderSide: order.side,
          size: fillSize,
          markPrice: mark,
          marginMode: requestedMode,
          leverage: requestedLev,
          state: next,
        })
        if (plan.openQty > 1e-12 && plan.openMargin && !plan.openMargin.ok) {
          // Execute close only; reject opening remainder.
          const marginErr = plan.openMargin.error
          fillSize = plan.closeQty
          if (!(fillSize > 0)) {
            next = {
              ...next,
              orders: next.orders.map((o) =>
                o.id === order.id
                  ? {
                      ...o,
                      status: "REJECTED" as const,
                      updatedAt: now,
                      rejectReason: marginErr,
                    }
                  : o
              ),
            }
            return {
              state: next,
              error: marginErr,
              order: {
                ...order,
                status: "REJECTED",
                rejectReason: marginErr,
              },
            }
          }
          // Opening remainder dropped — close proceeds.
          marginMode = requestedMode
          leverage = requestedLev
        } else if (plan.openQty > 1e-12) {
          marginMode = requestedMode
          leverage = requestedLev
        }
      }
    } else if (!order.reduceOnly && !pos) {
      const check = validateMarginForOpen({
        state: next,
        symbol,
        side: fillSide,
        size: fillSize,
        markPrice: mark,
        marginMode,
        leverage,
      })
      if (!check.ok) {
        next = {
          ...next,
          orders: next.orders.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  status: "REJECTED" as const,
                  updatedAt: now,
                  rejectReason: check.error,
                }
              : o
          ),
        }
        return {
          state: next,
          error: check.error,
          order: {
            ...order,
            status: "REJECTED",
            rejectReason: check.error,
          },
        }
      }
    }

    if (!(fillSize > 0)) {
      return { state, error: "Nothing to fill" }
    }

    const { price, fee } = marketFillFee(order.side, fillSize, mark)
    next = appendPaperOrderFill(next, order.id, {
      size: fillSize,
      price,
      fee,
      reason: "manual",
      at: now,
      marginMode,
      leverage,
      executionReason: "USER",
      source: input.source,
    })
    const filledOrder = next.orders.find((item) => item.id === order.id)
    return { state: next, order: filledOrder ?? order }
  }

  // Resting orders that may open/increase: reject early if leverage invalid.
  // LIMIT open margin is checked at fill time.
  next = syncAllBrackets(next)
  return { state: next, order }
}

export function cancelPaperOrder(
  state: PaperState,
  orderId: string
): { state: PaperState; error?: string } {
  const idx = state.orders.findIndex((o) => o.id === orderId)
  if (idx < 0) return { state, error: "Order not found" }
  const order = state.orders[idx]!
  if (order.status !== "OPEN" && order.status !== "PARTIALLY_FILLED") {
    return { state, error: "Order not open" }
  }
  const now = Date.now()
  let next: PaperState = {
    ...state,
    orders: state.orders.map((o) =>
      o.id === orderId
        ? { ...o, status: "CANCELED" as const, updatedAt: now }
        : o
    ),
  }
  next = syncAllBrackets(next)
  return { state: next }
}

export function modifyPaperOrder(
  state: PaperState,
  orderId: string,
  mods: { triggerPrice?: number; size?: number; price?: number }
): { state: PaperState; error?: string; order?: PaperOrder } {
  const idx = state.orders.findIndex((o) => o.id === orderId)
  if (idx < 0) return { state, error: "Order not found" }
  const order = state.orders[idx]!
  if (order.status !== "OPEN" && order.status !== "PARTIALLY_FILLED") {
    return { state, error: "Order not open" }
  }

  const pos = state.positions.find((p) => p.symbol === order.symbol)
  const trigger =
    mods.triggerPrice !== undefined ? mods.triggerPrice : order.triggerPrice
  if (
    (order.type === "TAKE_PROFIT" || order.type === "STOP_LOSS") &&
    pos &&
    trigger != null
  ) {
    const err = validateBracketGeometry(
      pos.side,
      pos.entryPrice,
      order.type,
      trigger
    )
    if (err) return { state, error: err }
  }

  const now = Date.now()
  const updated: PaperOrder = {
    ...order,
    triggerPrice:
      mods.triggerPrice !== undefined ? mods.triggerPrice : order.triggerPrice,
    size: mods.size !== undefined ? mods.size : order.size,
    price: mods.price !== undefined ? mods.price : order.price,
    updatedAt: now,
  }
  let next: PaperState = {
    ...state,
    orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
  }
  next = syncAllBrackets(next)
  return { state: next, order: updated }
}

function primaryBracket(
  state: PaperState,
  symbol: string,
  type: "STOP_LOSS" | "TAKE_PROFIT"
): PaperOrder | undefined {
  return state.orders.find(
    (o) =>
      o.status === "OPEN" &&
      o.symbol === symbol.trim().toUpperCase() &&
      o.type === type
  )
}

function upsertBracketOrder(
  state: PaperState,
  pos: PaperPosition,
  type: "STOP_LOSS" | "TAKE_PROFIT",
  trigger: number | null
): { state: PaperState; error?: string } {
  const existing = primaryBracket(state, pos.symbol, type)
  if (trigger == null) {
    if (!existing) return { state }
    return cancelPaperOrder(state, existing.id)
  }
  const err = validateBracketGeometry(pos.side, pos.entryPrice, type, trigger)
  if (err) return { state, error: err }

  const side: PaperOrderSide = pos.side === "LONG" ? "SELL" : "BUY"
  if (existing) {
    return modifyPaperOrder(state, existing.id, {
      triggerPrice: trigger,
      size: pos.quantity,
    })
  }
  return placePaperOrder(state, {
    symbol: pos.symbol,
    side,
    type,
    size: pos.quantity,
    triggerPrice: trigger,
    reduceOnly: true,
  })
}

/**
 * Market entry convenience used by the ticket.
 * Adds / reduces / flips the net position (no longer rejects a second trade).
 * Optional SL/TP become reduce-only trigger orders.
 */
export function openPaperTrade(
  state: PaperState,
  input: OpenPaperTradeInput
): { state: PaperState; error?: string; position?: PaperPosition } {
  const symbol = input.symbol.trim().toUpperCase()
  if (!symbol) return { state, error: "Symbol required" }
  if (!(input.quantity > 0)) return { state, error: "Quantity must be positive" }
  if (!(input.entryPrice > 0)) return { state, error: "Entry must be positive" }

  const market = placePaperOrder(state, {
    symbol,
    side: sideToOrderSide(input.side),
    type: "MARKET",
    size: input.quantity,
    markPrice: input.entryPrice,
    reduceOnly: false,
    marginMode: input.marginMode ?? defaultMarginMode(),
    leverage: input.leverage ?? defaultLeverage(),
    source: input.source,
  })
  if (market.error) return { state: market.state, error: market.error }

  let next = market.state
  let pos = next.positions.find((p) => p.symbol === symbol)

  // Flat after reduce is a valid outcome (full close).
  if (!pos) {
    return { state: next }
  }

  if (input.stopLoss !== undefined) {
    const sl = upsertBracketOrder(next, pos, "STOP_LOSS", input.stopLoss)
    if (sl.error) return { state: next, error: sl.error }
    next = sl.state
  }
  if (input.takeProfit !== undefined) {
    pos = next.positions.find((p) => p.symbol === symbol)
    if (pos) {
      const tp = upsertBracketOrder(
        next,
        pos,
        "TAKE_PROFIT",
        input.takeProfit
      )
      if (tp.error) return { state: next, error: tp.error }
      next = tp.state
    }
  }

  return {
    state: next,
    position: next.positions.find((p) => p.symbol === symbol),
  }
}

export function closePaperPosition(
  state: PaperState,
  positionId: string,
  markPrice: number
): PaperState {
  const pos = state.positions.find((p) => p.id === positionId)
  if (!pos || !(markPrice > 0)) return state
  const result = placePaperOrder(state, {
    symbol: pos.symbol,
    side: pos.side === "LONG" ? "SELL" : "BUY",
    type: "MARKET",
    size: pos.quantity,
    markPrice,
    reduceOnly: true,
  })
  return result.state
}

/**
 * Update primary SL/TP orders for a position (chart drag / ticket clear).
 */
export function modifyPaperPosition(
  state: PaperState,
  positionId: string,
  mods: { stopLoss?: number | null; takeProfit?: number | null }
): { state: PaperState; error?: string; position?: PaperPosition } {
  const pos = state.positions.find((p) => p.id === positionId)
  if (!pos) return { state, error: "Position not found" }

  let next = state
  if (mods.stopLoss !== undefined) {
    const r = upsertBracketOrder(next, pos, "STOP_LOSS", mods.stopLoss)
    if (r.error) return { state: next, error: r.error }
    next = r.state
  }
  if (mods.takeProfit !== undefined) {
    const latest = next.positions.find((p) => p.id === positionId)
    if (!latest) return { state: next, error: "Position not found" }
    const r = upsertBracketOrder(next, latest, "TAKE_PROFIT", mods.takeProfit)
    if (r.error) return { state: next, error: r.error }
    next = r.state
  }

  return {
    state: next,
    position: next.positions.find((p) => p.id === positionId),
  }
}

function isStopTriggerType(type: PaperOrderType) {
  return type === "STOP_LOSS" || type === "STOP_MARKET"
}

function isTakeTriggerType(type: PaperOrderType) {
  return type === "TAKE_PROFIT"
}

function triggerTouched(
  _pos: PaperPosition | undefined,
  order: PaperOrder,
  bar: { h: number; l: number }
): boolean {
  const t = order.triggerPrice
  if (t == null) return false
  if (isStopTriggerType(order.type)) {
    return order.side === "BUY" ? bar.h >= t : bar.l <= t
  }
  if (isTakeTriggerType(order.type)) {
    return order.side === "BUY" ? bar.l <= t : bar.h >= t
  }
  return false
}

function triggerHitMark(
  _pos: PaperPosition | undefined,
  order: PaperOrder,
  price: number
): boolean {
  const t = order.triggerPrice
  if (t == null) return false
  if (isStopTriggerType(order.type)) {
    return order.side === "BUY" ? price >= t : price <= t
  }
  if (isTakeTriggerType(order.type)) {
    return order.side === "BUY" ? price <= t : price >= t
  }
  return false
}

function limitTouched(
  order: PaperOrder,
  bar: { h: number; l: number }
): boolean {
  if (order.type !== "LIMIT" || order.price == null) return false
  return order.side === "BUY" ? bar.l <= order.price : bar.h >= order.price
}

/** All OPEN orders for symbol that touch this OHLC bar. */
export function ordersTouchingBar(
  state: PaperState,
  symbol: string,
  pos: PaperPosition | undefined,
  bar: { h: number; l: number }
): PaperOrder[] {
  const key = symbol.trim().toUpperCase()
  return state.orders.filter((o) => {
    if (o.status !== "OPEN" && o.status !== "PARTIALLY_FILLED") return false
    if (o.symbol !== key) return false
    if (o.type === "LIMIT") return limitTouched(o, bar)
    if (
      o.type === "STOP_LOSS" ||
      o.type === "TAKE_PROFIT" ||
      o.type === "STOP_MARKET"
    ) {
      return triggerTouched(pos, o, bar)
    }
    return false
  })
}

/**
 * Evaluate executable resting/trigger orders against a candle.
 * If more than one order touches and chronology cannot be proven → AMBIGUOUS.
 * Liquidation threshold touch is included in the same event set.
 */
export function evaluateBarExecutions(
  state: PaperState,
  symbol: string,
  pos: PaperPosition | undefined,
  bar: { h: number; l: number; c: number },
  options?: { partial?: boolean }
): PaperBarHit {
  const touched = ordersTouchingBar(state, symbol, pos, bar)
  const liqTouched =
    pos != null && liquidationTouchedBar(pos, state, bar)
      ? pos
      : null

  const eventCount = touched.length + (liqTouched ? 1 : 0)
  if (eventCount === 0) return { kind: "none" }

  if (eventCount > 1 || (options?.partial && eventCount >= 1)) {
    const orderIds = touched.map((o) => o.id)
    if (liqTouched) orderIds.push(`liquidation:${liqTouched.id}`)
    return {
      kind: "ambiguous",
      exitPrice: bar.c,
      orderIds,
    }
  }

  if (liqTouched) {
    const liq = calculateLiquidationPrice(liqTouched, state)
    return {
      kind: "liquidation",
      exitPrice: liq != null && liq > 0 ? liq : bar.c,
      positionId: liqTouched.id,
    }
  }

  const order = touched[0]!
  if (order.type === "LIMIT") {
    return {
      kind: "limit",
      fillPrice: order.price!,
      orderId: order.id,
    }
  }
  if (order.type === "STOP_LOSS") {
    return {
      kind: "sl",
      exitPrice: order.triggerPrice!,
      orderId: order.id,
    }
  }
  if (order.type === "TAKE_PROFIT") {
    return {
      kind: "tp",
      exitPrice: order.triggerPrice!,
      orderId: order.id,
    }
  }
  if (order.type === "STOP_MARKET") {
    return {
      kind: "stop_market",
      exitPrice: order.triggerPrice!,
      orderId: order.id,
    }
  }
  return { kind: "none" }
}

/**
 * Evaluate open SL/TP orders against a candle (compat wrapper).
 * Same-candle dual touch → AMBIGUOUS.
 */
export function evaluateBarHit(
  pos: PaperPosition,
  bar: { h: number; l: number; c: number },
  orders: { sl?: PaperOrder; tp?: PaperOrder },
  options?: { partial?: boolean }
): PaperBarHit {
  const fakeState: PaperState = {
    ...emptyPaperState(),
    positions: [pos],
    orders: [orders.sl, orders.tp].filter(Boolean) as PaperOrder[],
  }
  return evaluateBarExecutions(fakeState, pos.symbol, pos, bar, options)
}

/** @deprecated Prefer evaluateBarHit with orders. */
export function hitFromBar(
  pos: PaperPosition,
  bar: { h: number; l: number; c?: number },
  options?: { partial?: boolean }
): { reason: PaperCloseReason; exitPrice: number } | null {
  const fakeOrders = {
    sl:
      pos.stopLoss != null
        ? ({
            id: "sl",
            type: "STOP_LOSS",
            triggerPrice: pos.stopLoss,
          } as PaperOrder)
        : undefined,
    tp:
      pos.takeProfit != null
        ? ({
            id: "tp",
            type: "TAKE_PROFIT",
            triggerPrice: pos.takeProfit,
          } as PaperOrder)
        : undefined,
  }
  const hit = evaluateBarHit(
    pos,
    { h: bar.h, l: bar.l, c: bar.c ?? (bar.h + bar.l) / 2 },
    fakeOrders,
    options
  )
  if (hit.kind === "none" || hit.kind === "limit" || hit.kind === "stop_market") {
    return null
  }
  if (hit.kind === "liquidation") {
    return { reason: "liquidation", exitPrice: hit.exitPrice }
  }
  return {
    reason: hit.kind === "ambiguous" ? "ambiguous" : hit.kind,
    exitPrice: hit.exitPrice,
  }
}

function fillAggressiveOrder(
  state: PaperState,
  orderId: string,
  referencePrice: number,
  reason: PaperCloseReason,
  at: number
): PaperState {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== "OPEN") return state

  const pos = state.positions.find((p) => p.symbol === order.symbol)
  let fillSize = order.size
  if (order.reduceOnly && pos) {
    fillSize = Math.min(fillSize, pos.quantity)
  }
  if (!(fillSize > 0)) return state

  const { price, fee } = marketFillFee(order.side, fillSize, referencePrice)
  return appendPaperOrderFill(state, orderId, {
    size: fillSize,
    price,
    fee,
    reason,
    at,
    marginMode: order.marginMode ?? pos?.marginMode,
    leverage: order.leverage ?? pos?.leverage,
    executionReason:
      reason === "tp" ? "TP" : reason === "sl" ? "SL" : "USER",
  })
}

function fillLimitOrder(
  state: PaperState,
  orderId: string,
  at: number
): PaperState {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== "OPEN" || order.price == null) return state

  const pos = state.positions.find((p) => p.symbol === order.symbol)
  let fillSize = order.size
  if (order.reduceOnly && pos) {
    fillSize = Math.min(fillSize, pos.quantity)
  }
  if (!(fillSize > 0)) return state

  const fillSide = orderSideToPositionSide(order.side)
  let marginMode = order.marginMode ?? defaultMarginMode()
  let leverage = order.leverage ?? defaultLeverage()

  if (!order.reduceOnly) {
    if (pos && pos.side === fillSide) {
      marginMode = pos.marginMode
      leverage = pos.leverage
      const check = validateMarginForOpen({
        state,
        symbol: order.symbol,
        side: fillSide,
        size: fillSize,
        markPrice: order.price,
        marginMode,
        leverage,
      })
      if (!check.ok) {
        return {
          ...state,
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "REJECTED" as const,
                  updatedAt: at,
                  rejectReason: check.error,
                }
              : o
          ),
        }
      }
    } else if (pos && pos.side !== fillSide) {
      const plan = planOppositeFill({
        position: pos,
        orderSide: order.side,
        size: fillSize,
        markPrice: order.price,
        marginMode,
        leverage,
        state,
      })
      if (plan.openQty > 1e-12 && plan.openMargin && !plan.openMargin.ok) {
        const marginErr = plan.openMargin.error
        fillSize = plan.closeQty
        if (!(fillSize > 0)) {
          return {
            ...state,
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: "REJECTED" as const,
                    updatedAt: at,
                    rejectReason: marginErr,
                  }
                : o
            ),
          }
        }
      }
    } else if (!pos) {
      const check = validateMarginForOpen({
        state,
        symbol: order.symbol,
        side: fillSide,
        size: fillSize,
        markPrice: order.price,
        marginMode,
        leverage,
      })
      if (!check.ok) {
        return {
          ...state,
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "REJECTED" as const,
                  updatedAt: at,
                  rejectReason: check.error,
                }
              : o
          ),
        }
      }
    }
  }

  const fee = limitFillFee(fillSize, order.price)
  return appendPaperOrderFill(state, orderId, {
    size: fillSize,
    price: order.price,
    fee,
    reason: "manual",
    at,
    marginMode,
    leverage,
    executionReason: "USER",
  })
}

/**
 * Full position liquidation through the same MARKET → Fill → Net pipeline.
 */
export function liquidatePosition(
  state: PaperState,
  positionId: string,
  at: number,
  referencePrice?: number
): PaperState {
  const pos = state.positions.find((p) => p.id === positionId)
  if (!pos) return state

  const mark =
    referencePrice != null && referencePrice > 0
      ? referencePrice
      : calculateLiquidationPrice(pos, state) ?? pos.markPrice
  if (!(mark > 0)) return state

  const side: PaperOrderSide = pos.side === "LONG" ? "SELL" : "BUY"
  const orderId = `liq:${pos.id}:${at}`
  // Idempotency: skip if this liquidation order already filled.
  if (state.fills.some((f) => f.orderId === orderId)) return state

  const order: PaperOrder = {
    id: orderId,
    clientOrderId: newClientOrderId(),
    symbol: pos.symbol,
    side,
    type: "MARKET",
    size: pos.quantity,
    price: null,
    triggerPrice: null,
    reduceOnly: true,
    status: "FILLED",
    timeInForce: "FRONTEND_MARKET",
    createdAt: at,
    updatedAt: at,
    linkedPositionId: pos.id,
    marginMode: pos.marginMode,
    leverage: pos.leverage,
  }

  const { price, fee } = marketFillFee(side, pos.quantity, mark)
  let next: PaperState = {
    ...state,
    orders: [order, ...state.orders].slice(0, PAPER_ORDERS_LIMIT),
  }
  next = applyFillToNetPosition(next, {
    orderId,
    symbol: pos.symbol,
    side,
    size: pos.quantity,
    price,
    fee,
    reason: "liquidation",
    at,
    marginMode: pos.marginMode,
    leverage: pos.leverage,
    executionReason: "LIQUIDATION",
  })
  // Brackets canceled inside applyFill on full close.
  return next
}

/**
 * Isolated first (symbol sort), then if cross account liquidatable,
 * liquidate all CROSS positions in symbol-sorted batch.
 */
export function processLiquidations(
  state: PaperState,
  at: number
): PaperState {
  let next = state

  for (const id of isolatedLiquidationBatchIds(next)) {
    next = liquidatePosition(next, id, at)
  }

  if (isCrossAccountLiquidatable(next)) {
    const batch = crossLiquidationBatchIds(next)
    for (const id of batch) {
      next = liquidatePosition(next, id, at)
    }
  }

  return next
}

/**
 * Same-candle multi-touch: do not invent chronology.
 * Cancel/consume all touched orders; if a net position exists and any
 * position-closing order was among them, close at bar mid with economics.
 */
function fillAmbiguous(
  state: PaperState,
  symbol: string,
  pos: PaperPosition | undefined,
  exitPrice: number,
  orderIds: string[],
  at: number
): PaperState {
  const realOrderIds = orderIds.filter((id) => !id.startsWith("liquidation:"))
  let next: PaperState = {
    ...state,
    orders: state.orders.map((o) =>
      realOrderIds.includes(o.id) && o.status === "OPEN"
        ? { ...o, status: "CANCELED" as const, updatedAt: at }
        : o
    ),
  }

  const touched = state.orders.filter((o) => realOrderIds.includes(o.id))
  const hasLiq = orderIds.some((id) => id.startsWith("liquidation:"))
  const closesPosition =
    hasLiq ||
    touched.some(
      (o) =>
        o.reduceOnly ||
        o.type === "STOP_LOSS" ||
        o.type === "TAKE_PROFIT" ||
        (pos != null &&
          ((pos.side === "LONG" && o.side === "SELL") ||
            (pos.side === "SHORT" && o.side === "BUY")))
    )

  if (pos && closesPosition) {
    const closingSide: PaperOrderSide = pos.side === "LONG" ? "SELL" : "BUY"
    const { price, fee } = marketFillFee(closingSide, pos.quantity, exitPrice)
    next = applyFillToNetPosition(next, {
      orderId: realOrderIds[0] ?? orderIds[0] ?? "ambiguous",
      symbol: pos.symbol,
      side: closingSide,
      size: pos.quantity,
      price,
      fee,
      reason: "ambiguous",
      at,
      executionReason: "AMBIGUOUS",
    })
  }

  return syncAllBrackets(next)
}

/** Mark-to-market + instant trigger evaluation on last price. */
export function markPaperPrice(
  state: PaperState,
  symbol: string,
  price: number,
  checkedAt = Date.now()
): PaperState {
  const key = symbol.trim().toUpperCase()
  let next = state
  const pos = next.positions.find((p) => p.symbol === key)
  const triggered = next.orders.filter(
    (order) =>
      order.symbol === key &&
      (order.status === "OPEN" || order.status === "PARTIALLY_FILLED") &&
      (order.type === "STOP_LOSS" ||
        order.type === "TAKE_PROFIT" ||
        order.type === "STOP_MARKET") &&
      triggerHitMark(pos, order, price)
  )

  if (triggered.length > 1) {
    next = fillAmbiguous(
      next,
      key,
      pos,
      price,
      triggered.map((order) => order.id),
      checkedAt
    )
  } else if (triggered[0]) {
    const order = triggered[0]
    next = fillAggressiveOrder(
      next,
      order.id,
      order.triggerPrice ?? price,
      order.type === "TAKE_PROFIT"
        ? "tp"
        : order.type === "STOP_LOSS"
          ? "sl"
          : "manual",
      checkedAt
    )
  } else if (pos) {
    next = {
      ...next,
      positions: next.positions.map((p) =>
        p.id === pos.id
          ? advanceCursor(
              {
                ...p,
                markPrice: price,
                unrealizedPnl: pnlOf(p.side, p.entryPrice, p.quantity, price),
              },
              checkedAt
            )
          : p
      ),
    }
  }

  next = recomputeEquity(next)
  next = processLiquidations(next, checkedAt)
  return recomputeEquity(next)
}

export function reconcilePaperBars(
  state: PaperState,
  symbol: string,
  bars: Array<{ t: number; h: number; l: number; c: number }>,
  options: { intervalMs: number; now?: number }
): PaperState {
  const key = symbol.trim().toUpperCase()
  const now = options.now ?? Date.now()
  const intervalMs = options.intervalMs
  let next = state
  const pos0 = next.positions.find((p) => p.symbol === key)
  const hasOpenOrders = next.orders.some(
    (o) => o.status === "OPEN" && o.symbol === key
  )
  if (!pos0 && !hasOpenOrders) {
    // Still evaluate account-level cross liquidation using existing marks.
    return processLiquidations(next, now)
  }

  if (bars.length === 0) {
    if (!pos0) return processLiquidations(next, now)
    next = {
      ...next,
      positions: next.positions.map((p) =>
        p.id === pos0.id ? advanceCursor(p, now) : p
      ),
    }
    return processLiquidations(recomputeEquity(next), now)
  }

  const sorted = [...bars].sort((a, b) => a.t - b.t)
  let cursor = pos0?.lastCheckedAt ?? sorted[0]!.t
  const positionId = pos0?.id

  for (const bar of sorted) {
    const current = positionId
      ? next.positions.find((p) => p.id === positionId)
      : next.positions.find((p) => p.symbol === key)

    const barEnd = bar.t + intervalMs
    if (barEnd <= cursor) continue

    const partial = Boolean(current && bar.t < cursor)
    const hit = evaluateBarExecutions(next, key, current, bar, { partial })

    if (hit.kind === "ambiguous") {
      next = fillAmbiguous(
        next,
        key,
        current,
        hit.exitPrice,
        hit.orderIds,
        barEnd
      )
      next = processLiquidations(next, barEnd)
      break
    }
    if (hit.kind === "liquidation") {
      next = liquidatePosition(next, hit.positionId, barEnd, hit.exitPrice)
      next = processLiquidations(next, barEnd)
      if (!next.positions.find((p) => p.symbol === key)) break
      cursor = Math.max(cursor, Math.min(barEnd, now))
      continue
    }
    if (hit.kind === "sl" || hit.kind === "tp" || hit.kind === "stop_market") {
      next = fillAggressiveOrder(
        next,
        hit.orderId,
        hit.exitPrice,
        hit.kind === "stop_market" ? "manual" : hit.kind,
        barEnd
      )
      next = processLiquidations(next, barEnd)
      if (!next.positions.find((p) => p.symbol === key)) break
      cursor = Math.max(cursor, Math.min(barEnd, now))
      continue
    }
    if (hit.kind === "limit") {
      next = fillLimitOrder(next, hit.orderId, barEnd)
      next = processLiquidations(next, barEnd)
      if (!next.positions.find((p) => p.symbol === key) && !hasOpenOrders) break
      cursor = Math.max(cursor, Math.min(barEnd, now))
      continue
    }

    const advancedTo = Math.min(barEnd, now)
    cursor = Math.max(cursor, advancedTo)
    if (current) {
      next = {
        ...next,
        positions: next.positions.map((p) =>
          p.id === current.id
            ? {
                ...advanceCursor(p, cursor),
                markPrice: bar.c,
                unrealizedPnl: pnlOf(p.side, p.entryPrice, p.quantity, bar.c),
              }
            : p
        ),
      }
    }
    next = recomputeEquity(next)
    next = processLiquidations(next, barEnd)
    if (positionId && !next.positions.find((p) => p.id === positionId)) break
  }

  const still = next.positions.find((p) =>
    positionId ? p.id === positionId : p.symbol === key
  )
  if (still) {
    const last = sorted[sorted.length - 1]
    next = {
      ...next,
      positions: next.positions.map((p) =>
        p.id === still.id
          ? {
              ...advanceCursor(p, now),
              markPrice: last?.c ?? p.markPrice,
              unrealizedPnl: last
                ? pnlOf(p.side, p.entryPrice, p.quantity, last.c)
                : p.unrealizedPnl,
            }
          : p
      ),
    }
  }

  next = recomputeEquity(next)
  return processLiquidations(next, now)
}

export function positionForSymbol(
  state: PaperState,
  symbol: string
): PaperPosition | undefined {
  const key = symbol.trim().toUpperCase()
  return state.positions.find((p) => p.symbol === key)
}

export function openOrdersForSymbol(
  state: PaperState,
  symbol: string
): PaperOrder[] {
  const key = symbol.trim().toUpperCase()
  return state.orders.filter((o) => o.status === "OPEN" && o.symbol === key)
}

export function historyForSymbol(
  state: PaperState,
  symbol: string
): PaperClosedTrade[] {
  const key = symbol.trim().toUpperCase()
  return state.history.filter((h) => h.symbol === key)
}

export function parsePaperState(raw: unknown): PaperState {
  if (!raw || typeof raw !== "object") return emptyPaperState()
  const obj = raw as Record<string, unknown>

  if (obj.version === 1) {
    return migrateV2ToV3(migrateV1ToV2(obj))
  }

  if (obj.version === 2) {
    return migrateV2ToV3(parseV2Shape(obj))
  }

  if (obj.version !== 3) return emptyPaperState()
  if (!Array.isArray(obj.positions) || !Array.isArray(obj.history)) {
    return emptyPaperState()
  }

  const account =
    obj.account && typeof obj.account === "object"
      ? (obj.account as PaperAccount)
      : emptyPaperAccount()

  const orders = Array.isArray(obj.orders)
    ? (obj.orders as PaperOrder[]).filter(isOrder)
    : []
  const fills = Array.isArray(obj.fills)
    ? (obj.fills as PaperFill[])
        .filter(isFill)
        .map((f) => ({
          ...f,
          fee: typeof f.fee === "number" && Number.isFinite(f.fee) ? f.fee : 0,
        }))
    : []

  const balance =
    typeof account.balance === "number"
      ? account.balance
      : PAPER_DEFAULT_BALANCE
  const equity =
    typeof account.equity === "number" ? account.equity : balance
  const startingBalance =
    typeof obj.startingBalance === "number" && obj.startingBalance > 0
      ? obj.startingBalance
      : balance

  let state: PaperState = {
    version: PAPER_STATE_VERSION,
    startingBalance,
    account: { balance, equity },
    positions: (obj.positions as PaperPosition[])
      .filter(isPosition)
      .map(normalizePosition),
    orders,
    fills: fills.slice(0, PAPER_FILLS_LIMIT),
    history: (obj.history as PaperClosedTrade[])
      .filter(isClosed)
      .slice(0, PAPER_HISTORY_LIMIT),
  }
  state = syncAllBrackets(state)
  state = migratePositionIds(state)
  return recomputeEquity(state)
}

function parseV2Shape(obj: Record<string, unknown>): PaperState {
  const account =
    obj.account && typeof obj.account === "object"
      ? (obj.account as PaperAccount)
      : emptyPaperAccount()
  const orders = Array.isArray(obj.orders)
    ? (obj.orders as PaperOrder[]).filter(isOrder)
    : []
  const fills = Array.isArray(obj.fills)
    ? (obj.fills as PaperFill[])
        .filter(isFill)
        .map((f) => ({
          ...f,
          fee: typeof f.fee === "number" && Number.isFinite(f.fee) ? f.fee : 0,
        }))
    : []

  const balance =
    typeof account.balance === "number"
      ? account.balance
      : PAPER_DEFAULT_BALANCE
  const equity =
    typeof account.equity === "number" ? account.equity : balance

  let state: PaperState = {
    version: PAPER_STATE_VERSION,
    startingBalance: balance,
    account: { balance, equity },
    positions: Array.isArray(obj.positions)
      ? (obj.positions as PaperPosition[]).filter(isPosition).map(normalizePosition)
      : [],
    orders,
    fills: fills.slice(0, PAPER_FILLS_LIMIT),
    history: Array.isArray(obj.history)
      ? (obj.history as PaperClosedTrade[])
          .filter(isClosed)
          .slice(0, PAPER_HISTORY_LIMIT)
      : [],
  }
  state = syncAllBrackets(state)
  state = migratePositionIds(state)
  return recomputeEquity(state)
}

function migratePositionIds(state: PaperState): PaperState {
  const idMap = new Map<string, string>()
  for (const position of state.positions) {
    idMap.set(position.id, paperPositionId(position.symbol))
  }
  return {
    ...state,
    positions: state.positions.map((position) => ({
      ...position,
      id: paperPositionId(position.symbol),
    })),
    orders: state.orders.map((order) => ({
      ...order,
      linkedPositionId:
        order.linkedPositionId != null
          ? idMap.get(order.linkedPositionId) ?? paperPositionId(order.symbol)
          : paperPositionId(order.symbol),
      clientOrderId: order.clientOrderId ?? `paper:${order.id}`,
      timeInForce:
        order.timeInForce ??
        (order.type === "MARKET" ? "FRONTEND_MARKET" : "GTC"),
    })),
    history: state.history.map((trade) => ({
      ...trade,
      positionId:
        idMap.get(trade.positionId) ?? paperPositionId(trade.symbol),
    })),
  }
}

/** v2 → v3: CROSS + leverage 1x for positions missing margin fields. */
function migrateV2ToV3(state: PaperState): PaperState {
  return recomputeEquity(
    syncAllBrackets(
      migratePositionIds({
        ...state,
        version: PAPER_STATE_VERSION,
        positions: state.positions.map(normalizePosition),
      })
    )
  )
}

function migrateV1ToV2(obj: Record<string, unknown>): PaperState {
  const positions = Array.isArray(obj.positions)
    ? (obj.positions as PaperPosition[]).filter(isPosition).map(normalizePosition)
    : []
  const history = Array.isArray(obj.history)
    ? (obj.history as PaperClosedTrade[]).filter(isClosed)
    : []

  let state = emptyPaperState()
  state = { ...state, positions, history }

  const now = Date.now()
  const orders: PaperOrder[] = []
  for (const pos of positions) {
    if (pos.stopLoss != null) {
      orders.push({
        id: newId(),
        clientOrderId: newClientOrderId(),
        symbol: pos.symbol,
        side: pos.side === "LONG" ? "SELL" : "BUY",
        type: "STOP_LOSS",
        size: pos.quantity,
        price: null,
        triggerPrice: pos.stopLoss,
        reduceOnly: true,
        status: "OPEN",
        timeInForce: "GTC",
        createdAt: now,
        updatedAt: now,
        linkedPositionId: pos.id,
      })
    }
    if (pos.takeProfit != null) {
      orders.push({
        id: newId(),
        clientOrderId: newClientOrderId(),
        symbol: pos.symbol,
        side: pos.side === "LONG" ? "SELL" : "BUY",
        type: "TAKE_PROFIT",
        size: pos.quantity,
        price: null,
        triggerPrice: pos.takeProfit,
        reduceOnly: true,
        status: "OPEN",
        timeInForce: "GTC",
        createdAt: now,
        updatedAt: now,
        linkedPositionId: pos.id,
      })
    }
  }
  state = { ...state, orders }
  return recomputeEquity(syncAllBrackets(state))
}

function normalizePosition(p: PaperPosition): PaperPosition {
  const lastCheckedAt =
    typeof p.lastCheckedAt === "number" && Number.isFinite(p.lastCheckedAt)
      ? p.lastCheckedAt
      : p.openedAt
  const marginMode: MarginMode =
    p.marginMode === "ISOLATED" ? "ISOLATED" : "CROSS"
  const leverage =
    typeof p.leverage === "number" && p.leverage >= 1
      ? p.leverage
      : PAPER_DEFAULT_LEVERAGE
  const isolatedMargin =
    marginMode === "ISOLATED"
      ? typeof p.isolatedMargin === "number" && p.isolatedMargin > 0
        ? p.isolatedMargin
        : calculateInitialMargin(p.quantity, p.entryPrice, leverage)
      : undefined
  return {
    ...p,
    id: paperPositionId(p.symbol),
    realizedPnl: typeof p.realizedPnl === "number" ? p.realizedPnl : 0,
    stopLoss: p.stopLoss ?? null,
    takeProfit: p.takeProfit ?? null,
    lastCheckedAt: Math.max(lastCheckedAt, p.openedAt),
    marginMode,
    leverage,
    isolatedMargin,
    source: p.source === "IRIS_AI" || p.source === "USER" ? p.source : undefined,
  }
}

function isPosition(v: unknown): v is PaperPosition {
  if (!v || typeof v !== "object") return false
  const p = v as PaperPosition
  return (
    typeof p.id === "string" &&
    typeof p.symbol === "string" &&
    (p.side === "LONG" || p.side === "SHORT") &&
    typeof p.quantity === "number" &&
    typeof p.entryPrice === "number" &&
    typeof p.openedAt === "number"
  )
}

function isClosed(v: unknown): v is PaperClosedTrade {
  if (!v || typeof v !== "object") return false
  const c = v as PaperClosedTrade
  return (
    typeof c.id === "string" &&
    typeof c.symbol === "string" &&
    (c.side === "LONG" || c.side === "SHORT") &&
    typeof c.exitPrice === "number" &&
    (c.reason === "manual" ||
      c.reason === "tp" ||
      c.reason === "sl" ||
      c.reason === "ambiguous" ||
      c.reason === "liquidation")
  )
}

function isOrder(v: unknown): v is PaperOrder {
  if (!v || typeof v !== "object") return false
  const o = v as PaperOrder
  return (
    typeof o.id === "string" &&
    typeof o.symbol === "string" &&
    (o.side === "BUY" || o.side === "SELL") &&
    typeof o.size === "number" &&
    (o.status === "OPEN" ||
      o.status === "PARTIALLY_FILLED" ||
      o.status === "PENDING" ||
      o.status === "FILLED" ||
      o.status === "CANCELED" ||
      o.status === "REJECTED")
  )
}

function isFill(v: unknown): v is PaperFill {
  if (!v || typeof v !== "object") return false
  const f = v as PaperFill
  return (
    typeof f.id === "string" &&
    typeof f.symbol === "string" &&
    typeof f.size === "number" &&
    typeof f.price === "number"
  )
}

/**
 * Add collateral to an ISOLATED position (from available balance).
 * Wallet balance unchanged; allocation increases → available falls.
 */
export function addIsolatedMargin(
  state: PaperState,
  positionId: string,
  amount: number
): { state: PaperState; error?: string } {
  if (!(amount > 0)) return { state, error: "Amount must be positive" }
  const pos = state.positions.find((p) => p.id === positionId)
  if (!pos) return { state, error: "Position not found" }
  if (pos.marginMode !== "ISOLATED") {
    return { state, error: "Add margin only for ISOLATED positions" }
  }
  const avail = availableBalance(state)
  if (amount > avail + 1e-9) {
    return { state, error: "INSUFFICIENT_MARGIN" }
  }
  const next = upsertPosition(
    state,
    {
      ...pos,
      isolatedMargin: isolatedAllocated(pos) + amount,
    },
    pos.symbol
  )
  return { state: recomputeEquity(next) }
}

/**
 * Remove collateral from an ISOLATED position back to available.
 * Rejected if remaining would breach IM or maintenance safety.
 */
export function removeIsolatedMargin(
  state: PaperState,
  positionId: string,
  amount: number
): { state: PaperState; error?: string } {
  if (!(amount > 0)) return { state, error: "Amount must be positive" }
  const pos = state.positions.find((p) => p.id === positionId)
  if (!pos) return { state, error: "Position not found" }
  if (pos.marginMode !== "ISOLATED") {
    return { state, error: "Remove margin only for ISOLATED positions" }
  }
  const current = isolatedAllocated(pos)
  if (amount > current + 1e-9) {
    return { state, error: "Cannot remove more than isolated margin" }
  }
  const remaining = current - amount
  const requiredIm = calculateInitialMargin(
    pos.quantity,
    pos.markPrice,
    pos.leverage
  )
  if (remaining + 1e-9 < requiredIm) {
    return { state, error: "Would violate initial margin" }
  }
  const trial: PaperPosition = { ...pos, isolatedMargin: remaining }
  const equity =
    remaining +
    pnlOf(pos.side, pos.entryPrice, pos.quantity, pos.markPrice)
  if (equity <= calculateMaintenanceMargin(trial, pos.markPrice) + 1e-9) {
    return { state, error: "Would breach maintenance margin" }
  }
  const next = upsertPosition(
    state,
    { ...pos, isolatedMargin: remaining },
    pos.symbol
  )
  return { state: recomputeEquity(next) }
}

/**
 * Change leverage without creating a Fill.
 * CROSS: updates leverage only.
 * ISOLATED: if IM rises, pull deficit from available; if IM falls, leave excess.
 */
export function changePositionLeverage(
  state: PaperState,
  positionId: string,
  leverage: number
): { state: PaperState; error?: string; position?: PaperPosition } {
  const pos = state.positions.find((p) => p.id === positionId)
  if (!pos) return { state, error: "Position not found" }
  const check = validateLeverage(pos.symbol, leverage)
  if (!check.ok) return { state, error: check.error }

  if (pos.marginMode === "CROSS") {
    const next = upsertPosition(
      state,
      { ...pos, leverage },
      pos.symbol
    )
    const view = recomputeEquity(next)
    // Ensure available still non-pathological after IM change
    if (availableBalance(view) < -1e-6) {
      return { state, error: "INSUFFICIENT_MARGIN" }
    }
    return {
      state: view,
      position: view.positions.find((p) => p.id === positionId),
    }
  }

  const required = calculateInitialMargin(pos.quantity, pos.markPrice, leverage)
  const current = isolatedAllocated(pos)
  if (required > current + 1e-9) {
    const need = required - current
    if (need > availableBalance(state) + 1e-9) {
      return { state, error: "INSUFFICIENT_MARGIN" }
    }
    const updated = { ...pos, leverage, isolatedMargin: required }
    const next = upsertPosition(state, updated, pos.symbol)
    return {
      state: recomputeEquity(next),
      position: updated,
    }
  }

  const next = upsertPosition(state, { ...pos, leverage }, pos.symbol)
  return {
    state: recomputeEquity(next),
    position: next.positions.find((p) => p.id === positionId),
  }
}
