import {
  formatTradingPnl,
  formatTradingPnlPct,
  formatTradingPrice,
  formatTradingQty,
  tradingPnlPct,
} from "@/lib/trading/format"
import {
  type ClosedTrade,
  type Position,
} from "@/lib/trading/types"

function buildPositionChatPrompt(
  position: Position,
  mark: number
): string {
  const pct = tradingPnlPct(position.side, position.entryPrice, mark)
  const side = position.side === "LONG" ? "long" : "short"

  return [
    `Review my open ${side} ${formatTradingQty(position.quantity)} ${position.symbol} position.`,
    `Entry ${formatTradingPrice(position.entryPrice)} · Mark ${formatTradingPrice(mark)} · PnL ${formatTradingPnl(position.unrealizedPnl)} (${formatTradingPnlPct(pct)})`,
    `Leverage ${position.leverage.value}x ${position.marginMode === "CROSS" ? "cross" : "isolated"} · SL ${position.stopLoss != null ? formatTradingPrice(position.stopLoss) : "none"} · TP ${position.takeProfit != null ? formatTradingPrice(position.takeProfit) : "none"}`,
    "What should I watch for, and should I adjust TP/SL?",
  ].join("\n")
}

function buildClosedTradeChatPrompt(trade: ClosedTrade): string {
  const side = trade.side === "LONG" ? "long" : "short"

  return [
    `Review my closed ${side} ${formatTradingQty(trade.quantity)} ${trade.symbol} trade (${trade.reason.replaceAll("_", " ").toLowerCase()}).`,
    `Entry ${formatTradingPrice(trade.entryPrice)} · Exit ${formatTradingPrice(trade.exitPrice)} · Realized PnL ${formatTradingPnl(trade.realizedPnl)}`,
    "What went well and what would you do differently next time?",
  ].join("\n")
}

function buildClosedTradeTracePrompt(trade: ClosedTrade): string {
  const side = trade.side === "LONG" ? "long" : "short"
  const holdMinutes = Math.max(
    1,
    Math.round((trade.closedAt - trade.openedAt) / 60_000)
  )

  return [
    `Trace my closed ${side} ${formatTradingQty(trade.quantity)} ${trade.symbol} trade step by step.`,
    `Entry ${formatTradingPrice(trade.entryPrice)} · Exit ${formatTradingPrice(trade.exitPrice)} · Hold ~${holdMinutes}m · Exit reason ${trade.reason.replaceAll("_", " ").toLowerCase()}`,
    `Realized PnL ${formatTradingPnl(trade.realizedPnl)}`,
    "Walk through the timeline: entry timing, peak/trough, exit decision, and one concrete improvement for next time.",
  ].join("\n")
}

function buildPositionClipboardSummary(
  position: Position,
  mark: number
): string {
  const pct = tradingPnlPct(position.side, position.entryPrice, mark)

  return [
    `${position.side} ${formatTradingQty(position.quantity)} ${position.symbol}`,
    `Entry ${formatTradingPrice(position.entryPrice)}`,
    `Mark ${formatTradingPrice(mark)}`,
    `PnL ${formatTradingPnl(position.unrealizedPnl)} (${formatTradingPnlPct(pct)})`,
    `SL ${position.stopLoss != null ? formatTradingPrice(position.stopLoss) : "—"}`,
    `TP ${position.takeProfit != null ? formatTradingPrice(position.takeProfit) : "—"}`,
    `${position.leverage.value}x ${position.marginMode}`,
  ].join(" · ")
}

function buildClosedTradeClipboardSummary(trade: ClosedTrade): string {
  return [
    `${trade.side} ${formatTradingQty(trade.quantity)} ${trade.symbol}`,
    `Entry ${formatTradingPrice(trade.entryPrice)}`,
    `Exit ${formatTradingPrice(trade.exitPrice)}`,
    `PnL ${formatTradingPnl(trade.realizedPnl)}`,
    trade.reason.replaceAll("_", " "),
  ].join(" · ")
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.opacity = "0"
  document.body.appendChild(area)
  area.select()
  document.execCommand("copy")
  document.body.removeChild(area)
}

export {
  buildClosedTradeChatPrompt,
  buildClosedTradeTracePrompt,
  buildClosedTradeClipboardSummary,
  buildPositionChatPrompt,
  buildPositionClipboardSummary,
  copyTextToClipboard,
}
