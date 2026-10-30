/** Free public Hyperliquid candles — HTTP snapshot for signal market context. */

export type CandleBar = {
  t: number
  o: number
  h: number
  l: number
  c: number
}

const HL_INFO = "https://api.hyperliquid.xyz/info"

const HL_INTERVALS = new Set([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
])

/** Map symbol → Hyperliquid coin (perp). Unsupported → null. */
export function hyperliquidCoin(symbol: string): string | null {
  const key = symbol
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
  if (key === "ETH" || key === "ETHUSD" || key === "ETHUSDT") return "ETH"
  if (key === "BTC" || key === "BTCUSD" || key === "BTCUSDT") return "BTC"
  if (key === "SOL" || key === "SOLUSD" || key === "SOLUSDT") return "SOL"
  // Gold (XAU) tracks Hyperliquid PAXG perp liquidity.
  if (key === "XAU" || key === "XAUUSD" || key === "XAUUSDT") return "PAXG"
  return null
}

export function hyperliquidInterval(timeframe: string): string {
  const key = timeframe.trim().toLowerCase()
  if (HL_INTERVALS.has(key)) return key
  if (key === "15" || key === "15min") return "15m"
  if (key === "1h" || key === "60m") return "1h"
  return "15m"
}

export function hyperliquidIntervalMs(interval: string): number {
  const m = /^(\d+)([mhdwM])$/.exec(hyperliquidInterval(interval))
  if (!m) return 15 * 60 * 1000
  const n = Number(m[1])
  switch (m[2]) {
    case "m":
      return n * 60 * 1000
    case "h":
      return n * 60 * 60 * 1000
    case "d":
      return n * 24 * 60 * 60 * 1000
    case "w":
      return n * 7 * 24 * 60 * 60 * 1000
    case "M":
      return n * 30 * 24 * 60 * 60 * 1000
    default:
      return 15 * 60 * 1000
  }
}

function parseCandle(raw: unknown): CandleBar | null {
  if (!raw || typeof raw !== "object") return null
  const c = raw as Record<string, unknown>
  const bar: CandleBar = {
    t: Number(c.t),
    o: Number(c.o),
    h: Number(c.h),
    l: Number(c.l),
    c: Number(c.c),
  }
  if (
    !Number.isFinite(bar.t) ||
    !Number.isFinite(bar.o) ||
    !Number.isFinite(bar.h) ||
    !Number.isFinite(bar.l) ||
    !Number.isFinite(bar.c)
  ) {
    return null
  }
  return bar
}

export type DeskChartRange = "live" | "1d" | "1w" | "1m" | "1y"

/** Interval + lookback window for desk market detail chart chips. */
export function deskChartRangeSpec(range: DeskChartRange): {
  interval: string
  lookbackMs: number
  /** Soft poll while sheet is open (LIVE only). */
  pollMs?: number
} {
  const hour = 60 * 60 * 1000
  const day = 24 * hour
  switch (range) {
    case "live":
      return { interval: "1m", lookbackMs: 3 * hour, pollMs: 20_000 }
    case "1d":
      return { interval: "15m", lookbackMs: day }
    case "1w":
      return { interval: "1h", lookbackMs: 7 * day }
    case "1m":
      return { interval: "4h", lookbackMs: 30 * day }
    case "1y":
      return { interval: "1d", lookbackMs: 365 * day }
    default:
      return { interval: "15m", lookbackMs: day }
  }
}

/**
 * Resolve Hyperliquid coin for candles.
 * Prefer live `hlCoin`, then known symbol map, then raw ticker.
 */
export function resolveHyperliquidCoin(input: {
  instrument?: string
  hlCoin?: string | null
}): string | null {
  const fromHl = input.hlCoin?.trim().toUpperCase()
  if (fromHl) return fromHl
  const mapped = input.instrument ? hyperliquidCoin(input.instrument) : null
  if (mapped) return mapped
  const raw = input.instrument
    ?.trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
  return raw || null
}

