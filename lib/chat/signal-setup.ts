import { isStructuredSignalSetupContent } from "@/lib/chat/parse-trade-setup"
import { SIGNAL_SETUP_HEADER } from "@/lib/chat/signal-setup-constants"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"
import type { ChatUiMessage } from "@/lib/chat-storage"

export { SIGNAL_SETUP_HEADER }

export type SignalMessageParts = {
  leadText: string
  ticket: PaperTradeTicket | null
  tailText: string
}

function extractThesisFromContent(
  content: string,
  ticket: PaperTradeTicket
): string {
  const lines = content.split("\n").map((line) => line.trim())
  const thesisStart = lines.findIndex((line) => {
    if (!line) return false
    if (/^(?:Exur|IRIS) setup/i.test(line)) return false
    if (/^(ETH|BTC|XAU|SOL|\w+)\s+(LONG|SHORT)\b/i.test(line)) return false
    if (/^Setup:/i.test(line)) return false
    if (/^Entry\b/i.test(line)) return false
    if (/^SL\b/i.test(line)) return false
    if (/^TP\b/i.test(line)) return false
    if (/^Leverage\b/i.test(line)) return false
    if (/^Size\b/i.test(line)) return false
    if (line === ticket.setup) return false
    if (line.startsWith(ticket.symbol)) return false
    return true
  })

  if (thesisStart === -1) return ""
  return lines.slice(thesisStart).join("\n").trim()
}

function isGenericThesis(text: string): boolean {
  const trimmed = text.trim()
  return (
    !trimmed ||
    trimmed === "Parsed from assistant reply" ||
    /^IRIS signal$/i.test(trimmed)
  )
}

/**
 * Keep the first trusted `paperTicket` in a thread; strip duplicates on
 * follow-ups. Never invent tickets from assistant prose (integrity: only
 * `show_trade_signal` / recovery / persisted API tickets).
 */
export function enrichPaperTicketsOnMessages(
  messages: ChatUiMessage[]
): ChatUiMessage[] {
  let threadHasSetup = false

  return messages.map((message) => {
    if (message.role !== "assistant") return message

    if (threadHasSetup) {
      return message.paperTicket
        ? { ...message, paperTicket: undefined }
        : message
    }

    if (message.paperTicket) {
      threadHasSetup = true
      return message
    }

    return message
  })
}

/** Split assistant text into optional disclaimer, structured ticket, and thesis prose. */
export function splitSignalAssistantMessage(input: {
  content: string
  paperTicket?: PaperTradeTicket
}): SignalMessageParts {
  const content = input.content.trim()
  // Cards require an explicit ticket — do not regex-parse prose into a Signal.
  const ticket = input.paperTicket ?? null

  if (!ticket) {
    return { leadText: "", ticket: null, tailText: "" }
  }

  const headerLine =
    content.match(/^(?:Exur|IRIS) setup[^\n]*/i)?.[0]?.trim() ?? ""

  const ticketThesis = ticket.thesis?.trim() ?? ""
  let tailText = ticketThesis
  if (isGenericThesis(tailText)) {
    tailText = extractThesisFromContent(content, ticket)
  }
  if (isGenericThesis(tailText)) {
    tailText = ""
  }

  let leadText = headerLine
  // Keep API output_text when it is free-form (not a structured setup dump).
  if (!leadText && content && !isStructuredSignalSetupContent(content)) {
    if (isGenericThesis(ticketThesis)) {
      // Tool signal + free-form reply: prose above the card.
      leadText = content
      if (tailText === content) tailText = ""
    } else if (content !== tailText) {
      leadText = content
    }
    // else: content is exactly the real thesis — keep it as tail under the card.
  }

  // Card owns thesis — avoid duplicating it under the card.
  if (ticketThesis && tailText === ticketThesis) {
    tailText = ""
  }
  if (ticketThesis && leadText === ticketThesis) {
    leadText = ""
  }

  // Last resort: never drop visible free-form prose.
  if (
    !leadText &&
    !tailText &&
    content &&
    !isStructuredSignalSetupContent(content) &&
    content !== ticketThesis
  ) {
    leadText = content
  }

  return {
    leadText,
    ticket,
    tailText,
  }
}

export function signalRewardRiskRatio(ticket: PaperTradeTicket): number | null {
  const { markPrice: entry, stopLoss: sl, takeProfit: tp, side } = ticket
  if (!(entry > 0 && sl > 0 && tp > 0)) return null

  if (side === "LONG") {
    const risk = entry - sl
    const reward = tp - entry
    if (!(risk > 0) || !(reward > 0)) return null
    return reward / risk
  }

  const risk = sl - entry
  const reward = entry - tp
  if (!(risk > 0) || !(reward > 0)) return null
  return reward / risk
}
