import {
  formatPaperPrice,
  openPaperTrade,
  type OpenPaperTradeInput,
  type PaperPosition,
  type PaperState,
} from "@/lib/paper-trading"
import { planIrisPaperTrade } from "@/lib/iris-paper-trade/plan"
import {
  PAPER_AI_RISK_FRACTION,
  paperRiskAmountUsd,
} from "@/lib/iris-paper-trade/size"
import type {
  MarketContextPacket,
  ParsedPaperDecision,
} from "@/lib/iris-paper-trade/types"

export function formatProposedChatMessage(input: {
  symbol: string
  side: PaperPosition["side"]
  setup: string
  thesis: string
  quantity: number
  leverage: number
  entryPrice: number
  stopLoss: number
  takeProfit: number
  equity?: number
}): string {
  const riskUsd =
    input.equity != null && input.equity > 0
      ? paperRiskAmountUsd(input.equity)
      : null
  const riskLabel =
    riskUsd != null
      ? `Size ${input.quantity} (risk ~$${riskUsd.toFixed(2)} = ${(PAPER_AI_RISK_FRACTION * 100).toFixed(1)}% of demo equity)`
      : `Size ${input.quantity} (risk-based)`

  return [
    `Exur setup. Not a profit guarantee. No paper trade is open yet.`,
    ``,
    `${input.symbol} ${input.side}`,
    `Setup: ${input.setup}`,
    `Entry ${formatPaperPrice(input.entryPrice)}`,
    `SL ${formatPaperPrice(input.stopLoss)}`,
    `TP ${formatPaperPrice(input.takeProfit)}`,
    `Leverage ${input.leverage}x`,
    riskLabel,
    ``,
    input.thesis,
  ].join("\n")
}

export function formatOpenedChatMessage(input: {
  symbol: string
  side: PaperPosition["side"]
  setup: string
  thesis: string
  quantity: number
  leverage: number
  entryPrice: number
  stopLoss: number | null
  takeProfit: number | null
}): string {
  const sl =
    input.stopLoss != null ? formatPaperPrice(input.stopLoss) : "—"
  const tp =
    input.takeProfit != null ? formatPaperPrice(input.takeProfit) : "—"
  return [
    `Paper trade opened from an Exur setup (not a profit guarantee).`,
    ``,
    `${input.symbol} ${input.side}`,
    `Setup: ${input.setup}`,
    `Entry ${formatPaperPrice(input.entryPrice)} (market fill; fees and slippage applied by the engine)`,
    `SL ${sl}`,
    `TP ${tp}`,
    `Leverage ${input.leverage}x`,
    `Size ${input.quantity} (risk-based)`,
    ``,
    input.thesis,
  ].join("\n")
}

export function executeIrisPaperPlan(input: {
  decision: ParsedPaperDecision
  context: MarketContextPacket
  state: PaperState
  now?: number
}):
  | { status: "no_trade"; reason: string }
  | { status: "rejected"; reason: string; detail: string }
  | {
      status: "opened"
      state: PaperState
      position: PaperPosition
      quantity: number
      setup: string
      thesis: string
    } {
  const plan = planIrisPaperTrade(input)
  if (plan.status === "no_trade") return plan
  if (plan.status === "rejected") return plan

  const ticket: OpenPaperTradeInput = {
    symbol: plan.symbol,
    side: plan.side,
    quantity: plan.quantity,
    entryPrice: plan.markPrice,
    stopLoss: plan.stopLoss,
    takeProfit: plan.takeProfit,
    leverage: plan.leverage,
    source: "IRIS_AI",
  }

  const opened = openPaperTrade(input.state, ticket)
  if (opened.error || !opened.position) {
    return {
      status: "rejected",
      reason: "ENGINE_REJECTED",
      detail: opened.error || "Engine did not open a position.",
    }
  }

  return {
    status: "opened",
    state: opened.state,
    position: opened.position,
    quantity: plan.quantity,
    setup: plan.setup,
    thesis: plan.thesis,
  }
}
