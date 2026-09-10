import { toChatApiSymbol } from "@/lib/api/chat"
import { sendCoPilotChat } from "@/lib/api/co-pilot"
import type {
  CoPilotChatJsonResponse,
  CoPilotEffort,
  CoPilotHistoryMessage,
} from "@/lib/api/types"
import {
  PAPER_TRADE_MODEL_INSTRUCTIONS,
  wrapPaperTradeUserMessage,
} from "@/lib/iris-paper-trade/prompt"
import { PAPER_TRADE_TOOLS } from "@/lib/iris-paper-trade/schema"
import type { MarketContextPacket } from "@/lib/iris-paper-trade/types"
import { serializePaperAccountForLlm } from "@/lib/paper-trading/account-context"
import type { PaperState } from "@/lib/paper-trading"

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
  paperState?: PaperState | null
}): Promise<CoPilotChatJsonResponse> {
  const paperAccount =
    input.paperState != null
      ? serializePaperAccountForLlm(input.paperState)
      : null

  return await sendCoPilotChat({
    message: wrapPaperTradeUserMessage(
      input.userMessage,
      input.packet,
      input.paperState
    ),
    conversationId: input.conversationId,
    history: input.history,
    signal: input.signal,
    effort: input.effort,
    instructions: PAPER_TRADE_MODEL_INSTRUCTIONS,
    tools: PAPER_TRADE_TOOLS,
    toolChoice: "required",
    parallelToolCalls: false,
    clientContext: {
      active_page: "trading_chart",
      active_symbol: toChatApiSymbol(input.packet.symbol),
      role: "user",
      ...(paperAccount
        ? {
            paper_account: {
              starting_balance: paperAccount.starting_balance_usdc,
              balance: paperAccount.balance_usdc,
              equity: paperAccount.equity_usdc,
              available_balance: paperAccount.available_balance_usdc,
              risk_per_trade: paperAccount.risk_per_trade_usdc,
              risk_fraction: paperAccount.risk_fraction,
            },
          }
        : {}),
    },
  })
}