export async function fetchHyperliquidCandles(input: {
  /** Desk / signal symbol (BTC, ETH, XAU…). Ignored when `coin` is set. */
  symbol?: string
  /** Hyperliquid universe name (BTC, PAXG, HYPE…). */
  coin?: string
  timeframe: string
  /** How many bars to request (capped). Ignored when startTime is set. */
  limit?: number
  /** Inclusive range start (epoch ms). */
  startTime?: number
  /** Inclusive range end (epoch ms). Defaults to now. */
  endTime?: number
  signal?: AbortSignal
}): Promise<CandleBar[]> {
  const coin =
    input.coin?.trim().toUpperCase() ||
    (input.symbol ? hyperliquidCoin(input.symbol) : null)
  if (!coin) return []

  const interval = hyperliquidInterval(input.timeframe)
  const endTime = input.endTime ?? Date.now()
  const limit = Math.min(Math.max(input.limit ?? 48, 8), 500)
  const startTime =
    input.startTime ?? endTime - hyperliquidIntervalMs(interval) * limit

  if (!(endTime > startTime)) return []

  const res = await fetch(HL_INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: { coin, interval, startTime, endTime },
    }),
    signal: input.signal,
    cache: "no-store",
  })

  if (!res.ok) return []

  const raw = (await res.json()) as unknown
  if (!Array.isArray(raw)) return []

  return raw
    .map(parseCandle)
    .filter((c): c is CandleBar => c != null)
    .sort((a, b) => a.t - b.t)
}

/** Latest mid prices keyed by Hyperliquid coin (BTC, ETH, PAXG, …). */
export async function fetchHyperliquidMids(
  signal?: AbortSignal
): Promise<Record<string, number>> {
  const res = await fetch(HL_INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
    signal,
    cache: "no-store",
  })

  if (!res.ok) return {}

  const raw = (await res.json()) as unknown
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}

  const out: Record<string, number> = {}
  for (const [coin, value] of Object.entries(raw as Record<string, unknown>)) {
    const price = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(price) || !(price > 0)) continue
    out[coin.toUpperCase()] = price
  }
  return out
}

export type HyperliquidAssetCtx = {
  coin: string
  midPx: number
  markPx: number
  prevDayPx: number
  dayNtlVlm: number
  /** Coin units (base). */
  openInterest: number
  /** Hourly funding rate (e.g. 0.0000125 = 0.00125%). */
  funding: number
  isDelisted: boolean
}

/** Perp universe + 24h context (mid, prev day, day notional, OI, funding). */
export async function fetchHyperliquidAssetCtxs(
  signal?: AbortSignal
): Promise<HyperliquidAssetCtx[]> {
  const res = await fetch(HL_INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    signal,
    cache: "no-store",
  })

  if (!res.ok) return []

  const raw = (await res.json()) as unknown
  if (!Array.isArray(raw) || raw.length < 2) return []

  const meta = raw[0] as {
    universe?: Array<{ name?: string; isDelisted?: boolean }>
  } | null
  const ctxs = raw[1]
  if (!meta?.universe || !Array.isArray(ctxs)) return []

  const out: HyperliquidAssetCtx[] = []
  for (let i = 0; i < meta.universe.length; i++) {
    const asset = meta.universe[i]
    const name = asset?.name?.trim().toUpperCase()
    const ctx = ctxs[i] as Record<string, unknown> | undefined
    if (!name || !ctx) continue
    const midPx = Number(ctx.midPx ?? ctx.markPx)
    const markPx = Number(ctx.markPx ?? ctx.midPx)
    const prevDayPx = Number(ctx.prevDayPx)
    const dayNtlVlm = Number(ctx.dayNtlVlm)
    const openInterest = Number(ctx.openInterest)
    const funding = Number(ctx.funding)
    if (!Number.isFinite(midPx) || !(midPx > 0)) continue
    out.push({
      coin: name,
      midPx,
      markPx: Number.isFinite(markPx) && markPx > 0 ? markPx : midPx,
      prevDayPx: Number.isFinite(prevDayPx) && prevDayPx > 0 ? prevDayPx : midPx,
      dayNtlVlm: Number.isFinite(dayNtlVlm) ? dayNtlVlm : 0,
      openInterest:
        Number.isFinite(openInterest) && openInterest >= 0 ? openInterest : 0,
      funding: Number.isFinite(funding) ? funding : 0,
      isDelisted: Boolean(asset?.isDelisted),
    })
  }
  return out
}
