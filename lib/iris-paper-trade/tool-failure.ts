import { expandSummarizedSignalUserMessage } from "@/lib/chat/composer-mentions"
import { isPaperTradeIntent } from "@/lib/iris-paper-trade/intent"
import type { ChatUiMessage } from "@/lib/chat-storage"

/** Assistant prose when the upstream model could not call open_paper_trade. */
export function isOpenPaperTradeToolFailureProse(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  return (
    /unable to execute[^.\n]*open_paper_trade/i.test(trimmed) ||
    /cannot (?:execute|call|use)[^.\n]*open_paper_trade/i.test(trimmed) ||
    /open_paper_trade[^.\n]*(?:unknown tool|not (?:a )?known|unavailable|not available|issue with the tool)/i.test(
      trimmed
    ) ||
    /(?:unknown|unrecognized|invalid) tool[^.\n]*open_paper_trade/i.test(
      trimmed
    )
  )
}

export type ToolFailureSignalRecoveryTarget = {
  messageId: string
  userMessage: string
}

/** Assistant turns that should be replaced with a deterministic desk proposal. */
export function findToolFailureSignalRecoveryTargets(
  messages: ChatUiMessage[]
): ToolFailureSignalRecoveryTarget[] {
  const targets: ToolFailureSignalRecoveryTarget[] = []

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index]
    if (message.role !== "assistant" || message.paperTicket) continue
    if (!isOpenPaperTradeToolFailureProse(message.content)) continue

    const priorUser = messages
      .slice(0, index)
      .reverse()
      .find((item) => item.role === "user")
    if (!priorUser) continue

    const userMessage = expandSummarizedSignalUserMessage(priorUser.content)
    if (!isPaperTradeIntent(userMessage)) continue

    targets.push({
      messageId: message.id,
      userMessage,
    })
  }

  return targets
}
