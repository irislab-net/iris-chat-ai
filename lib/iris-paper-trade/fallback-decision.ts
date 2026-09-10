import { getMaxLeverage } from "@/lib/paper-trading"
import {
  MAX_STOP_PCT,
  MIN_STOP_PCT,
} from "@/lib/iris-paper-trade/validate"
import type {
  MarketContextPacket,
  OpenPaperTradeToolArgs,
  ParsedPaperDecision,
} from "@/lib/iris-paper-trade/types"

/** Values above this are treated as whole-percent (e.g. 1.2 → 1.2%). */
const PERCENT_HEURISTIC = 0.15

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function asFraction(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return value > PERCENT_HEURISTIC ? value / 100 : value
}

function roundPrice(price: number): number {
  const abs = Math.abs(price)
  const digits = abs >= 100 ? 1 : abs >= 1 ? 2 : 4
  const factor = 10 ** digits
  return Math.round(price * factor) / factor
}

function resolveDirection(
  packet: MarketContextPacket
): OpenPaperTradeToolArgs["direction"] | null {
  const models = packet.models
  let longScore = 0
  let shortScore = 0

  if (models) {
    longScore =
      models.long.edge + (models.long.signal ? models.long.p * 0.35 : 0)
    shortScore =
      models.short.edge + (models.short.signal ? models.short.p * 0.35 : 0)
  }

  const bias = packet.insight?.bias?.trim().toUpperCase() ?? ""
  if (/(SHORT|BEAR|SELL)/.test(bias)) shortScore += 0.04
  if (/(LONG|BULL|BUY)/.test(bias)) longScore += 0.04

  if (Math.abs(longScore - shortScore) < 0.015) {
    if (packet.trend.changePct > 0.08) longScore += 0.02
    else if (packet.trend.changePct < -0.08) shortScore += 0.02
  }

  if (Math.abs(longScore - shortScore) < 0.01) return null
  return longScore > shortScore ? "LONG" : "SHORT"
}

function pickLeverage(
  symbol: string,
  direction: OpenPaperTradeToolArgs["direction"],
  packet: MarketContextPacket
): number {
  const models = packet.models
  const edge =
    direction === "LONG" ? models?.long.edge ?? 0 : models?.short.edge ?? 0
  const p = direction === "LONG" ? models?.long.p ?? 0.5 : models?.short.p ?? 0.5
  const strength = Math.max(0, edge) + Math.max(0, p - 0.5)
  const base = strength >= 0.12 ? 5 : strength >= 0.05 ? 4 : 3
  return Math.min(base, getMaxLeverage(symbol))
}

function buildThesis(
  direction: OpenPaperTradeToolArgs["direction"],
  packet: MarketContextPacket
): string {
  const models = packet.models
  const parts: string[] = []
  const mark = packet.live.price

  if (direction === "SHORT" && models?.short.signal) {
    parts.push(
      `Short model p=${models.short.p.toFixed(2)} with edge ${models.short.edge.toFixed(3)}`
    )
  } else if (direction === "LONG" && models?.long.signal) {
    parts.push(
      `Long model p=${models.long.p.toFixed(2)} with edge ${models.long.edge.toFixed(3)}`
    )
  }

  if (packet.insight?.bias) {
    parts.push(`IRIS bias ${packet.insight.bias}`)
  }
  if (packet.insight?.expectedMovePct) {
    parts.push(`expected move ~${packet.insight.expectedMovePct.toFixed(2)}%`)
  }

  parts.push(
    `Live ${packet.symbol} ${mark.toFixed(1)}; 15m range ${(asFraction(packet.volatility.rangePct) * 100).toFixed(2)}%`
  )

  return parts.join(". ") + "."
}

function setupName(direction: OpenPaperTradeToolArgs["direction"]): string {
  return direction === "SHORT" ? "Model short edge fade" : "Model long continuation"
}

/**
 * Deterministic desk fallback when the chat API does not return open_paper_trade.
 * Uses the same MARKET_CONTEXT evidence the model was given.
 */
export function synthesizePaperDecisionFromContext(
  packet: MarketContextPacket
): ParsedPaperDecision | null {
  const mark = packet.live.price
  if (!(mark > 0) || !Number.isFinite(mark)) return null

  const symbol = packet.symbol.trim().toUpperCase()
  if (symbol !== "ETH" && symbol !== "BTC") return null

  const direction = resolveDirection(packet)
  if (!direction) return null

  const atr = asFraction(packet.volatility.atrPct)
  const range = asFraction(packet.volatility.rangePct)
  const stopPct = clamp(
    Math.max(MIN_STOP_PCT, atr * 2, range * 0.25),
    MIN_STOP_PCT,
    MAX_STOP_PCT
  )

  const expectedMove = packet.insight?.expectedMovePct
    ? asFraction(packet.insight.expectedMovePct)
    : 0
  const rewardRisk = packet.insight?.rewardRisk ?? 2
  const targetPct = clamp(
    expectedMove > 0 ? expectedMove : stopPct * rewardRisk,
    MIN_STOP_PCT * 1.5,
    MAX_STOP_PCT * 3
  )

  const stopLoss =
    direction === "LONG"
      ? roundPrice(mark * (1 - stopPct))
      : roundPrice(mark * (1 + stopPct))
  const takeProfit =
    direction === "LONG"
      ? roundPrice(mark * (1 + targetPct))
      : roundPrice(mark * (1 - targetPct))

  const leverage = pickLeverage(symbol, direction, packet)

  return {
    action: "OPEN_PAPER_TRADE",
    args: {
      symbol,
      direction,
      setup: setupName(direction),
      stopLoss,
      takeProfit,
      leverage,
      thesis: buildThesis(direction, packet),
    },
  }
}
