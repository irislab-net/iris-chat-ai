export type IrisSamplePrompt = {
  id: string
  title: string
  description: string
  text: string
}

/** Empty-state starters — regular chat; signal card only via show_trade_signal. */
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

export type IrisComposerQuickPrompt = {
  id: string
  label: string
  text: string
}

export const IRIS_COMPOSER_QUICK_PROMPTS: IrisComposerQuickPrompt[] = [
  {
    id: "btc-signal",
    label: "BTC signal",
    text: "@signal BTC",
  },
  {
    id: "btc-signal-fa",
    label: "سیگنال BTC",
    text: "سیگنال BTC",
  },
  {
    id: "market-pulse",
    label: "Market pulse",
    text: "What is Exur stance, model bias, and the news pulse on BTC right now? Keep it factual and concise. Analysis only — no trade card.",
  },
]
