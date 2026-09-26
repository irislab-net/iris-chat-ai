import type { CandleBar } from "@/lib/api/candles"
import type { Classifier, InsightHome, NewsHome } from "@/lib/api/types"
import { formatEpochForChat } from "@/lib/format"
import type {
  MarketContextPacket,
  ModelClassifierSnapshot,
} from "@/lib/iris-paper-trade/types"

const NEWS_ITEM_LIMIT = 5
const RECENT_CLOSES = 8
const TREND_BARS = 24
const ATR_BARS = 14

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000
}

function snapshotClassifier(
  c: Classifier | undefined
): ModelClassifierSnapshot | null {
  if (!c || !Number.isFinite(c.p) || !Number.isFinite(c.edge)) return null
  return {
    p: round6(c.p),
    edge: round6(c.edge),
    signal: Boolean(c.signal),
  }
}

function averageTrueRangePct(bars: CandleBar[]): number {
  if (bars.length < 2) return 0
  const window = bars.slice(-Math.min(ATR_BARS + 1, bars.length))
  let sum = 0
  let n = 0
  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1]!
    const bar = window[i]!
    const tr = Math.max(
      bar.h - bar.l,
      Math.abs(bar.h - prev.c),
      Math.abs(bar.l - prev.c)
    )
    sum += tr
    n += 1
  }
  const last = window[window.length - 1]!.c
  if (!(last > 0) || n === 0) return 0
  return round6(sum / n / last)
}

function rangePct(bars: CandleBar[]): number {
  if (bars.length === 0) return 0
  let hi = -Infinity
  let lo = Infinity
  for (const bar of bars) {
    if (bar.h > hi) hi = bar.h
    if (bar.l < lo) lo = bar.l
  }
  const last = bars[bars.length - 1]!.c
  if (!(last > 0) || !Number.isFinite(hi) || !Number.isFinite(lo)) return 0
  return round6((hi - lo) / last)
}

/**
 * Compact timestamped evidence packet. Not a raw dump of news/candles.
 */
export function assembleMarketContext(input: {
  now: number
  candles: CandleBar[]
  insight: InsightHome | null
  news: NewsHome | null
  symbol?: string
}): { ok: true; packet: MarketContextPacket } | { ok: false; error: string } {
  const bars = input.candles.filter(
    (b) =>
      Number.isFinite(b.t) &&
      Number.isFinite(b.o) &&
      Number.isFinite(b.h) &&
      Number.isFinite(b.l) &&
      Number.isFinite(b.c)
  )
  const last = bars[bars.length - 1]
  if (!last || !(last.c > 0)) {
    return { ok: false, error: "MISSING_LIVE_PRICE" }
  }

  const insight = input.insight?.summary ?? null
  const symbol = (input.symbol || insight?.symbol || "ETH").trim().toUpperCase()
  const timeframe = insight?.timeframe?.trim() || "15m"

  const trendWindow = bars.slice(-TREND_BARS)
  const first = trendWindow[0]!
  const closeLast = last.c
  const closeFirst = first.c
  const changePct =
    closeFirst > 0 ? round6(((closeLast - closeFirst) / closeFirst) * 100) : 0

  const recentCloses = trendWindow.slice(-RECENT_CLOSES).map((b) => round4(b.c))

  const prediction = input.insight?.predictions?.[0]
  const long = snapshotClassifier(prediction?.classifiers.long)
  const short = snapshotClassifier(prediction?.classifiers.short)
  const breakout = snapshotClassifier(prediction?.classifiers.breakout)
  const fast = snapshotClassifier(prediction?.classifiers.fast)
  const models =
    long && short && breakout && fast ? { long, short, breakout, fast } : null

  const items = [...(input.news?.news ?? [])]
    .filter((n) => n.title?.trim())
    .sort(
      (a, b) => (b.metrics?.impact_score ?? 0) - (a.metrics?.impact_score ?? 0)
    )
    .slice(0, NEWS_ITEM_LIMIT)
    .map((n) => ({
      title: n.title.trim().slice(0, 160),
      impact: round4(n.metrics?.impact_score ?? 0),
      sentiment: round4(n.metrics?.overall_sentiment ?? 0),
      publishedAt: n.published_at,
    }))

  const ethSummary =
    input.news?.analytics?.[0]?.ai_summaries?.eth?.trim().slice(0, 400) || null

  const packet: MarketContextPacket = {
    asOf: input.now,
    asOfIso: new Date(input.now).toISOString(),
    symbol,
    timeframe,
    live: {
      price: round4(last.c),
      barTime: last.t,
      source: "hyperliquid",
    },
    trend: {
      bars: trendWindow.length,
      closeFirst: round4(closeFirst),
      closeLast: round4(closeLast),
      changePct,
      recentCloses,
    },
    volatility: {
      rangePct: rangePct(trendWindow),
      atrPct: averageTrueRangePct(trendWindow),
    },
    insight: insight
      ? {
          stance: insight.stance,
          bias: insight.bias,
          headline: insight.headline.trim().slice(0, 200),
          calmness: insight.calmness_label,
          rewardRisk: insight.reward_risk_ratio,
          expectedMovePct: insight.expected_move_pct,
          generatedAt: insight.generated_at,
        }
      : null,
    models,
    news: {
      ethSummary,
      items,
    },
  }

  return { ok: true, packet }
}

/** LLM-facing copy with human-readable timestamps instead of raw epoch numbers. */
export function serializeMarketContextForLlm(
  packet: MarketContextPacket,
  now = Date.now()
): Record<string, unknown> {
  return {
    asOf: packet.asOfIso,
    symbol: packet.symbol,
    timeframe: packet.timeframe,
    live: {
      price: packet.live.price,
      source: packet.live.source,
      barTime:
        formatEpochForChat(packet.live.barTime, now) ??
        new Date(packet.live.barTime).toISOString(),
    },
    trend: packet.trend,
    volatility: packet.volatility,
    insight: packet.insight
      ? {
          stance: packet.insight.stance,
          bias: packet.insight.bias,
          headline: packet.insight.headline,
          calmness: packet.insight.calmness,
          rewardRisk: packet.insight.rewardRisk,
          expectedMovePct: packet.insight.expectedMovePct,
          generatedAt:
            formatEpochForChat(packet.insight.generatedAt, now) ??
            packet.insight.generatedAt,
        }
      : null,
    models: packet.models,
    news: {
      ethSummary: packet.news.ethSummary,
      items: packet.news.items.map((item) => ({
        title: item.title,
        impact: item.impact,
        sentiment: item.sentiment,
        publishedAt:
          formatEpochForChat(item.publishedAt, now) ?? item.publishedAt,
      })),
    },
  }
}
