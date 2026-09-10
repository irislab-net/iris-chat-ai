import type { InsightSummary } from "@/lib/api/types"

/**
 * Product gate: insight/signal context must never auto-fill the paper ticket.
 * Ticket prices come from the user + live chart mark only.
 */
export const SIGNAL_TO_PAPER_PREFILL_BLOCKED_BY_SETUP_CONTRACT = true

export type PaperTradeSource = {
  sourceType: "IRIS_CONTEXT" | "IRIS_SETUP" | "IRIS_AI"
  marketId: string
  stance?: string
  side?: "long" | "short"
  entryPrice?: number
  stopLoss?: number
  takeProfit?: number
}

export function insightToPaperTradeSource(
  summary: InsightSummary
): PaperTradeSource {
  return {
    sourceType: "IRIS_CONTEXT",
    marketId: summary.symbol,
    stance: summary.stance,
  }
}

export function isActionablePaperSource(source: PaperTradeSource): boolean {
  void source
  if (SIGNAL_TO_PAPER_PREFILL_BLOCKED_BY_SETUP_CONTRACT) return false
  return false
}

export function evaluatePaperTradePrefill(source: PaperTradeSource): {
  blocked: boolean
  reason: string
} {
  if (SIGNAL_TO_PAPER_PREFILL_BLOCKED_BY_SETUP_CONTRACT) {
    return {
      blocked: true,
      reason: "SIGNAL_TO_PAPER_PREFILL_BLOCKED_BY_SETUP_CONTRACT",
    }
  }
  if (!isActionablePaperSource(source)) {
    return { blocked: true, reason: "SOURCE_NOT_ACTIONABLE" }
  }
  return { blocked: false, reason: "" }
}

export function paperTicketPrefillFromSource(
  source: PaperTradeSource
): Record<string, never> {
  void source
  return {}
}
