import { serializeMarketContextForLlm } from "@/lib/iris-paper-trade/market-context"
import type { MarketContextPacket } from "@/lib/iris-paper-trade/types"
import { PAPER_TRADE_SAMPLE_PROMPT } from "@/lib/iris-paper-trade/types"
import { serializePaperAccountForLlm } from "@/lib/paper-trading/account-context"
import type { PaperState } from "@/lib/paper-trading"

export { PAPER_TRADE_SAMPLE_PROMPT }

export const PAPER_TRADE_MODEL_INSTRUCTIONS = `You are IRIS on the trading desk evaluating ONE user-initiated trade request.

Call exactly one function:
- open_paper_trade
- no_trade

Decide ONLY from the MARKET_CONTEXT packet. Do not invent prices or news.

You decide: DIRECTION, SETUP, SL, TP, LEVERAGE, THESIS.
You do NOT decide: SIZE, FEES, SLIPPAGE, MARGIN, FILL, LIQUIDATION. Those belong to the paper engine.

The user's demo budget is in PAPER_ACCOUNT. Position size is computed by the engine as risk_fraction × equity_usdc divided by stop distance. Respect their capital when choosing leverage and stop distance — tight stops on small accounts can still fail margin checks.

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
  packet: MarketContextPacket,
  paperState?: PaperState | null
): string {
  const paperAccount =
    paperState != null
      ? serializePaperAccountForLlm(paperState)
      : null

  return `Decide ONLY from the MARKET_CONTEXT packet below. Do not invent prices or news.

MARKET_CONTEXT (authoritative evidence; asOf=${packet.asOfIso}):
${JSON.stringify(serializeMarketContextForLlm(packet))}
${
  paperAccount
    ? `
PAPER_ACCOUNT (user demo budget; size is engine-owned from equity and stop distance):
${JSON.stringify(paperAccount)}`
    : ""
}

Use open_paper_trade or no_trade via function call only. Do NOT respond with prose-only trade setups or say you cannot open trades in text.`
}

/** @deprecated Prefer clean `message` + `buildPaperTradeContextInstructions`. */
export function wrapPaperTradeUserMessage(
  userText: string,
  packet: MarketContextPacket,
  paperState?: PaperState | null
): string {
  return `${userText.trim()}

---
${buildPaperTradeContextInstructions(packet, paperState)}`
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
  return `No paper trade opened.\n\n${trimmed}`
}

export function formatRejectedChatMessage(detail: string): string {
  return `No paper trade opened.\n\nThe setup did not pass validation, so nothing was executed.${
    detail ? `\n\n${detail}` : ""
  }`
}
