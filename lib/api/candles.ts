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
  const key = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
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

export async function fetchHyperliquidCandles(input: {
  symbol: string
  timeframe: string
  /** How many bars to request (capped). Ignored when startTime is set. */
  limit?: number
  /** Inclusive range start (epoch ms). */
  startTime?: number
  /** Inclusive range end (epoch ms). Defaults to now. */
  endTime?: number
  signal?: AbortSignal
}): Promise<CandleBar[]> {
  const coin = hyperliquidCoin(input.symbol)
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
