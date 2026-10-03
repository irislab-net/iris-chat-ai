export type IrisSamplePrompt = {
  id: string
  title: string
  description: string
  text: string
}

/** Empty-state starters aligned to BTC, ETH, XAU, and news impact. */
export const IRIS_SAMPLE_PROMPTS: readonly IrisSamplePrompt[] = [
  {
    id: "btc-setup",
    title: "BTC Setup Evaluation",
    description: "Check live entry points and reward to risk ratio.",
    text: "Evaluate the live tape for Bitcoin (BTC) to find a viable setup. If there is a market edge, provide the entry and invalidation levels. Otherwise, advise to wait.",
  },
  {
    id: "news-impact",
    title: "Macro News Filter",
    description: "Check how today's top headlines impact the market.",
    text: "What are the most critical live headlines today, and exactly how are they impacting market liquidity and sentiment? Only analyze high impact news.",
  },
  {
    id: "xau-macro",
    title: "Gold (XAU) Macro Structure",
    description: "Analyze gold trends for capital protection.",
    text: "Analyze the live structure of Gold (XAU). Given the current momentum, is it structurally safe to enter now to protect capital, or should I wait for a pullback?",
  },
  {
    id: "eth-liquidity",
    title: "ETH Liquidity Map",
    description: "Identify key structural support and resistance.",
    text: "Map the key structural support and resistance levels for Ethereum (ETH) based on live price. Where is the primary liquidity resting right now?",
  },
] as const

export type IrisComposerQuickPrompt = {
  id: string
  label: string
  text: string
}

export const IRIS_COMPOSER_QUICK_PROMPTS: IrisComposerQuickPrompt[] = [
  {
    id: "btc-setup",
    label: "BTC setup",
    text: "Evaluate the live tape for Bitcoin (BTC) to find a viable setup. If there is a market edge, provide the entry and invalidation levels. Otherwise, advise to wait.",
  },
  {
    id: "btc-setup-fa",
    label: "ستاپ BTC",
    text: "وضعیت زنده بیت کوین (BTC) را برای یک ستاپ معاملاتی ارزیابی کن. در صورت وجود مزیت بازار، نقطه ورود و حد ضرر را بده و در غیر این صورت دستور صبر صادر کن.",
  },
  {
    id: "news-impact",
    label: "News filter",
    text: "What are the most critical live headlines today, and exactly how are they impacting market liquidity and sentiment? Only analyze high impact news.",
  },
]
