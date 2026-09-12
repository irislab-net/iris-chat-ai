import { isPaperTradeIntent } from "@/lib/iris-paper-trade/intent"
import { PAPER_TRADE_INTENT_PROMPTS } from "@/lib/iris-paper-trade/types"
import type { CoPilotHistoryMessage } from "@/lib/api/types"
import { replyContainsIrisSetupBlock } from "@/lib/chat/strip-paper-setup"

function compact(text: string): string {
  return text.trim().replace(/\s+/g, " ")
}

function isExplicitPaperTradeResignal(userMessage: string): boolean {
  const raw = compact(userMessage)
  if (PAPER_TRADE_INTENT_PROMPTS.some((prompt) => compact(prompt) === raw)) {
    return true
  }

  return (
    /trading desk request for/i.test(userMessage) ||
    /درخواست\s+میز\s+معاملاتی/i.test(userMessage) ||
    /trade\s*signal/i.test(userMessage.toLowerCase()) ||
    /^(?:@?signal\b|سیگنال)/iu.test(raw)
  )
}

function threadAlreadyHasIrisSetup(history: CoPilotHistoryMessage[]): boolean {
  return history.some(
    (message) =>
      message.role === "assistant" &&
      replyContainsIrisSetupBlock(message.content)
  )
}

/**
 * Route only explicit trade/signal requests through the paper-trade pipeline.
 * After a thread already received an IRIS setup, follow-up chat stays on co-pilot.
 */
export function shouldRunPaperTradePipeline(
  userMessage: string,
  history: CoPilotHistoryMessage[] = []
): boolean {
  if (!isPaperTradeIntent(userMessage)) return false
  if (!threadAlreadyHasIrisSetup(history)) return true
  return isExplicitPaperTradeResignal(userMessage)
}
