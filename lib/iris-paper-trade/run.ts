import { parsePaperTicketFromAssistantText } from "@/lib/chat/parse-trade-setup"
import type { CoPilotEffort, CoPilotHistoryMessage } from "@/lib/api/types"
import { buildMarketContextPacket } from "@/lib/iris-paper-trade/build-context"
import { extractTradeSymbolFromMessage } from "@/lib/iris-paper-trade/extract-symbol"
import {
  formatOpenedChatMessage,
  formatProposedChatMessage,
} from "@/lib/iris-paper-trade/execute"
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
import {
  positionForSymbol,
  type PaperPosition,
} from "@/lib/paper-trading"
import {
  getPaperSnapshot,
  paperOpenTrade,
} from "@/lib/paper-trading/store"

function proposedFromPlan(
  planned: Extract<PlanIrisPaperTradeResult, { status: "ready" }>,
  equity?: number
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
  packet: MarketContextPacket,
  state: ReturnType<typeof getPaperSnapshot>
): IrisPaperTradeChatResult {
  const planned = planIrisPaperTrade({
    decision,
    context: packet,
    state,
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

  return proposedFromPlan(planned, state.account.equity)
}

/**
 * One user request → at most one paper-trade proposal.
 * Does not mutate paper state. Opening requires confirmIrisPaperProposal.
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

  const state = getPaperSnapshot()

  input.onPhase?.("evaluate")
  const response = await requestPaperTradeDecision({
    userMessage: input.userMessage,
    packet: built.packet,
    conversationId: input.conversationId,
    history: input.history,
    signal: input.signal,
    effort: input.effort,
    paperState: state,
  })

  const assistantText = assistantTextFromCoPilotResponse(response)
  const parsed = parsePaperDecision({
    message: assistantText,
    toolCalls: toolCallsFromCoPilotResponse(response),
  })

  if (parsed.ok) {
    return planDecision(parsed.decision, built.packet, state)
  }

  const proseTicket = parsePaperTicketFromAssistantText(assistantText)
  if (proseTicket) {
    return {
      status: "proposed",
      ticket: proseTicket,
      message: assistantText,
    }
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
      "IRIS did not return a valid structured decision."
    ),
  }
}

export function confirmIrisPaperProposal(
  ticket: PaperTradeTicket
):
  | { ok: true; position: PaperPosition; message: string }
  | { ok: false; error: string } {
  const state = getPaperSnapshot()
  if (positionForSymbol(state, ticket.symbol)) {
    return {
      ok: false,
      error: `An open paper position already exists for ${ticket.symbol}.`,
    }
  }

  const committed = paperOpenTrade({
    symbol: ticket.symbol,
    side: ticket.side,
    quantity: ticket.quantity,
    entryPrice: ticket.markPrice,
    stopLoss: ticket.stopLoss,
    takeProfit: ticket.takeProfit,
    leverage: ticket.leverage,
    source: "IRIS_AI",
  })
  if (!committed.ok || !committed.position) {
    return {
      ok: false,
      error: committed.ok
        ? "Engine did not open a position."
        : committed.error,
    }
  }

  return {
    ok: true,
    position: committed.position,
    message: formatOpenedChatMessage({
      symbol: committed.position.symbol,
      side: committed.position.side,
      setup: ticket.setup,
      thesis: ticket.thesis,
      quantity: committed.position.quantity,
      leverage: committed.position.leverage,
      entryPrice: committed.position.entryPrice,
      stopLoss: committed.position.stopLoss,
      takeProfit: committed.position.takeProfit,
    }),
  }
}
