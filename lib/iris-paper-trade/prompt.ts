import { serializeMarketContextForLlm } from "@/lib/iris-paper-trade/market-context"
import type { MarketContextPacket } from "@/lib/iris-paper-trade/types"
import { PAPER_TRADE_SAMPLE_PROMPT } from "@/lib/iris-paper-trade/types"
import {
  PAPER_AI_RISK_FRACTION,
  paperRiskAmountUsd,
} from "@/lib/iris-paper-trade/size"
import { SIGNAL_DEMO_EQUITY } from "@/lib/chat/trade-signal"

export { PAPER_TRADE_SAMPLE_PROMPT }

export const PAPER_TRADE_MODEL_INSTRUCTIONS = `You are IRIS evaluating ONE user-initiated trade-signal request.

Call exactly one function:
- open_paper_trade
- no_trade

Decide ONLY from the MARKET_CONTEXT packet. Do not invent prices or news.

You decide: DIRECTION, SETUP, SL, TP, LEVERAGE, THESIS.
You do NOT decide: SIZE. Size is computed from a fixed demo equity and stop distance for display on the signal card.

Rules:
- Use ALL fields in MARKET_CONTEXT: live price, trend, volatility, models, insight stance/bias, news.
- Your default is open_paper_trade when you can define safe SL/TP from the live price.
- Range/sideways conditions are NOT automatic no_trade — find mean-reversion, breakout, or model-driven edge.
- stopLoss and takeProfit must be absolute prices on the correct side of the live price.
- Never guarantee profit. Never claim a trade is "winning".
- One decision only. Do not monitor, retry, or open additional trades.
- Do not include size, quantity, fees, slippage, liquidation, or fill in tool arguments.
- Use no_trade ONLY when: live data is stale/missing, evidence is truly unusable, or SL/TP cannot be placed safely.
- Write setup, thesis, and reason in English.`

/** Evidence packet for the model — lives in `instructions`, never in chat `message`. */
export function buildPaperTradeContextInstructions(
  packet: MarketContextPacket
): string {
  const riskUsd = paperRiskAmountUsd(SIGNAL_DEMO_EQUITY)
  const demoAccount = {
    equity_usdc: SIGNAL_DEMO_EQUITY,
    risk_fraction: PAPER_AI_RISK_FRACTION,
    risk_per_trade_usdc: riskUsd,
  }

  return `Decide ONLY from the MARKET_CONTEXT packet below. Do not invent prices or news.

MARKET_CONTEXT (authoritative evidence; asOf=${packet.asOfIso}):
${JSON.stringify(serializeMarketContextForLlm(packet))}

DEMO_ACCOUNT (fixed display sizing; size is computed from equity and stop distance):
${JSON.stringify(demoAccount)}

Use open_paper_trade or no_trade via function call only. Do NOT respond with prose-only trade setups or say you cannot open trades in text.`
}

/** Strip leaked MARKET_CONTEXT / PAPER_ACCOUNT appendices from user-visible chat text. */
export function stripMarketContextAppendix(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed

  const markers = [
    /\n*---\s*\n+MARKET_CONTEXT\b/i,
    /\n+MARKET_CONTEXT\s*\(/i,
    /\n+MARKET_CONTEXT\b/i,
    /\n+PAPER_ACCOUNT\b/i,
    /\n+DEMO_ACCOUNT\b/i,
  ] as const

  let cut = -1
  for (const marker of markers) {
    const match = marker.exec(trimmed)
    if (match?.index != null && (cut < 0 || match.index < cut)) {
      cut = match.index
    }
  }
  if (cut < 0) return trimmed
  return trimmed.slice(0, cut).trim()
}

export function formatNoTradeChatMessage(reason: string): string {
  const trimmed = reason.trim() || "Conditions are not sufficient."
  return `No trade signal.\n\n${trimmed}`
}

export function formatRejectedChatMessage(detail: string): string {
  return `No trade signal.\n\nThe setup did not pass validation.${
    detail ? `\n\n${detail}` : ""
  }`
}
