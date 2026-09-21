import type { PaperSide } from "@/lib/chat/trade-signal"
import { SIGNAL_DEMO_EQUITY } from "@/lib/chat/trade-signal"

/** Fraction of equity risked to the stop. Engine-owned — never from the model. */
export const PAPER_AI_RISK_FRACTION = 0.005

const QTY_DECIMALS = 4

export function snapQuantity(qty: number): number {
  if (!(qty > 0) || !Number.isFinite(qty)) return 0
  const f = 10 ** QTY_DECIMALS
  return Math.floor(qty * f) / f
}

export function paperRiskAmountUsd(equity: number): number {
  if (!(equity > 0) || !Number.isFinite(equity)) return 0
  return equity * PAPER_AI_RISK_FRACTION
}

export function calculateRiskBasedSize(input: {
  side: PaperSide
  markPrice: number
  stopLoss: number
  leverage: number
  equity?: number
}): { ok: true; quantity: number } | { ok: false; error: string } {
  const { markPrice, stopLoss, leverage } = input
  const equity = input.equity ?? SIGNAL_DEMO_EQUITY
  if (!(markPrice > 0) || !(stopLoss > 0)) {
    return { ok: false, error: "INVALID_SIZE" }
  }

  const stopDist = Math.abs(markPrice - stopLoss)
  if (!(stopDist > 0)) return { ok: false, error: "INVALID_SIZE" }

  if (!(equity > 0)) return { ok: false, error: "INVALID_SIZE" }

  const riskAmount = paperRiskAmountUsd(equity)
  let quantity = snapQuantity(riskAmount / stopDist)
  if (!(quantity > 0)) return { ok: false, error: "INVALID_SIZE" }

  // Cap by notional affordability at the given leverage (demo equity as available).
  if (leverage > 0 && markPrice > 0) {
    const maxQty = snapQuantity((equity * leverage) / markPrice)
    if (maxQty > 0) quantity = Math.min(quantity, maxQty)
  }

  if (!(quantity > 0)) return { ok: false, error: "INSUFFICIENT_MARGIN" }

  return { ok: true, quantity }
}
