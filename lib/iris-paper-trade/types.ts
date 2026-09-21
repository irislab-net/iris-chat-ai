import type { PaperSide } from "@/lib/chat/trade-signal"
import {
  BTC_SIGNAL_SAMPLE_PROMPT,
  ETH_SIGNAL_SAMPLE_PROMPT,
} from "@/lib/iris-paper-trade/signal-prompts"

export const PAPER_TRADE_SAMPLE_PROMPT = BTC_SIGNAL_SAMPLE_PROMPT

export type IrisSamplePrompt = {
  id: string
  title: string
  description: string
  text: string
}

/** Empty-state starters — regular chat; signal card only via show_trade_signal when clear. */
export const IRIS_SAMPLE_PROMPTS: readonly IrisSamplePrompt[] = [
  {
    id: "btc-signal",
    title: "BTC trade signal",
    description:
      "Ask for a live setup — card only when the model has a clear read.",
    text: "@signal BTC",
  },
  {
    id: "market-pulse",
    title: "Market pulse",
    description: "Stance, model bias, and news — analysis only.",
    text: "What is Exur's stance and model bias on BTC right now, and what does the news pulse say? Keep it factual and concise. Analysis only — no trade card.",
  },
  {
    id: "key-levels",
    title: "Key levels",
    description: "Nearest support and resistance that matter now.",
    text: "Map BTC's key support and resistance from recent structure and live price. Call out the nearest levels and whether price is pressing, rejecting, or mid-range. Analysis only — no trade card.",
  },
] as const

/** Legacy samples — still recognized as paper-trade intent. */
export const PAPER_TRADE_SAMPLE_PROMPT_EN_PREV =
  "Based on live price, trend, volatility, news, and current Exur analysis: if a valid setup exists right now, propose one Paper Trade with Entry, SL, and TP. If conditions are not sufficient, do not propose a trade."

export const PAPER_TRADE_SAMPLE_PROMPT_EN_LEGACY =
  "Use live price, trend, volatility, news, and current Exur analysis. If a valid setup exists right now, propose one Paper Trade with Entry, SL, and TP. If conditions are not sufficient, do not open a trade."

/** Legacy Persian sample — still recognized as paper-trade intent. */
export const PAPER_TRADE_SAMPLE_PROMPT_FA =
  "بازار اتریوم را با قیمت زنده، روند، نوسان، اخبار و مدل‌های Exur بررسی کن. اگر الان ستاپ معتبر داری، یک Paper Trade با entry، stop loss و take profit پیشنهاد بده. اگر شرایط کافی نیست، معامله باز نکن."

export const PAPER_TRADE_INTENT_PROMPTS = [
  PAPER_TRADE_SAMPLE_PROMPT,
  ETH_SIGNAL_SAMPLE_PROMPT,
  PAPER_TRADE_SAMPLE_PROMPT_EN_PREV,
  PAPER_TRADE_SAMPLE_PROMPT_EN_LEGACY,
  PAPER_TRADE_SAMPLE_PROMPT_FA,
] as const

export type PaperDecisionAction = "OPEN_PAPER_TRADE" | "NO_TRADE"

export type OpenPaperTradeToolArgs = {
  symbol: string
  direction: PaperSide
  setup: string
  stopLoss: number
  takeProfit: number
  leverage: number
  thesis: string
}

export type NoTradeToolArgs = {
  reason: string
}

export type ParsedPaperDecision =
  | { action: "OPEN_PAPER_TRADE"; args: OpenPaperTradeToolArgs }
  | { action: "NO_TRADE"; args: NoTradeToolArgs }

export type ModelClassifierSnapshot = {
  p: number
  edge: number
  signal: boolean
}

export type MarketContextPacket = {
  asOf: number
  asOfIso: string
  symbol: string
  timeframe: string
  live: {
    price: number
    barTime: number
    source: "hyperliquid"
  }
  trend: {
    bars: number
    closeFirst: number
    closeLast: number
    changePct: number
    recentCloses: number[]
  }
  volatility: {
    rangePct: number
    atrPct: number
  }
  insight: {
    stance: string
    bias: string
    headline: string
    calmness: string
    rewardRisk: number
    expectedMovePct: number
    generatedAt: number
  } | null
  models: {
    long: ModelClassifierSnapshot
    short: ModelClassifierSnapshot
    breakout: ModelClassifierSnapshot
    fast: ModelClassifierSnapshot
  } | null
  news: {
    ethSummary: string | null
    items: Array<{
      title: string
      impact: number
      sentiment: number
      publishedAt: number
    }>
  }
}

export type PaperProposalRejectReason =
  | "STRUCTURED_OUTPUT_INVALID"
  | "EXTRA_PROPERTIES"
  | "MISSING_LIVE_PRICE"
  | "STALE_CONTEXT"
  | "SYMBOL_MISMATCH"
  | "INVALID_DIRECTION"
  | "INVALID_LEVELS"
  | "INVALID_LEVERAGE"
  | "STOP_TOO_TIGHT"
  | "STOP_TOO_WIDE"
  | "EXISTING_POSITION"
  | "INVALID_SIZE"
  | "INSUFFICIENT_MARGIN"
  | "ENGINE_REJECTED"
  | "MULTIPLE_TOOL_CALLS"

export type PlanIrisPaperTradeResult =
  | {
      status: "no_trade"
      reason: string
    }
  | {
      status: "rejected"
      reason: PaperProposalRejectReason
      detail: string
    }
  | {
      status: "ready"
      symbol: string
      side: PaperSide
      quantity: number
      markPrice: number
      stopLoss: number
      takeProfit: number
      leverage: number
      setup: string
      thesis: string
    }

/** Engine ticket held until the user confirms Open Paper Trade. */
export type PaperTradeTicket = {
  symbol: string
  side: PaperSide
  quantity: number
  markPrice: number
  stopLoss: number
  takeProfit: number
  leverage: number
  setup: string
  thesis: string
  /** Optional display fields from `show_trade_signal` (omit when absent). */
  timeHorizon?: string
  entryReason?: string
  stopLossReason?: string
  takeProfitReason?: string
}

export type IrisPaperTradeChatResult =
  | {
      status: "no_trade"
      message: string
      reason: string
    }
  | {
      status: "rejected"
      message: string
      reason: PaperProposalRejectReason
      detail: string
    }
  | {
      status: "proposed"
      message: string
      ticket: PaperTradeTicket
    }

export type IrisPaperTradePhase = "context" | "evaluate"
