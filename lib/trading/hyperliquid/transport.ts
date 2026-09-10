import type { HyperliquidNetwork } from "@/lib/trading/hyperliquid/network"
import { hyperliquidEndpoints } from "@/lib/trading/hyperliquid/network"

export type HyperliquidRawSnapshot = {
  metaAndAssetContexts: unknown
  clearinghouseState: unknown
  openOrders: unknown
  fills: unknown
}

export type HyperliquidStreamStatus =
  | "CONNECTING"
  | "LIVE"
  | "DISCONNECTED"
  | "ERROR"

export type HyperliquidStreamHandlers = {
  onStatus: (status: HyperliquidStreamStatus) => void
  onClearinghouseState: (data: unknown) => void
  onOpenOrders: (data: unknown) => void
  onFills: (data: unknown) => void
}

export interface HyperliquidReadOnlyTransport {
  fetchSnapshot(
    address: string,
    signal?: AbortSignal
  ): Promise<HyperliquidRawSnapshot>
  subscribe(address: string, handlers: HyperliquidStreamHandlers): () => void
}

type InfoRequest =
  | { type: "metaAndAssetCtxs" }
  | { type: "clearinghouseState"; user: string }
  | { type: "frontendOpenOrders"; user: string }
  | { type: "userFills"; user: string; aggregateByTime: true }

async function postInfo(
  infoUrl: string,
  request: InfoRequest,
  signal?: AbortSignal
): Promise<unknown> {
  const response = await fetch(infoUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  })
  if (!response.ok) {
    throw new Error(`Hyperliquid info request failed (${response.status})`)
  }
  return response.json()
}

export class DirectHyperliquidReadOnlyTransport
  implements HyperliquidReadOnlyTransport
{
  private readonly infoUrl: string
  private readonly wsUrl: string

  constructor(network: HyperliquidNetwork = "mainnet") {
    const endpoints = hyperliquidEndpoints(network)
    this.infoUrl = endpoints.infoUrl
    this.wsUrl = endpoints.wsUrl
  }

  async fetchSnapshot(
    address: string,
    signal?: AbortSignal
  ): Promise<HyperliquidRawSnapshot> {
    const [metaAndAssetContexts, clearinghouseState, openOrders, fills] =
      await Promise.all([
        postInfo(this.infoUrl, { type: "metaAndAssetCtxs" }, signal),
        postInfo(this.infoUrl, { type: "clearinghouseState", user: address }, signal),
        postInfo(this.infoUrl, { type: "frontendOpenOrders", user: address }, signal),
        postInfo(
          this.infoUrl,
          { type: "userFills", user: address, aggregateByTime: true },
          signal
        ),
      ])
    return { metaAndAssetContexts, clearinghouseState, openOrders, fills }
  }

  subscribe(address: string, handlers: HyperliquidStreamHandlers): () => void {
    if (typeof WebSocket === "undefined") {
      handlers.onStatus("ERROR")
      return () => undefined
    }

    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null
    let stopped = false
    let attempts = 0

    const clearTimers = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      reconnectTimer = null
      heartbeatTimer = null
    }

    const connect = () => {
      if (stopped) return
      handlers.onStatus(attempts === 0 ? "CONNECTING" : "DISCONNECTED")
      socket = new WebSocket(this.wsUrl)

      socket.addEventListener("open", () => {
        attempts = 0
        handlers.onStatus("LIVE")
        for (const type of ["clearinghouseState", "openOrders", "userFills"] as const) {
          socket?.send(
            JSON.stringify({
              method: "subscribe",
              subscription: { type, user: address },
            })
          )
        }
        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ method: "ping" }))
          }
        }, 30_000)
      })

      socket.addEventListener("message", (event) => {
        let message: unknown
        try {
          message = JSON.parse(String(event.data))
        } catch {
          return
        }
        if (!message || typeof message !== "object") return
        const envelope = message as { channel?: unknown; data?: unknown }
        if (envelope.channel === "clearinghouseState") {
          handlers.onClearinghouseState(envelope.data)
        } else if (envelope.channel === "openOrders") {
          handlers.onOpenOrders(envelope.data)
        } else if (envelope.channel === "userFills") {
          handlers.onFills(envelope.data)
        }
      })

      socket.addEventListener("close", () => {
        if (stopped) return
        clearTimers()
        handlers.onStatus("DISCONNECTED")
        attempts += 1
        if (attempts > 5) {
          handlers.onStatus("ERROR")
          return
        }
        reconnectTimer = setTimeout(connect, Math.min(1_000 * 2 ** (attempts - 1), 10_000))
      })

      socket.addEventListener("error", () => {
        if (!stopped) handlers.onStatus("DISCONNECTED")
      })
    }

    connect()
    return () => {
      stopped = true
      clearTimers()
      socket?.close()
      socket = null
    }
  }
}
