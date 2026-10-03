import { formatTradePrice } from "@/lib/chat/trade-signal"
import type { PaperTradeTicket } from "@/lib/chat/signal-ticket"

export const SIGNAL_SHARE_SITE = "exur.ai"

export function buildSignalShareText(
  ticket: PaperTradeTicket,
  labels: {
    entry: string
    stopLoss: string
    target: string
  }
): string {
  return [
    `${ticket.symbol} ${ticket.side}`,
    `${labels.entry}: ${formatTradePrice(ticket.markPrice)}`,
    `${labels.stopLoss}: ${formatTradePrice(ticket.stopLoss)}`,
    `${labels.target}: ${formatTradePrice(ticket.takeProfit)}`,
    SIGNAL_SHARE_SITE,
  ].join("\n")
}

export function signalShareFileName(ticket: PaperTradeTicket): string {
  return `${ticket.symbol.toLowerCase()}-${ticket.side.toLowerCase()}-signal.png`
}

export function buildNoTradeShareText(
  reason: string,
  labels: {
    title: string
    badge: string
    capitalProtected: string
    reasonHeading: string
  }
): string {
  const body = reason.trim()
  return [
    labels.title,
    `${labels.badge} · ${labels.capitalProtected}`,
    `${labels.reasonHeading}:`,
    body,
    SIGNAL_SHARE_SITE,
  ]
    .filter(Boolean)
    .join("\n")
}

export function noTradeShareFileName(): string {
  return "exur-no-trade.png"
}
