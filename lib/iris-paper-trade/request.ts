import { sendCoPilotChat } from "@/lib/api/co-pilot"
import type {
  CoPilotChatJsonResponse,
  CoPilotEffort,
  CoPilotHistoryMessage,
} from "@/lib/api/types"
import { resolveClientTimezone } from "@/lib/chat/client-tools"
import {
  PAPER_TRADE_MODEL_INSTRUCTIONS,
  buildPaperTradeContextInstructions,
} from "@/lib/iris-paper-trade/prompt"
import { PAPER_TRADE_TOOLS } from "@/lib/iris-paper-trade/schema"
import type { MarketContextPacket } from "@/lib/iris-paper-trade/types"
import {
  PAPER_AI_RISK_FRACTION,
  paperRiskAmountUsd,
} from "@/lib/iris-paper-trade/size"
import { SIGNAL_DEMO_EQUITY } from "@/lib/chat/trade-signal"

export function toolCallsFromCoPilotResponse(
  data: CoPilotChatJsonResponse
): unknown[] {
  if (Array.isArray(data.tool_calls) && data.tool_calls.length > 0) {
    return data.tool_calls
  }
  const nested = data.choices?.[0]?.message?.tool_calls
  if (Array.isArray(nested) && nested.length > 0) return nested
  return []
}

export function assistantTextFromCoPilotResponse(
  data: CoPilotChatJsonResponse
): string {
  const fromOutput = data.output_text
  if (typeof fromOutput === "string" && fromOutput.trim()) return fromOutput
  const fromChoice = data.choices?.[0]?.message?.content
  if (typeof fromChoice === "string" && fromChoice.trim()) return fromChoice
  return data.message ?? ""
}

export async function requestPaperTradeDecision(input: {
  userMessage: string
  packet: MarketContextPacket
  conversationId: string
  history: CoPilotHistoryMessage[]
  signal?: AbortSignal
  effort?: CoPilotEffort
}): Promise<CoPilotChatJsonResponse> {
  const timezone = resolveClientTimezone()
  const riskUsd = paperRiskAmountUsd(SIGNAL_DEMO_EQUITY)

  return await sendCoPilotChat({
    message: input.userMessage.trim(),
    conversationId: input.conversationId,
    history: input.history,
    signal: input.signal,
    effort: input.effort,
    instructions: `${PAPER_TRADE_MODEL_INSTRUCTIONS}

${buildPaperTradeContextInstructions(input.packet)}`,
    tools: PAPER_TRADE_TOOLS,
    toolChoice: "required",
    parallelToolCalls: false,
    clientContext: {
      active_page: "chat",
      active_symbol: "",
      role: "user",
      available_ui_actions: ["show_trade_signal"],
      ...(timezone ? { timezone } : {}),
      paper_account: {
        starting_balance: SIGNAL_DEMO_EQUITY,
        balance: SIGNAL_DEMO_EQUITY,
        equity: SIGNAL_DEMO_EQUITY,
        available_balance: SIGNAL_DEMO_EQUITY,
        risk_per_trade: riskUsd,
        risk_fraction: PAPER_AI_RISK_FRACTION,
      },
    },
  })
}
