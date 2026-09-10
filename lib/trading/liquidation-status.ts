import type { LiquidationStatus } from "@/lib/trading/types"
import { decimalNumber } from "@/lib/trading/types"

/** Derive liquidation risk from mark vs liquidation price (Hyperliquid-style). */
export function deriveLiquidationStatus(input: {
  side: "LONG" | "SHORT"
  markPrice: number | null
  liquidationPrice: number | null
  liquidated?: boolean
}): LiquidationStatus {
  if (input.liquidated) return "LIQUIDATED"
  const mark = input.markPrice
  const liq = input.liquidationPrice
  if (mark == null || liq == null || !(mark > 0) || !(liq > 0)) return "NONE"
  if (input.side === "LONG") {
    if (mark <= liq) return "LIQUIDATING"
    const buffer = (mark - liq) / mark
    if (buffer < 0.05) return "AT_RISK"
  } else {
    if (mark >= liq) return "LIQUIDATING"
    const buffer = (liq - mark) / mark
    if (buffer < 0.05) return "AT_RISK"
  }
  return "NONE"
}

export function deriveLiquidationStatusFromDecimals(input: {
  side: "LONG" | "SHORT"
  markPrice: string | null
  liquidationPrice: string | null
  liquidated?: boolean
}): LiquidationStatus {
  return deriveLiquidationStatus({
    side: input.side,
    markPrice: input.markPrice == null ? null : decimalNumber(input.markPrice),
    liquidationPrice:
      input.liquidationPrice == null ? null : decimalNumber(input.liquidationPrice),
    liquidated: input.liquidated,
  })
}
