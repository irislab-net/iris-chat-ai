import { parsePaperTicketFromAssistantText } from "@/lib/chat/parse-trade-setup"
import { SIGNAL_DEMO_EQUITY } from "@/lib/chat/trade-signal"
import type { CoPilotEffort, CoPilotHistoryMessage } from "@/lib/api/types"
import { buildMarketContextPacket } from "@/lib/iris-paper-trade/build-context"
import { synthesizePaperDecisionFromContext } from "@/lib/iris-paper-trade/fallback-decision"
import { extractTradeSymbolFromMessage } from "@/lib/iris-paper-trade/extract-symbol"
import { isPaperTradeIntent } from "@/lib/iris-paper-trade/intent"
import { isOpenPaperTradeToolFailureProse } from "@/lib/iris-paper-trade/tool-failure"
import { formatProposedChatMessage } from "@/lib/iris-paper-trade/execute"
import { parsePaperDecision } from "@/lib/iris-paper-trade/parse"
import { planIrisPaperTrade } from "@/lib/iris-paper-trade/plan"
import {
  formatNoTradeChatMessage,
  formatRejectedChatMessage,
} from "@/lib/iris-paper-trade/prompt"
import {
  assistantTextFromCoPilotResponse,
  requestPaperTradeDecision,
  toolCallsFromCoPilotResponse,
} from "@/lib/iris-paper-trade/request"
import type {
  IrisPaperTradeChatResult,
  IrisPaperTradePhase,
  MarketContextPacket,
  ParsedPaperDecision,
  PaperTradeTicket,
  PlanIrisPaperTradeResult,
} from "@/lib/iris-paper-trade/types"

function proposedFromPlan(
  planned: Extract<PlanIrisPaperTradeResult, { status: "ready" }>,
  equity = SIGNAL_DEMO_EQUITY
): IrisPaperTradeChatResult {
  const ticket: PaperTradeTicket = {
    symbol: planned.symbol,
    side: planned.side,
    quantity: planned.quantity,
    markPrice: planned.markPrice,
    stopLoss: planned.stopLoss,
    takeProfit: planned.takeProfit,
    leverage: planned.leverage,
    setup: planned.setup,
    thesis: planned.thesis,
  }

  return {
    status: "proposed",
    ticket,
    message: formatProposedChatMessage({
      symbol: ticket.symbol,
      side: ticket.side,
      setup: ticket.setup,
      thesis: ticket.thesis,
      quantity: ticket.quantity,
      leverage: ticket.leverage,
      entryPrice: ticket.markPrice,
      stopLoss: ticket.stopLoss,
      takeProfit: ticket.takeProfit,
      equity,
    }),
  }
}

function planDecision(
  decision: ParsedPaperDecision,
  packet: MarketContextPacket
): IrisPaperTradeChatResult {
  const planned = planIrisPaperTrade({
    decision,
    context: packet,
  })

  if (planned.status === "no_trade") {
    return {
      status: "no_trade",
      reason: planned.reason,
      message: formatNoTradeChatMessage(planned.reason),
    }
  }

  if (planned.status === "rejected") {
    return {
      status: "rejected",
      reason: planned.reason,
      detail: planned.detail,
      message: formatRejectedChatMessage(planned.detail),
    }
  }

  return proposedFromPlan(planned)
}

/**
 * When the chat API returns open_paper_trade tool failure prose, synthesize a
 * deterministic proposal from live market context.
 */
export async function tryRecoverProposedPaperTradeFromToolFailure(input: {
  userMessage: string
  assistantMessage: string
  signal?: AbortSignal
}): Promise<Extract<IrisPaperTradeChatResult, { status: "proposed" }> | null> {
  if (!isOpenPaperTradeToolFailureProse(input.assistantMessage)) return null
  if (!isPaperTradeIntent(input.userMessage)) return null

  const symbol = extractTradeSymbolFromMessage(input.userMessage)
  const built = await buildMarketContextPacket({
    signal: input.signal,
    symbol,
  })
  if (!built.ok) return null

  const fallbackDecision = synthesizePaperDecisionFromContext(built.packet)
  if (!fallbackDecision) return null

  const result = planDecision(fallbackDecision, built.packet)
  return result.status === "proposed" ? result : null
}

/**
 * One user request → at most one trade-signal proposal.
 * Does not open positions.
 */
export async function runIrisPaperTradeRequest(input: {
  userMessage: string
  conversationId: string
  history: CoPilotHistoryMessage[]
  signal?: AbortSignal
  effort?: CoPilotEffort
  onPhase?: (phase: IrisPaperTradePhase) => void
}): Promise<IrisPaperTradeChatResult> {
  input.onPhase?.("context")
  const symbol = extractTradeSymbolFromMessage(input.userMessage)
  const built = await buildMarketContextPacket({
    signal: input.signal,
    symbol,
  })
  if (!built.ok) {
    return {
      status: "rejected",
      reason: built.error === "STALE_CONTEXT" ? "STALE_CONTEXT" : "MISSING_LIVE_PRICE",
      detail: built.error,
      message: formatRejectedChatMessage(
        "Live market context was not available."
      ),
    }
  }

  input.onPhase?.("evaluate")
  const response = await requestPaperTradeDecision({
    userMessage: input.userMessage,
    packet: built.packet,
    conversationId: input.conversationId,
    history: input.history,
    signal: input.signal,
    effort: input.effort,
  })

  const assistantText = assistantTextFromCoPilotResponse(response)
  const parsed = parsePaperDecision({
    message: assistantText,
    toolCalls: toolCallsFromCoPilotResponse(response),
  })

  if (parsed.ok) {
    return planDecision(parsed.decision, built.packet)
  }

  const proseTicket = isOpenPaperTradeToolFailureProse(assistantText)
    ? null
    : parsePaperTicketFromAssistantText(assistantText)
  if (proseTicket) {
    return {
      status: "proposed",
      ticket: proseTicket,
      message: assistantText,
    }
  }

  const fallbackDecision = synthesizePaperDecisionFromContext(built.packet)
  if (fallbackDecision) {
    return planDecision(fallbackDecision, built.packet)
  }

  const reason =
    parsed.ok === false && parsed.error === "MULTIPLE_TOOL_CALLS"
      ? "MULTIPLE_TOOL_CALLS"
      : parsed.ok === false && parsed.error.startsWith("EXTRA_PROPERTIES")
        ? "EXTRA_PROPERTIES"
        : "STRUCTURED_OUTPUT_INVALID"
  return {
    status: "rejected",
    reason,
    detail: parsed.ok ? "PLAN_REJECTED" : parsed.error,
    message: formatRejectedChatMessage(
      "Exur did not return a valid structured decision."
    ),
  }
}
