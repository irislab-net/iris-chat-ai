import { formatTradePrice, SIGNAL_DEMO_EQUITY, type PaperSide } from "@/lib/chat/trade-signal"
import {
  PAPER_AI_RISK_FRACTION,
  paperRiskAmountUsd,
} from "@/lib/iris-paper-trade/size"

export function formatProposedChatMessage(input: {
  symbol: string
  side: PaperSide
  setup: string
  thesis: string
  quantity: number
  leverage: number
  entryPrice: number
  stopLoss: number
  takeProfit: number
  equity?: number
}): string {
  const equity = input.equity ?? SIGNAL_DEMO_EQUITY
  const riskUsd = equity > 0 ? paperRiskAmountUsd(equity) : null
  const riskLabel =
    riskUsd != null
      ? `Size ${input.quantity} (risk ~$${riskUsd.toFixed(2)} = ${(PAPER_AI_RISK_FRACTION * 100).toFixed(1)}% of demo equity)`
      : `Size ${input.quantity} (risk-based)`

  return [
    `Exur setup. Not a profit guarantee.`,
    ``,
    `${input.symbol} ${input.side}`,
    `Setup: ${input.setup}`,
    `Entry ${formatTradePrice(input.entryPrice)}`,
    `SL ${formatTradePrice(input.stopLoss)}`,
    `TP ${formatTradePrice(input.takeProfit)}`,
    `Leverage ${input.leverage}x`,
    riskLabel,
    ``,
    input.thesis,
  ].join("\n")
}
