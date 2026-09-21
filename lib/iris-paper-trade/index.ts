export {
  BTC_SIGNAL_SAMPLE_PROMPT,
  BTC_SIGNAL_SAMPLE_PROMPT_FA,
  ETH_SIGNAL_SAMPLE_PROMPT,
  ETH_SIGNAL_SAMPLE_PROMPT_FA,
  IRIS_COMPOSER_QUICK_PROMPTS,
  type IrisComposerQuickPrompt,
} from "@/lib/iris-paper-trade/signal-prompts"
export {
  IRIS_SAMPLE_PROMPTS,
  PAPER_TRADE_SAMPLE_PROMPT,
} from "@/lib/iris-paper-trade/types"
export type {
  IrisPaperTradeChatResult,
  IrisPaperTradePhase,
  MarketContextPacket,
  PaperTradeTicket,
  ParsedPaperDecision,
} from "@/lib/iris-paper-trade/types"
export { isPaperTradeIntent } from "@/lib/iris-paper-trade/intent"
export { assembleMarketContext } from "@/lib/iris-paper-trade/market-context"
export { parsePaperDecision } from "@/lib/iris-paper-trade/parse"
export { planIrisPaperTrade } from "@/lib/iris-paper-trade/plan"
export { formatProposedChatMessage } from "@/lib/iris-paper-trade/execute"
export { runIrisPaperTradeRequest } from "@/lib/iris-paper-trade/run"
export { PAPER_TRADE_TOOLS } from "@/lib/iris-paper-trade/schema"
