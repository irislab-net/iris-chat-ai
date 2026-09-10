import {
  availableBalance,
  calculateInitialMargin,
  type PaperSide,
  type PaperState,
} from "@/lib/paper-trading"

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
  state: PaperState
  side: PaperSide
  markPrice: number
  stopLoss: number
  leverage: number
}): { ok: true; quantity: number } | { ok: false; error: string } {
  const { state, markPrice, stopLoss, leverage } = input
  if (!(markPrice > 0) || !(stopLoss > 0)) {
    return { ok: false, error: "INVALID_SIZE" }
  }

  const stopDist = Math.abs(markPrice - stopLoss)
  if (!(stopDist > 0)) return { ok: false, error: "INVALID_SIZE" }

  const equity = state.account.equity
  if (!(equity > 0)) return { ok: false, error: "INVALID_SIZE" }

  const riskAmount = paperRiskAmountUsd(equity)
  let quantity = snapQuantity(riskAmount / stopDist)
  if (!(quantity > 0)) return { ok: false, error: "INVALID_SIZE" }

  const avail = availableBalance(state)
  const required = calculateInitialMargin(quantity, markPrice, leverage)
  if (required > avail && avail > 0 && leverage > 0) {
    const maxQty = snapQuantity((avail * leverage) / markPrice)
    quantity = Math.min(quantity, maxQty)
  }

  if (!(quantity > 0)) return { ok: false, error: "INSUFFICIENT_MARGIN" }

  const finalRequired = calculateInitialMargin(quantity, markPrice, leverage)
  if (finalRequired > avail + 1e-9) {
    return { ok: false, error: "INSUFFICIENT_MARGIN" }
  }

  return { ok: true, quantity }
}
