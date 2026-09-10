/** Free public Hyperliquid candles — HTTP snapshot + WebSocket stream. */

export type CandleBar = {
  t: number
  o: number
  h: number
  l: number
  c: number
}

const HL_INFO = "https://api.hyperliquid.xyz/info"
const HL_WS = "wss://api.hyperliquid.xyz/ws"

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

/** Map desk symbol → Hyperliquid coin (perp). Unsupported → null. */
export function hyperliquidCoin(symbol: string): string | null {
  const key = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (key === "ETH" || key === "ETHUSD" || key === "ETHUSDT") return "ETH"
  if (key === "BTC" || key === "BTCUSD" || key === "BTCUSDT") return "BTC"
  if (key === "SOL" || key === "SOLUSD" || key === "SOLUSDT") return "SOL"
  // Desk gold (XAU) tracks Hyperliquid PAXG perp liquidity.
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

export function mergeCandleUpdate(
  candles: CandleBar[],
  update: CandleBar,
  limit = 56
): CandleBar[] {
  if (candles.length === 0) return [update]
  const last = candles[candles.length - 1]
  if (update.t === last.t) {
    return [...candles.slice(0, -1), update]
  }
  if (update.t > last.t) {
    const next = [...candles, update]
    return next.length > limit ? next.slice(next.length - limit) : next
  }
  // Out-of-order / older bar — ignore for live backdrop.
  return candles
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

/**
 * Fetch historical candles covering [sinceMs, endTime] via the same Hyperliquid
 * candleSnapshot source, paginating when the window exceeds one response.
 */
export async function fetchHyperliquidCandlesSince(input: {
  symbol: string
  timeframe: string
  sinceMs: number
  endTime?: number
  signal?: AbortSignal
}): Promise<CandleBar[]> {
  const interval = hyperliquidInterval(input.timeframe)
  const step = hyperliquidIntervalMs(interval)
  const endTime = input.endTime ?? Date.now()
  const sinceMs = Math.max(0, input.sinceMs)
  if (!(endTime > sinceMs)) return []

  const maxPages = 24
  const pageSpan = step * 500
  const byT = new Map<number, CandleBar>()
  let cursor = sinceMs

  for (let page = 0; page < maxPages && cursor < endTime; page++) {
    const pageEnd = Math.min(endTime, cursor + pageSpan)
    const chunk = await fetchHyperliquidCandles({
      symbol: input.symbol,
      timeframe: interval,
      startTime: cursor,
      endTime: pageEnd,
      signal: input.signal,
    })
    for (const bar of chunk) {
      if (bar.t + step <= sinceMs) continue
      byT.set(bar.t, bar)
    }
    if (chunk.length === 0) {
      cursor = pageEnd
      continue
    }
    const last = chunk[chunk.length - 1]!
    const next = last.t + step
    cursor = next > cursor ? next : pageEnd
  }

  return [...byT.values()].sort((a, b) => a.t - b.t)
}

/**
 * Live candle stream via Hyperliquid WebSocket (free, no key).
 * Seeds with HTTP snapshot, then applies streaming candle updates.
 */
export function subscribeHyperliquidCandles(input: {
  symbol: string
  timeframe: string
  limit?: number
  onCandles: (candles: CandleBar[]) => void
  onStatus?: (status: "connecting" | "live" | "reconnecting" | "idle") => void
}): () => void {
  const coin = hyperliquidCoin(input.symbol)
  if (!coin || typeof window === "undefined") {
    input.onStatus?.("idle")
    return () => {}
  }

  const interval = hyperliquidInterval(input.timeframe)
  const limit = Math.min(Math.max(input.limit ?? 56, 8), 500)
  let candles: CandleBar[] = []
  let socket: WebSocket | null = null
  let pingId: number | null = null
  let reconnectId: number | null = null
  let closed = false
  let attempt = 0

  const emit = () => input.onCandles(candles)

  const clearTimers = () => {
    if (pingId != null) {
      window.clearInterval(pingId)
      pingId = null
    }
    if (reconnectId != null) {
      window.clearTimeout(reconnectId)
      reconnectId = null
    }
  }

  const applyUpdate = (raw: unknown) => {
    const items = Array.isArray(raw) ? raw : [raw]
    let changed = false
    for (const item of items) {
      const bar = parseCandle(item)
      if (!bar) continue
      const next = mergeCandleUpdate(candles, bar, limit)
      if (next !== candles) {
        candles = next
        changed = true
      }
    }
    if (changed) emit()
  }

  const connect = () => {
    if (closed) return
    input.onStatus?.(attempt > 0 ? "reconnecting" : "connecting")
    const ws = new WebSocket(HL_WS)
    socket = ws

    ws.onopen = () => {
      if (closed) {
        ws.close()
        return
      }
      attempt = 0
      input.onStatus?.("live")
      ws.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "candle", coin, interval },
        })
      )
      pingId = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ method: "ping" }))
        }
      }, 20_000)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data)) as {
          channel?: string
          data?: unknown
        }
        if (msg.channel === "candle") {
          applyUpdate(msg.data)
        }
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => {
      // onclose handles reconnect
    }

    ws.onclose = () => {
      clearTimers()
      socket = null
      if (closed) return
      attempt += 1
      input.onStatus?.("reconnecting")
      const delay = Math.min(1000 * 2 ** Math.min(attempt, 4), 15_000)
      reconnectId = window.setTimeout(connect, delay)
    }
  }

  void (async () => {
    try {
      candles = await fetchHyperliquidCandles({
        symbol: input.symbol,
        timeframe: input.timeframe,
        limit,
      })
      if (!closed) emit()
    } catch {
      candles = []
    }
    if (!closed) connect()
  })()

  return () => {
    closed = true
    clearTimers()
    if (socket) {
      socket.onclose = null
      socket.close()
      socket = null
    }
    input.onStatus?.("idle")
  }
}
