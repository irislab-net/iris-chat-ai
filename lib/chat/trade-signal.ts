/** Shared trade-signal helpers (display + sizing) — no paper engine. */

export type PaperSide = "LONG" | "SHORT"

/** Demo equity for paper-trade sizing helpers (not shown on signal cards). */
export const SIGNAL_DEMO_EQUITY = 100_000

const FALLBACK_MAX_LEVERAGE: Record<string, number> = {
  BTC: 40,
  ETH: 25,
  SOL: 20,
  PAXG: 20,
}

export const SIGNAL_DEFAULT_MAX_LEVERAGE = 5

export function formatTradePrice(price: number): string {
  if (!Number.isFinite(price)) return "—"
  const abs = Math.abs(price)
  const digits = abs >= 1000 ? 2 : abs >= 100 ? 2 : abs >= 1 ? 4 : 6
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

/** @deprecated Prefer formatTradePrice */
export const formatPaperPrice = formatTradePrice

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

function coinKey(symbol: string): string {
  return symbol
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

export function getMaxLeverage(symbol: string): number {
  const key = coinKey(symbol)
  if (!key) return SIGNAL_DEFAULT_MAX_LEVERAGE
  if (FALLBACK_MAX_LEVERAGE[key] != null) return FALLBACK_MAX_LEVERAGE[key]!
  return SIGNAL_DEFAULT_MAX_LEVERAGE
}
