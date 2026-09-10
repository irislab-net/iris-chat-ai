import type { PaperSide } from "@/lib/paper-trading/types"

export function snapPaperPrice(price: number): number {
  if (!Number.isFinite(price)) return price
  const abs = Math.abs(price)
  const digits = abs >= 1000 ? 2 : abs >= 100 ? 2 : abs >= 1 ? 4 : 6
  return parseFloat(price.toFixed(digits))
}

export function isValidStopLoss(
  side: PaperSide,
  entryPrice: number,
  stopLoss: number
): boolean {
  if (!(entryPrice > 0) || !(stopLoss > 0)) return false
  if (side === "LONG") return stopLoss < entryPrice
  return stopLoss > entryPrice
}

export function isValidTakeProfit(
  side: PaperSide,
  entryPrice: number,
  takeProfit: number
): boolean {
  if (!(entryPrice > 0) || !(takeProfit > 0)) return false
  if (side === "LONG") return takeProfit > entryPrice
  return takeProfit < entryPrice
}

export function stopLossError(
  side: PaperSide,
  entryPrice: number,
  stopLoss: number
): string | null {
  if (!isValidStopLoss(side, entryPrice, stopLoss)) {
    return side === "LONG"
      ? "SL must be below entry for LONG"
      : "SL must be above entry for SHORT"
  }
  return null
}

export function takeProfitError(
  side: PaperSide,
  entryPrice: number,
  takeProfit: number
): string | null {
  if (!isValidTakeProfit(side, entryPrice, takeProfit)) {
    return side === "LONG"
      ? "TP must be above entry for LONG"
      : "TP must be below entry for SHORT"
  }
  return null
}
