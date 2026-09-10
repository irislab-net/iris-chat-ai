/**
 * Pure margin calculators for paper perp V2.2.
 * No UI; no fill side-effects.
 *
 * TIERED_MARGIN_NOT_MODELED — see instruments.ts.
 */

import {
  maintenanceMarginRate,
  PAPER_DEFAULT_LEVERAGE,
  validateLeverage,
} from "@/lib/paper-trading/instruments"
import type {
  MarginMode,
  PaperOrderSide,
  PaperPosition,
  PaperSide,
  PaperState,
} from "@/lib/paper-trading/types"

function uPnl(
  side: PaperSide,
  entryPrice: number,
  quantity: number,
  price: number
): number {
  const dir = side === "LONG" ? 1 : -1
  return (price - entryPrice) * quantity * dir
}

export type PaperAccountMarginView = {
  walletBalance: number
  equity: number
  crossAccountValue: number
  initialMarginUsed: number
  maintenanceMarginRequired: number
  availableBalance: number
  unrealizedPnl: number
  isolatedMarginAllocated: number
}

export function positionNotional(
  quantity: number,
  markPrice: number
): number {
  return Math.abs(quantity) * markPrice
}

export function calculateInitialMargin(
  quantity: number,
  markPrice: number,
  leverage: number
): number {
  if (!(quantity > 0) || !(markPrice > 0) || !(leverage > 0)) return 0
  return positionNotional(quantity, markPrice) / leverage
}

export function calculateMaintenanceMargin(
  position: Pick<PaperPosition, "symbol" | "quantity">,
  markPrice: number
): number {
  const notional = positionNotional(position.quantity, markPrice)
  return notional * maintenanceMarginRate(position.symbol)
}

export function isolatedAllocated(pos: PaperPosition): number {
  if (pos.marginMode !== "ISOLATED") return 0
  return typeof pos.isolatedMargin === "number" && pos.isolatedMargin > 0
    ? pos.isolatedMargin
    : 0
}

export function sumIsolatedMargin(state: PaperState): number {
  return state.positions.reduce((s, p) => s + isolatedAllocated(p), 0)
}

export function crossPositions(state: PaperState): PaperPosition[] {
  return state.positions.filter((p) => p.marginMode === "CROSS")
}

export function isolatedPositions(state: PaperState): PaperPosition[] {
  return state.positions.filter((p) => p.marginMode === "ISOLATED")
}

/** Cross collateral = wallet − isolated allocations. */
export function crossCollateral(state: PaperState): number {
  return state.account.balance - sumIsolatedMargin(state)
}

export function crossUnrealizedPnl(state: PaperState): number {
  return crossPositions(state).reduce((s, p) => s + p.unrealizedPnl, 0)
}

export function totalUnrealizedPnl(state: PaperState): number {
  return state.positions.reduce((s, p) => s + p.unrealizedPnl, 0)
}

export function crossInitialMarginUsed(state: PaperState): number {
  return crossPositions(state).reduce(
    (s, p) =>
      s + calculateInitialMargin(p.quantity, p.markPrice, p.leverage),
    0
  )
}

export function crossMaintenanceRequired(state: PaperState): number {
  return crossPositions(state).reduce(
    (s, p) => s + calculateMaintenanceMargin(p, p.markPrice),
    0
  )
}

export function totalMaintenanceRequired(state: PaperState): number {
  return state.positions.reduce(
    (s, p) => s + calculateMaintenanceMargin(p, p.markPrice),
    0
  )
}

export function totalInitialMarginUsed(state: PaperState): number {
  const cross = crossInitialMarginUsed(state)
  const iso = isolatedPositions(state).reduce(
    (s, p) => s + isolatedAllocated(p),
    0
  )
  return cross + iso
}

/**
 * Cross account equity for liquidation:
 * (wallet − isolated) + unrealized of CROSS positions.
 */
export function crossAccountEquity(state: PaperState): number {
  return crossCollateral(state) + crossUnrealizedPnl(state)
}

export function isolatedEquity(
  position: PaperPosition,
  markPrice = position.markPrice
): number {
  return (
    isolatedAllocated(position) +
    uPnl(position.side, position.entryPrice, position.quantity, markPrice)
  )
}

/**
 * Account margin snapshot (derived — not persisted).
 *
 * availableBalance ≈ equity − cross IM − isolated allocations
 */
