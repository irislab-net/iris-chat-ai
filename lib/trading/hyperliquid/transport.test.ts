import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DirectHyperliquidReadOnlyTransport } from "@/lib/trading/hyperliquid/transport"

const ADDRESS = "0x3333333333333333333333333333333333333333"

describe("DirectHyperliquidReadOnlyTransport", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as { type: string }
        return {
          ok: true,
          json: async () => ({ type: body.type }),
        }
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("fetches only allow-listed info requests in parallel", async () => {
    const transport = new DirectHyperliquidReadOnlyTransport()
    const snapshot = await transport.fetchSnapshot(ADDRESS)

    expect(fetch).toHaveBeenCalledTimes(4)
    const bodies = vi
      .mocked(fetch)
      .mock.calls.map((call) => JSON.parse(String(call[1]?.body)) as { type: string; user?: string })
    expect(bodies.map((body) => body.type)).toEqual([
      "metaAndAssetCtxs",
      "clearinghouseState",
      "frontendOpenOrders",
      "userFills",
    ])
    expect(bodies.filter((body) => body.user === ADDRESS)).toHaveLength(3)
    expect(snapshot).toMatchObject({
      metaAndAssetContexts: { type: "metaAndAssetCtxs" },
      clearinghouseState: { type: "clearinghouseState" },
      openOrders: { type: "frontendOpenOrders" },
      fills: { type: "userFills" },
    })
  })

  it("propagates HTTP failures from info requests", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response)

    const transport = new DirectHyperliquidReadOnlyTransport()
    await expect(transport.fetchSnapshot(ADDRESS)).rejects.toThrow(
      "Hyperliquid info request failed (503)"
    )
  })

  it("reports ERROR when WebSocket is unavailable", () => {
    const original = globalThis.WebSocket
    // @ts-expect-error test override
    delete globalThis.WebSocket

    const transport = new DirectHyperliquidReadOnlyTransport()
    const onStatus = vi.fn()
    const stop = transport.subscribe(ADDRESS, {
      onStatus,
      onClearinghouseState: vi.fn(),
      onOpenOrders: vi.fn(),
      onFills: vi.fn(),
    })

    expect(onStatus).toHaveBeenCalledWith("ERROR")
    stop()
    globalThis.WebSocket = original
  })

  it("subscribes to user channels and schedules reconnect after disconnect", () => {
    type Listener = (event?: { data?: string }) => void
    const listeners: Record<string, Listener[]> = {
      open: [],
      message: [],
      close: [],
      error: [],
    }
    let latestSend: ReturnType<typeof vi.fn> | null = null

    class MockWebSocket {
      static OPEN = 1
      readyState = MockWebSocket.OPEN
      send: ReturnType<typeof vi.fn>
      close = vi.fn()

      constructor() {
        this.send = vi.fn()
        latestSend = this.send
      }

      addEventListener(type: string, listener: Listener) {
        listeners[type]?.push(listener)
      }
    }

    vi.stubGlobal("WebSocket", MockWebSocket)
    vi.useFakeTimers()

    const transport = new DirectHyperliquidReadOnlyTransport()
    const onStatus = vi.fn()
    const stop = transport.subscribe(ADDRESS, {
      onStatus,
      onClearinghouseState: vi.fn(),
      onOpenOrders: vi.fn(),
      onFills: vi.fn(),
    })

    expect(onStatus).toHaveBeenCalledWith("CONNECTING")
    listeners.open.forEach((listener) => listener({}))
    expect(onStatus).toHaveBeenCalledWith("LIVE")

    const sent = latestSend!.mock.calls.map(
      (call) => JSON.parse(String(call[0])) as { subscription?: { type?: string; user?: string } }
    )
    expect(sent.map((msg) => msg.subscription?.type)).toEqual([
      "clearinghouseState",
      "openOrders",
      "userFills",
    ])
    expect(sent.every((msg) => msg.subscription?.user === ADDRESS)).toBe(true)

    listeners.close.forEach((listener) => listener({}))
    expect(onStatus).toHaveBeenCalledWith("DISCONNECTED")
    vi.advanceTimersByTime(1_000)
    expect(onStatus).toHaveBeenCalledWith("CONNECTING")

    stop()
    vi.useRealTimers()
  })
})
