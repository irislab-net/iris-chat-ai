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
    summary:
      "Scored headline tape with impact, sentiment, and asset flow, not a raw newswire.",
    audience:
      "Best when you need context on what is moving the market before you ask Exur.",
    bullets: [
      "Lead story ranked by impact score",
      "Tape windows for 15m, 1h, and 24h headline volume",
      "BTC, ETH, DXY, and gold sentiment at a glance",
    ],
  },
  iris: {
    title: "Exur",
    summary:
      "AI co-pilot beside the news feed — ask in plain language about markets and setups.",
    audience:
      "Best when you want a second read on the tape, levels, or a trade signal card.",
    bullets: [
      "Ask in natural language, no command syntax",
      "Context-aware answers tied to live market evidence",
      "Trade signal cards when the model returns a clear setup",
    ],
  },
}
