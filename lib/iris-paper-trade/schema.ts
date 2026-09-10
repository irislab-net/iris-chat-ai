/**
 * OpenAI-compatible Function Calling tools with strict: true.
 * additionalProperties: false + every key required so arguments must match
 * this JSON Schema exactly (no size/fee/fill fields — engine-owned).
 */

export const OPEN_PAPER_TRADE_TOOL_NAME = "open_paper_trade" as const
export const NO_TRADE_TOOL_NAME = "no_trade" as const

export const OPEN_PAPER_TRADE_PARAMETERS = {
  type: "object",
  additionalProperties: false,
  required: [
    "symbol",
    "direction",
    "setup",
    "stopLoss",
    "takeProfit",
    "leverage",
    "thesis",
  ],
  properties: {
    symbol: {
      type: "string",
      enum: ["ETH", "BTC"],
      description: "Instrument matching the MarketContext packet.",
    },
    direction: {
      type: "string",
      enum: ["LONG", "SHORT"],
    },
    setup: {
      type: "string",
      description: "Short name of the setup (not a profit claim).",
    },
    stopLoss: {
      type: "number",
      description: "Absolute stop-loss price, consistent with live price.",
    },
    takeProfit: {
      type: "number",
      description: "Absolute take-profit price, consistent with live price.",
    },
    leverage: {
      type: "integer",
      description: "Integer leverage. Size is NOT decided here.",
    },
    thesis: {
      type: "string",
      description: "Why this setup is valid from the provided evidence only.",
    },
  },
} as const

export const NO_TRADE_PARAMETERS = {
  type: "object",
  additionalProperties: false,
  required: ["reason"],
  properties: {
    reason: {
      type: "string",
      description: "Why conditions are insufficient. Do not open a trade.",
    },
  },
} as const

export const PAPER_TRADE_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: OPEN_PAPER_TRADE_TOOL_NAME,
      description:
        "Propose one paper setup. Do not calculate size, fees, slippage, margin, liquidation, or fill.",
      strict: true as const,
      parameters: OPEN_PAPER_TRADE_PARAMETERS,
    },
  },
  {
    type: "function" as const,
    function: {
      name: NO_TRADE_TOOL_NAME,
      description:
        "Last resort when live data is unusable or no safe SL/TP levels exist. Do NOT use simply because the market is ranging or models are neutral.",
      strict: true as const,
      parameters: NO_TRADE_PARAMETERS,
    },
  },
]

export const OPEN_PAPER_TRADE_KEYS = [
  "symbol",
  "direction",
  "setup",
  "stopLoss",
  "takeProfit",
  "leverage",
  "thesis",
] as const

export const NO_TRADE_KEYS = ["reason"] as const
