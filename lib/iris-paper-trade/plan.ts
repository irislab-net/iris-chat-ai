import { calculateRiskBasedSize } from "@/lib/iris-paper-trade/size"
import { validatePaperDecision } from "@/lib/iris-paper-trade/validate"
import type {
  MarketContextPacket,
  ParsedPaperDecision,
  PlanIrisPaperTradeResult,
} from "@/lib/iris-paper-trade/types"

/**
 * Validate the structured proposal, then compute risk-based size.
 * Does not open positions.
 */
export function planIrisPaperTrade(input: {
  decision: ParsedPaperDecision
  context: MarketContextPacket
  now?: number
}): PlanIrisPaperTradeResult {
  const validated = validatePaperDecision(input)
  if (validated.status !== "ready") return validated

  const sized = calculateRiskBasedSize({
    side: validated.side,
    markPrice: validated.markPrice,
    stopLoss: validated.stopLoss,
    leverage: validated.leverage,
  })
  if (!sized.ok) {
    return {
      status: "rejected",
      reason:
        sized.error === "INSUFFICIENT_MARGIN"
          ? "INSUFFICIENT_MARGIN"
          : "INVALID_SIZE",
      detail: sized.error,
    }
  }

  return { ...validated, quantity: sized.quantity }
}
