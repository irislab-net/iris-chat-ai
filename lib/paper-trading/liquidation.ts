/**
 * Liquidation price + liquidatability for paper perp V2.2.
 *
 * Full position liquidation only.
 * NOT modeled: partial liquidation, liquidator vault, backstop, insurance fund.
 */

import {
  calculateMaintenanceMargin,
  crossAccountEquity,
  crossCollateral,
  crossMaintenanceRequired,
  crossPositions,
  isolatedAllocated,
  isolatedEquity,
} from "@/lib/paper-trading/margin"
import { maintenanceMarginRate } from "@/lib/paper-trading/instruments"
import type { PaperPosition, PaperSide, PaperState } from "@/lib/paper-trading/types"

function uPnl(
  side: PaperSide,
  entryPrice: number,
  quantity: number,
  price: number
): number {
  const dir = side === "LONG" ? 1 : -1
  return (price - entryPrice) * quantity * dir
}

export type LiquidationScope = "ISOLATED" | "CROSS"

/**
 * Isolated liquidation price from equity = MM identity.
 * LONG:  (entry*qty − isolatedMargin) / (qty * (1 − mmRate))
 * SHORT: (entry*qty + isolatedMargin) / (qty * (1 + mmRate))
 */
export function calculateIsolatedLiquidationPrice(
  position: PaperPosition
): number | null {
  if (position.marginMode !== "ISOLATED") return null
  const qty = position.quantity
  if (!(qty > 0)) return null
  const mmRate = maintenanceMarginRate(position.symbol)
  const margin = isolatedAllocated(position)
  if (position.side === "LONG") {
    const denom = qty * (1 - mmRate)
    if (!(denom > 0)) return null
    return (position.entryPrice * qty - margin) / denom
  }
  const denom = qty * (1 + mmRate)
  if (!(denom > 0)) return null
  return (position.entryPrice * qty + margin) / denom
}

/**
 * Cross liquidation price for one position, holding other marks fixed.
 * Solves: crossCollateral + otherUpnl + uPnL(mark) = mmOthers + MM(mark)
 */
export function calculateCrossLiquidationPrice(
  position: PaperPosition,
  state: PaperState
): number | null {
  if (position.marginMode !== "CROSS") return null
  const qty = position.quantity
  if (!(qty > 0)) return null

  const mmRate = maintenanceMarginRate(position.symbol)
  const others = crossPositions(state).filter((p) => p.id !== position.id)
  const otherUpnl = others.reduce((s, p) => s + p.unrealizedPnl, 0)
  const mmOthers = others.reduce(
    (s, p) => s + calculateMaintenanceMargin(p, p.markPrice),
    0
  )
  const collateral = crossCollateral(state)

  if (position.side === "LONG") {
    // collateral + otherUpnl + (mark - entry)*qty = mmOthers + mark*qty*mmRate
    // collateral + otherUpnl - entry*qty - mmOthers = mark*qty*(mmRate - 1)
    const denom = qty * (1 - mmRate)
    if (!(denom > 0)) return null
    return (
      (position.entryPrice * qty - collateral - otherUpnl + mmOthers) / denom
    )
  }

  // SHORT: collateral + otherUpnl + (entry - mark)*qty = mmOthers + mark*qty*mmRate
  // collateral + otherUpnl + entry*qty - mmOthers = mark*qty*(1 + mmRate)
  const denom = qty * (1 + mmRate)
  if (!(denom > 0)) return null
  return (
    (collateral + otherUpnl + position.entryPrice * qty - mmOthers) / denom
  )
}

/** Derived liquidation price for display / OHLC touch checks. */
export function calculateLiquidationPrice(
  position: PaperPosition,
  state: PaperState
): number | null {
  if (position.marginMode === "ISOLATED") {
    return calculateIsolatedLiquidationPrice(position)
  }
  return calculateCrossLiquidationPrice(position, state)
}

export function isIsolatedLiquidatable(
  position: PaperPosition,
  markPrice = position.markPrice
): boolean {
  if (position.marginMode !== "ISOLATED") return false
  const equity = isolatedEquity(position, markPrice)
  const mm = calculateMaintenanceMargin(position, markPrice)
  return equity <= mm + 1e-9
}

export function isCrossAccountLiquidatable(state: PaperState): boolean {
  const crosses = crossPositions(state)
  if (crosses.length === 0) return false
  const equity = crossAccountEquity(state)
  const mm = crossMaintenanceRequired(state)
  return equity <= mm + 1e-9
}

export function isPositionLiquidatable(
  position: PaperPosition,
  state: PaperState,
  markPrice = position.markPrice
): boolean {
  if (position.marginMode === "ISOLATED") {
    return isIsolatedLiquidatable(position, markPrice)
  }
  return isCrossAccountLiquidatable({
    ...state,
    positions: state.positions.map((p) =>
      p.id === position.id
        ? {
            ...p,
            markPrice,
            unrealizedPnl: uPnl(p.side, p.entryPrice, p.quantity, markPrice),
          }
        : p
    ),
  })
}

/** OHLC: did this bar's range touch the position's liquidation price? */
export function liquidationTouchedBar(
  position: PaperPosition,
  state: PaperState,
  bar: { h: number; l: number }
): boolean {
  const liq = calculateLiquidationPrice(position, state)
  if (liq == null || !Number.isFinite(liq) || !(liq > 0)) return false
  if (position.side === "LONG") return bar.l <= liq
  return bar.h >= liq
}

/**
 * Deterministic cross liquidation batch order: alphabetical symbol.
 * Documented V2.2 strategy — no PnL-priority invention.
 */
export function crossLiquidationBatchIds(state: PaperState): string[] {
  return crossPositions(state)
    .slice()
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .map((p) => p.id)
}

export function isolatedLiquidationBatchIds(state: PaperState): string[] {
  return state.positions
    .filter((p) => p.marginMode === "ISOLATED" && isIsolatedLiquidatable(p))
    .slice()
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .map((p) => p.id)
}
