import {
  fetchHyperliquidCandles,
  hyperliquidIntervalMs,
} from "@/lib/api/candles"
import { fetchInsightHome, fetchNewsHome } from "@/lib/api/data"
import { assembleMarketContext } from "@/lib/iris-paper-trade/market-context"
import type { MarketContextPacket } from "@/lib/iris-paper-trade/types"
import type { TradeSymbol } from "@/lib/iris-paper-trade/extract-symbol"

const LIVE_STALE_BARS = 3

export async function buildMarketContextPacket(input?: {
  now?: number
  signal?: AbortSignal
  symbol?: TradeSymbol
}): Promise<
  { ok: true; packet: MarketContextPacket } | { ok: false; error: string }
> {
  const now = input?.now ?? Date.now()
  const signal = input?.signal

  let insight = null
  let news = null
  try {
    ;[insight, news] = await Promise.all([
      fetchInsightHome().catch(() => null),
      fetchNewsHome().catch(() => null),
    ])
  } catch {
    insight = null
    news = null
  }

  const symbol =
    input?.symbol?.trim().toUpperCase() ||
    insight?.summary.symbol?.trim().toUpperCase() ||
    "ETH"
  const timeframe = insight?.summary.timeframe?.trim() || "15m"

  let candles = []
  try {
    candles = await fetchHyperliquidCandles({
      symbol,
      timeframe,
      limit: 48,
      signal,
    })
  } catch {
    return { ok: false, error: "MISSING_LIVE_PRICE" }
  }

  const assembled = assembleMarketContext({
    now,
    candles,
    insight,
    news,
    symbol,
  })
  if (!assembled.ok) return assembled

  const interval = hyperliquidIntervalMs(timeframe)
  const age = now - assembled.packet.live.barTime
  if (
    !(assembled.packet.live.barTime > 0) ||
    age > interval * LIVE_STALE_BARS
  ) {
    return { ok: false, error: "STALE_CONTEXT" }
  }

  return assembled
}