export function calculateAccountMarginView(
  state: PaperState
): PaperAccountMarginView {
  const unrealizedPnl = totalUnrealizedPnl(state)
  const walletBalance = state.account.balance
  const equity = walletBalance + unrealizedPnl
  const isolatedMarginAllocated = sumIsolatedMargin(state)
  const initialMarginUsed = totalInitialMarginUsed(state)
  const maintenanceMarginRequired = totalMaintenanceRequired(state)
  const availableBalance =
    equity - crossInitialMarginUsed(state) - isolatedMarginAllocated

  return {
    walletBalance,
    equity,
    crossAccountValue: crossAccountEquity(state),
    initialMarginUsed,
    maintenanceMarginRequired,
    availableBalance,
    unrealizedPnl,
    isolatedMarginAllocated,
  }
}

export function availableBalance(state: PaperState): number {
  return calculateAccountMarginView(state).availableBalance
}

export type MarginValidation =
  | { ok: true; requiredMargin: number }
  | { ok: false; error: string; code: "INSUFFICIENT_MARGIN" | "INVALID_LEVERAGE" | "MARGIN_MODE_MISMATCH" }

/**
 * Validate opening / increasing margin for a prospective size at mark.
 * Reduce-only paths should skip this.
 */
export function validateMarginForOpen(input: {
  state: PaperState
  symbol: string
  side: PaperSide
  size: number
  markPrice: number
  marginMode: MarginMode
  leverage: number
}): MarginValidation {
  const { state, symbol, size, markPrice, marginMode, leverage } = input
  const key = symbol.trim().toUpperCase()
  const levCheck = validateLeverage(key, leverage)
  if (!levCheck.ok) {
    return { ok: false, error: levCheck.error, code: "INVALID_LEVERAGE" }
  }

  const existing = state.positions.find((p) => p.symbol === key)
  if (existing && existing.marginMode !== marginMode) {
    return {
      ok: false,
      error: `Cannot switch ${existing.marginMode} → ${marginMode} via order`,
      code: "MARGIN_MODE_MISMATCH",
    }
  }

  const required = calculateInitialMargin(size, markPrice, leverage)
  const avail = availableBalance(state)
  if (required > avail + 1e-9) {
    return {
      ok: false,
      error: "INSUFFICIENT_MARGIN",
      code: "INSUFFICIENT_MARGIN",
    }
  }
  return { ok: true, requiredMargin: required }
}

/**
 * Split a prospective opposite-side fill into close + open remainder,
 * then margin-check only the opening remainder.
 */
export function planOppositeFill(input: {
  position: PaperPosition
  orderSide: PaperOrderSide
  size: number
  markPrice: number
  /** Margin config for the flipped remainder (order selection). */
  marginMode: MarginMode
  leverage: number
  state: PaperState
}): {
  closeQty: number
  openQty: number
  openMargin: MarginValidation | null
} {
  const fillSide: PaperSide = input.orderSide === "BUY" ? "LONG" : "SHORT"
  if (input.position.side === fillSide) {
    return { closeQty: 0, openQty: input.size, openMargin: null }
  }
  const closeQty = Math.min(input.position.quantity, input.size)
  const openQty = input.size - closeQty
  if (!(openQty > 1e-12)) {
    return { closeQty, openQty: 0, openMargin: null }
  }

  // After close, available rises (IM released). Simulate by checking against
  // a post-close view: release this position's IM contribution for closeQty.
  const releasedIm =
    input.position.marginMode === "ISOLATED"
      ? isolatedAllocated(input.position) * (closeQty / input.position.quantity)
      : calculateInitialMargin(
          closeQty,
          input.position.markPrice,
          input.position.leverage
        )

  const synthetic: PaperState = {
    ...input.state,
    positions:
      closeQty >= input.position.quantity - 1e-12
        ? input.state.positions.filter((p) => p.id !== input.position.id)
        : input.state.positions.map((p) =>
            p.id === input.position.id
              ? {
                  ...p,
                  quantity: input.position.quantity - closeQty,
                  isolatedMargin:
                    p.marginMode === "ISOLATED"
                      ? isolatedAllocated(p) - releasedIm
                      : p.isolatedMargin,
                  unrealizedPnl: uPnl(
                    p.side,
                    p.entryPrice,
                    input.position.quantity - closeQty,
                    p.markPrice
                  ),
                }
              : p
          ),
  }

  const openMargin = validateMarginForOpen({
    state: synthetic,
    symbol: input.position.symbol,
    side: fillSide,
    size: openQty,
    markPrice: input.markPrice,
    marginMode: input.marginMode,
    leverage: input.leverage,
  })

  return { closeQty, openQty, openMargin }
}

export function defaultMarginMode(): MarginMode {
  return "CROSS"
}

export function defaultLeverage(): number {
  return PAPER_DEFAULT_LEVERAGE
}

export function clampDisplayAvailable(raw: number): number {
  return raw
}

export { PAPER_DEFAULT_LEVERAGE }
