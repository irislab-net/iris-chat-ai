/** Public Hyperliquid L2 book — HTTP snapshot + WebSocket stream. */

import { hyperliquidCoin } from "@/lib/api/candles"

const HL_INFO = "https://api.hyperliquid.xyz/info"
const HL_WS = "wss://api.hyperliquid.xyz/ws"

export type BookLevel = {
  price: number
  size: number
}

export type OrderBookSnapshot = {
  bids: BookLevel[]
  asks: BookLevel[]
  time: number
}

function parseLevel(raw: unknown): BookLevel | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const price = Number(row.px)
  const size = Number(row.sz)
  if (!(price > 0) || !(size > 0)) return null
  return { price, size }
}

export function parseHyperliquidL2Book(raw: unknown): OrderBookSnapshot | null {
  if (!raw || typeof raw !== "object") return null
  const data = raw as { time?: unknown; levels?: unknown }
  if (!Array.isArray(data.levels) || data.levels.length < 2) return null
  const bidRaw = data.levels[0]
  const askRaw = data.levels[1]
  if (!Array.isArray(bidRaw) || !Array.isArray(askRaw)) return null
  const bids = bidRaw
    .map(parseLevel)
    .filter((level): level is BookLevel => level != null)
    .sort((a, b) => b.price - a.price)
  const asks = askRaw
    .map(parseLevel)
    .filter((level): level is BookLevel => level != null)
    .sort((a, b) => a.price - b.price)
  const time = Number(data.time)
  return {
    bids,
    asks,
    time: Number.isFinite(time) ? time : Date.now(),
  }
}

export async function fetchHyperliquidOrderBook(
  symbol: string,
  signal?: AbortSignal
): Promise<OrderBookSnapshot | null> {
  const coin = hyperliquidCoin(symbol)
  if (!coin) return null
  const res = await fetch(HL_INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "l2Book", coin }),
    signal,
    cache: "no-store",
  })
  if (!res.ok) return null
  return parseHyperliquidL2Book(await res.json())
}

export function subscribeHyperliquidOrderBook(input: {
  symbol: string
  onBook: (book: OrderBookSnapshot) => void
}): () => void {
  const coin = hyperliquidCoin(input.symbol)
  if (!coin || typeof window === "undefined") return () => {}

  let socket: WebSocket | null = null
  let pingId: number | null = null
  let reconnectId: number | null = null
  let closed = false
  let attempt = 0

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

  const connect = () => {
    if (closed) return
    const ws = new WebSocket(HL_WS)
    socket = ws

    ws.onopen = () => {
      if (closed) {
        ws.close()
        return
      }
      attempt = 0
      ws.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "l2Book", coin },
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
        if (msg.channel !== "l2Book") return
        const book = parseHyperliquidL2Book(msg.data)
        if (book) input.onBook(book)
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      clearTimers()
      socket = null
      if (closed) return
      attempt += 1
      const delay = Math.min(1000 * 2 ** Math.min(attempt, 4), 15_000)
      reconnectId = window.setTimeout(connect, delay)
    }
  }

  void fetchHyperliquidOrderBook(input.symbol)
    .then((book) => {
      if (!closed && book) input.onBook(book)
    })
    .catch(() => undefined)
    .finally(() => {
      if (!closed) connect()
    })

  return () => {
    closed = true
    clearTimers()
    if (socket) {
      socket.onclose = null
      socket.close()
      socket = null
    }
  }
}
