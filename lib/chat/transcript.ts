import type { CoPilotHistoryMessage } from "@/lib/api/types"
import { formatTradePrice } from "@/lib/chat/trade-signal"
import type { ChatUiMessage } from "@/lib/chat-storage"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"

function formatPaperTicketBlock(ticket: PaperTradeTicket): string {
  const lines = [
    `${ticket.symbol} ${ticket.side}`,
    `Setup: ${ticket.setup}`,
    `Entry: ${formatTradePrice(ticket.markPrice)}`,
    `Stop loss: ${formatTradePrice(ticket.stopLoss)}`,
    `Take profit: ${formatTradePrice(ticket.takeProfit)}`,
    `Leverage: ${ticket.leverage}x`,
  ]
  if (ticket.quantity > 0) {
    lines.push(`Size: ${ticket.quantity}`)
  }
  if (ticket.timeHorizon?.trim()) {
    lines.push(`Time horizon: ${ticket.timeHorizon.trim()}`)
  }
  const thesis = ticket.thesis?.trim()
  if (thesis) lines.push(`Thesis: ${thesis}`)
  return lines.join("\n")
}

function formatMessageBody(message: ChatUiMessage): string {
  const parts: string[] = []
  const content = message.content.trim()
  if (content && content !== "(empty)") parts.push(content)
  if (message.paperTicket) {
    parts.push(formatPaperTicketBlock(message.paperTicket))
  } else if (message.noTradeReason?.trim()) {
    parts.push(`No trade: ${message.noTradeReason.trim()}`)
  }
  return parts.join("\n\n")
}

function formatTurn(role: "user" | "assistant", body: string): string {
  const speaker = role === "user" ? "You" : "Exur"
  return `${speaker}:\n${body}`
}

type FormatConversationTranscriptOptions = {
  title?: string
  history?: CoPilotHistoryMessage[]
}

function formatConversationTranscript(
  messages: ChatUiMessage[],
  options: FormatConversationTranscriptOptions = {}
): string {
  const turns = messages
    .filter(
      (message): message is ChatUiMessage & { role: "user" | "assistant" } =>
        message.role === "user" || message.role === "assistant"
    )
    .map((message) => {
      const body = formatMessageBody(message)
      if (!body) return null
      return formatTurn(message.role, body)
    })
    .filter((turn): turn is string => Boolean(turn))

  const historyTurns =
    turns.length === 0 && options.history?.length
      ? options.history
          .filter(
            (message) =>
              (message.role === "user" || message.role === "assistant") &&
              message.content.trim().length > 0 &&
              message.content.trim() !== "(empty)"
          )
          .map((message) =>
            formatTurn(message.role, message.content.trim())
          )
      : []

  const blocks = turns.length > 0 ? turns : historyTurns
  if (blocks.length === 0) return ""

  const title = options.title?.trim()
  if (title) return `${title}\n\n${blocks.join("\n\n")}`
  return blocks.join("\n\n")
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  const value = text.trim()
  if (!value) return false

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Fall through to legacy copy.
  }

  if (typeof document === "undefined") return false

  try {
    const el = document.createElement("textarea")
    el.value = value
    el.setAttribute("readonly", "")
    el.style.position = "fixed"
    el.style.left = "-9999px"
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export {
  copyTextToClipboard,
  formatConversationTranscript,
  formatPaperTicketBlock,
}
