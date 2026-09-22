export const WORKSPACE_PAGE_IDS = ["news", "iris"] as const

export type WorkspacePageId = (typeof WORKSPACE_PAGE_IDS)[number]

export type WorkspacePageInfo = {
  title: string
  summary: string
  audience: string
  bullets: string[]
}

export const WORKSPACE_PAGE_INFO: Record<WorkspacePageId, WorkspacePageInfo> = {
  news: {
    title: "News",
    summary: "Headlines ranked by impact, with sentiment and asset flow.",
    audience:
      "Start here when you want to see what is moving before you ask Exur.",
    bullets: [
      "Lead story ranked by impact",
      "Headline volume for 15m, 1h, and 24h",
      "BTC, ETH, DXY, and gold sentiment at a glance",
    ],
  },
  iris: {
    title: "Exur",
    summary: "Ask about markets, news, and setups in plain language.",
    audience:
      "Open this when you want a quick take on the news, a level, or a trade idea.",
    bullets: [
      "Ask in plain language — nothing to memorize",
      "Answers grounded in live market context",
      "Trade signal cards when a clear setup appears",
    ],
  },
}
