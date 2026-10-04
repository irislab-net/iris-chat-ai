import type { ChatThinkingStep } from "@/lib/api/chat-sse"
import type { TradeSignalTicket } from "@/lib/chat/signal-ticket"
import { IRIS_SAMPLE_PROMPTS } from "@/lib/chat/sample-prompts"

/** Premium XAU setup card for the Features gold section. */
export const FEATURES_XAU_TICKET: TradeSignalTicket = {
  symbol: "XAU",
  side: "LONG",
  quantity: 0,
  markPrice: 4148,
  stopLoss: 4092,
  takeProfit: 4265,
  leverage: 3,
  setup: "Long gold into dollar soft tape",
  thesis:
    "Spot holds above prior week mid while DXY fades. Prefer gold for capital protection over forcing crypto.",
  timeHorizon: "1-3d",
  entryReason: "Above prior session mid",
  stopLossReason: "Under weekly shelf",
  takeProfitReason: "Into prior swing high",
}

/** Honest sit-out copy when gold structure is unclear. */
export const FEATURES_XAU_WAIT_REASON =
  "Gold is near highs with choppy dollar follow-through. Structure is unclear above the prior mid — wait for a cleaner pullback before committing."

/** BTC wait reason from a real fixture turn (quality section). */
export const FEATURES_QUALITY_WAIT_REASON =
  "BTC tape is highly compressed near the mid with quiet volume. A valid trade needs a break beyond the compression band before a compliant structure appears."

/** Thinking receipt: real server tools Exur calls before answering. */
export const FEATURES_QUALITY_THINKING_STEPS: ChatThinkingStep[] = [
  {
    type: "reasoning",
    text: "Reading the ask against live desk context — structure first, then news pulse, then whether a setup clears.",
  },
  { type: "tool", name: "get_market_state" },
  { type: "tool", name: "get_model_intelligence" },
  { type: "tool", name: "get_latest_market_news" },
  { type: "tool", name: "get_latest_news_intelligence" },
]

export const FEATURES_QUALITY_THINKING_DURATION_SEC = 8

/** Desk assets for the tools picker (mirrors signal-guidance). */
export const FEATURES_TOOL_ASSETS = [
  { symbol: "ETH" as const, nameKey: "eth" as const },
  { symbol: "BTC" as const, nameKey: "btc" as const },
  { symbol: "XAU" as const, nameKey: "xau" as const },
]

export type FeaturesToolSymbol =
  (typeof FEATURES_TOOL_ASSETS)[number]["symbol"]

export const FEATURES_GOLD_ASK =
  IRIS_SAMPLE_PROMPTS.find((p) => p.id === "xau-macro")?.text ??
  "Analyze the live structure of Gold (XAU)."
