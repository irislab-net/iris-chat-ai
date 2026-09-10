export const WORKSPACE_PAGE_IDS = ["desk", "news", "intel", "iris"] as const

export type WorkspacePageId = (typeof WORKSPACE_PAGE_IDS)[number]

export type WorkspacePageInfo = {
  title: string
  summary: string
  audience: string
  bullets: string[]
}

export const WORKSPACE_PAGE_INFO: Record<WorkspacePageId, WorkspacePageInfo> = {
  desk: {
    title: "Desk",
    summary:
      "Paper trading in one place — chart, order ticket, and book without switching apps.",
    audience:
      "Best when you want to practice entries, stops, sizing, and position management on live market data.",
    bullets: [
      "Chart + timeframe for the active market",
      "Demo mode to place and manage orders safely",
      "Book tab for open positions, orders, and history",
    ],
  },
  news: {
    title: "News",
    summary:
      "Scored headline tape with impact, sentiment, and asset flow — not a raw newswire.",
    audience:
      "Best when you need context on what is moving the market before you commit to a bias or trade.",
    bullets: [
      "Lead story ranked by impact score",
      "Tape windows for 15m, 1h, and 24h headline volume",
      "BTC, ETH, DXY, and gold sentiment at a glance",
    ],
  },
  intel: {
    title: "Intel",
    summary:
      "Model distance, risk geometry, and classifier status for the current insight update.",
    audience:
      "Best when you want the why behind the pulse — thresholds, edge, MAE/MFE, and which models are live.",
    bullets: [
      "Distance-to-threshold for long, short, breakout, and scalp models",
      "MAE / MFE and reward-to-risk for the active candle",
      "GO / WATCH / WAIT chips per classifier",
    ],
  },
  iris: {
    title: "IRIS",
    summary:
      "AI co-pilot grounded in your desk — tape, funding, and model context in plain language.",
    audience:
      "Best when you want a second read on the next move, bracket logic, or how the desk fits together.",
    bullets: [
      "Ask in natural language — no command syntax",
      "Context-aware answers tied to the app workspace",
      "Use alongside Desk, News, and Intel — not instead of them",
    ],
  },
}
