import {
  getMaxLeverage,
  isValidStopLoss,
  isValidTakeProfit,
} from "@/lib/chat/trade-signal"
import type {
  MarketContextPacket,
  ParsedPaperDecision,
  PlanIrisPaperTradeResult,
} from "@/lib/iris-paper-trade/types"

/** Reject microscopic stops that would explode risk-based size. */
export const MIN_STOP_PCT = 0.0015
/** Reject structurally implausible stops. */
export const MAX_STOP_PCT = 0.12
/** Live packet older than this is not tradable. */
export const MAX_CONTEXT_AGE_MS = 5 * 60 * 1000

export function validatePaperDecision(input: {
  decision: ParsedPaperDecision
  context: MarketContextPacket
  now?: number
}): PlanIrisPaperTradeResult {
  const now = input.now ?? Date.now()
  const { decision, context } = input
  const mark = context.live.price

  if (!(mark > 0) || !Number.isFinite(mark)) {
    return {
      status: "rejected",
      reason: "MISSING_LIVE_PRICE",
      detail: "Live price is missing.",
    }
  }

  if (
    !(context.asOf > 0) ||
    Math.abs(now - context.asOf) > MAX_CONTEXT_AGE_MS
  ) {
    return {
      status: "rejected",
      reason: "STALE_CONTEXT",
      detail: "Market context is stale.",
    }
  }

  if (decision.action === "NO_TRADE") {
    return {
      status: "no_trade",
      reason: decision.args.reason || "No valid setup.",
    }
  }

  const args = decision.args
  const symbol = args.symbol.trim().toUpperCase()
  if (symbol !== context.symbol.trim().toUpperCase()) {
    return {
      status: "rejected",
      reason: "SYMBOL_MISMATCH",
      detail: "Proposal symbol does not match market context.",
    }
  }

  if (args.direction !== "LONG" && args.direction !== "SHORT") {
    return {
      status: "rejected",
      reason: "INVALID_DIRECTION",
      detail: "Direction must be LONG or SHORT.",
    }
  }

  if (!args.setup.trim() || !args.thesis.trim()) {
    return {
      status: "rejected",
      reason: "STRUCTURED_OUTPUT_INVALID",
      detail: "Setup and thesis are required.",
    }
  }

  const levCheck = getMaxLeverage(symbol)
  if (!Number.isInteger(args.leverage) || args.leverage < 1) {
    return {
      status: "rejected",
      reason: "INVALID_LEVERAGE",
      detail: "Leverage must be an integer >= 1.",
    }
  }
  if (args.leverage > levCheck) {
    return {
      status: "rejected",
      reason: "INVALID_LEVERAGE",
      detail: `Leverage exceeds max ${levCheck}x.`,
    }
  }

  if (!isValidStopLoss(args.direction, mark, args.stopLoss)) {
    return {
      status: "rejected",
      reason: "INVALID_LEVELS",
      detail:
        args.direction === "LONG"
          ? "SL must be below the live price for LONG."
          : "SL must be above the live price for SHORT.",
    }
  }
  if (!isValidTakeProfit(args.direction, mark, args.takeProfit)) {
    return {
      status: "rejected",
      reason: "INVALID_LEVELS",
      detail:
        args.direction === "LONG"
          ? "TP must be above the live price for LONG."
          : "TP must be below the live price for SHORT.",
    }
  }

  const stopPct = Math.abs(args.stopLoss - mark) / mark
  if (stopPct < MIN_STOP_PCT) {
    return {
      status: "rejected",
      reason: "STOP_TOO_TIGHT",
      detail: "Stop is too close to the live price.",
    }
  }
  if (stopPct > MAX_STOP_PCT) {
    return {
      status: "rejected",
      reason: "STOP_TOO_WIDE",
      detail: "Stop is too far from the live price.",
    }
  }

  return {
    status: "ready",
    symbol,
    side: args.direction,
    quantity: 0,
    markPrice: mark,
    stopLoss: args.stopLoss,
    takeProfit: args.takeProfit,
    leverage: args.leverage,
    setup: args.setup.trim(),
    thesis: args.thesis.trim(),
  }
}
