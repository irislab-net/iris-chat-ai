import { decimalNumber, type DecimalValue, type PositionSide } from "@/lib/trading/types"

export function formatTradingPrice(value: DecimalValue | number | null): string {
  if (value == null) return "—"
  const number = typeof value === "number" ? value : decimalNumber(value)
  if (!Number.isFinite(number)) return "—"
  const absolute = Math.abs(number)
  const digits = absolute >= 100 ? 2 : absolute >= 1 ? 4 : 6
  return number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

export function formatTradingPnl(value: DecimalValue | number): string {
  const number = typeof value === "number" ? value : decimalNumber(value)
  const sign = number > 0 ? "+" : ""
  return `${sign}${number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function tradingPnlPct(
  side: PositionSide,
  entryPrice: DecimalValue | number,
  markPrice: DecimalValue | number
): number {
  const entry = typeof entryPrice === "number" ? entryPrice : decimalNumber(entryPrice)
  const mark = typeof markPrice === "number" ? markPrice : decimalNumber(markPrice)
  if (!(entry > 0)) return 0
  return ((side === "LONG" ? mark - entry : entry - mark) / entry) * 100
}

export function formatTradingPnlPct(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
}

export function formatTradingQty(value: DecimalValue | number | null): string {
  if (value == null) return "—"
  const number = typeof value === "number" ? value : decimalNumber(value)
  if (!Number.isFinite(number)) return "—"
  const absolute = Math.abs(number)
  const digits = absolute >= 100 ? 2 : absolute >= 1 ? 4 : 6
  return number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

/** Decimal text for ticket inputs — never scientific notation (e.g. 1e-8 → 0.00000001). */
export function formatTicketDecimal(
  value: number,
  options?: { integer?: boolean; maxFractionDigits?: number }
): string {
  const integer = options?.integer ?? false
  const maxFractionDigits = options?.maxFractionDigits ?? 8
  if (integer) return String(Math.trunc(value))
  const fixed = value.toFixed(maxFractionDigits)
  return fixed.replace(/\.?0+$/, "") || "0"
}
