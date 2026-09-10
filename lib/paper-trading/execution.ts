import { snapPaperPrice } from "@/lib/paper-trading/levels"
import type { PaperOrderSide } from "@/lib/paper-trading/types"

/**
 * Deterministic execution economics for paper trading V2.1.
 * No randomness — replay must be identical.
 */
export type PaperExecutionConfig = {
  /** Applied to MARKET and trigger (TP/SL/STOP) fills. BUY worse, SELL worse. */
  marketSlippageBps: number
  /** Charged on MARKET + trigger fills (notional × bps / 10_000). */
  takerFeeBps: number
  /** Charged on LIMIT fills. */
  makerFeeBps: number
}

export const PAPER_EXECUTION_DEFAULTS: PaperExecutionConfig = {
  marketSlippageBps: 2, // 0.02%
  takerFeeBps: 5, // 0.05%
  makerFeeBps: 2, // 0.02%
}

let executionOverride: Partial<PaperExecutionConfig> | null = null

export function getPaperExecution(): PaperExecutionConfig {
  return { ...PAPER_EXECUTION_DEFAULTS, ...executionOverride }
}

/** Test-only — pass `null` to restore defaults. */
export function usePaperExecution(
  override: Partial<PaperExecutionConfig> | null
): void {
  executionOverride = override
}

/** BUY fills above ref; SELL fills below ref. Snapped to tick. */
export function applyMarketSlippage(
  side: PaperOrderSide,
  referencePrice: number,
  slippageBps = getPaperExecution().marketSlippageBps
): number {
  if (!(referencePrice > 0)) return referencePrice
  const mult =
    side === "BUY" ? 1 + slippageBps / 10_000 : 1 - slippageBps / 10_000
  return snapPaperPrice(referencePrice * mult)
}

export function feeOnNotional(
  notional: number,
  feeBps: number
): number {
  if (!(notional > 0) || !(feeBps > 0)) return 0
  return (notional * feeBps) / 10_000
}

export function takerFee(notional: number): number {
  return feeOnNotional(notional, getPaperExecution().takerFeeBps)
}

export function makerFee(notional: number): number {
  return feeOnNotional(notional, getPaperExecution().makerFeeBps)
}

export function marketFillPrice(
  side: PaperOrderSide,
  referencePrice: number
): number {
  return applyMarketSlippage(side, referencePrice)
}

export function marketFillFee(
  side: PaperOrderSide,
  size: number,
  referencePrice: number
): { price: number; fee: number } {
  const price = marketFillPrice(side, referencePrice)
  const fee = takerFee(price * size)
  return { price, fee }
}

export function limitFillFee(size: number, limitPrice: number): number {
  return makerFee(limitPrice * size)
}
