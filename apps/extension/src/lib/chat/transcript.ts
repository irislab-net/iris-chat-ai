import type { CoPilotHistoryMessage } from "@/lib/api/types"
import { formatTradePrice } from "@/lib/chat/trade-signal"
import type { ChatUiMessage } from "@/lib/chat-storage"
import type { PaperTradeTicket } from "@/lib/chat/signal-ticket"

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

function formatMarkdownTurn(role: "user" | "assistant", body: string): string {
  const speaker = role === "user" ? "You" : "Exur"
  return `### ${speaker}\n\n${body}`
}

type FormatConversationTranscriptOptions = {
  title?: string
  history?: CoPilotHistoryMessage[]
}

function collectConversationTurns(
  messages: ChatUiMessage[],
  options: FormatConversationTranscriptOptions,
  formatTurnFn: (role: "user" | "assistant", body: string) => string
): string[] {
  const turns = messages
    .filter(
      (message): message is ChatUiMessage & { role: "user" | "assistant" } =>
        message.role === "user" || message.role === "assistant"
    )
    .map((message) => {
      const body = formatMessageBody(message)
      if (!body) return null
      return formatTurnFn(message.role, body)
    })
    .filter((turn): turn is string => Boolean(turn))

  if (turns.length > 0) return turns

  if (!options.history?.length) return []

  return options.history
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        message.content.trim().length > 0 &&
        message.content.trim() !== "(empty)"
    )
    .map((message) => formatTurnFn(message.role, message.content.trim()))
}

function formatConversationTranscript(
  messages: ChatUiMessage[],
  options: FormatConversationTranscriptOptions = {}
): string {
  const blocks = collectConversationTurns(messages, options, formatTurn)
  if (blocks.length === 0) return ""

  const title = options.title?.trim()
  if (title) return `${title}\n\n${blocks.join("\n\n")}`
  return blocks.join("\n\n")
}

function formatConversationMarkdown(
  messages: ChatUiMessage[],
  options: FormatConversationTranscriptOptions = {}
): string {
  const blocks = collectConversationTurns(messages, options, formatMarkdownTurn)
  if (blocks.length === 0) return ""

  const title = options.title?.trim()
  if (title) return `# ${title}\n\n${blocks.join("\n\n")}\n`
  return `${blocks.join("\n\n")}\n`
}

function conversationMarkdownFilename(title?: string): string {
  const raw = title?.trim() ?? ""
  const slug = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
  return `${slug || "chat"}.md`
}

function downloadTextFile(
  filename: string,
  text: string,
  mimeType = "text/markdown;charset=utf-8"
): boolean {
  const value = text.trim()
  if (!value || typeof document === "undefined") return false

  try {
    const blob = new Blob([`${value}\n`], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.rel = "noopener"
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
    return true
  } catch {
    return false
  }
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

/**
 * Prefer the platform share sheet; fall back to clipboard when share is
 * unavailable or rejected for a non-cancel reason.
 */
async function shareTextOrCopy(text: string): Promise<"shared" | "copied" | false> {
  const value = text.trim()
  if (!value) return false

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text: value })
      return "shared"
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return false
      }
      // Desktop / blocked share — fall through to clipboard.
    }
  }

  const copied = await copyTextToClipboard(value)
  return copied ? "copied" : false
}

export {
  conversationMarkdownFilename,
  copyTextToClipboard,
  downloadTextFile,
  formatConversationMarkdown,
  formatConversationTranscript,
  formatPaperTicketBlock,
  shareTextOrCopy,
}
