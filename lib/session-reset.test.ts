import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getChatStorageKey, writeChatStore, type ChatStore } from "@/lib/chat-storage"
import { PAPER_STORAGE_KEY } from "@/lib/paper-trading/engine"
import { getPaperSnapshot, paperOpenTrade, resetPaperStore } from "@/lib/paper-trading/store"
import {
  resetClientSessionOnLogout,
  SESSION_RESET_EVENT,
} from "@/lib/session-reset"

function memoryLocalStorage() {
  const map = new Map<string, string>()
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    setItem(key: string, value: string) {
      map.set(key, String(value))
    },
    removeItem(key: string) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
    key(i: number) {
      return [...map.keys()][i] ?? null
    },
    get length() {
      return map.size
    },
  }
}

describe("resetClientSessionOnLogout", () => {
  beforeEach(() => {
    const listeners = new Map<string, Set<EventListener>>()
    const storage = memoryLocalStorage()
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    })
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: memoryLocalStorage(),
    })
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: storage,
        sessionStorage: globalThis.sessionStorage,
        addEventListener(type: string, listener: EventListener) {
          const set = listeners.get(type) ?? new Set()
          set.add(listener)
          listeners.set(type, set)
        },
        removeEventListener(type: string, listener: EventListener) {
          listeners.get(type)?.delete(listener)
        },
        dispatchEvent(event: Event) {
          for (const listener of listeners.get(event.type) ?? []) {
            listener(event)
          }
          return true
        },
      },
    })
    sessionStorage.setItem("access_token", "stale")
    sessionStorage.setItem("expires_at", "2099-01-01T00:00:00.000Z")
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window")
    Reflect.deleteProperty(globalThis, "localStorage")
    Reflect.deleteProperty(globalThis, "sessionStorage")
    vi.restoreAllMocks()
  })

  it("clears guest chat, paper desk, and session tokens", () => {
    const guestStore: ChatStore = {
      version: 1,
      conversations: [
        {
          id: "c1",
          title: "Guest chat",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          messages: [{ id: "m1", role: "user", content: "hello" }],
          history: [{ role: "user", content: "hello" }],
        },
      ],
      activeId: "c1",
    }
    writeChatStore(null, guestStore)
    paperOpenTrade({
      symbol: "ETH",
      side: "LONG",
      quantity: 1,
      entryPrice: 3000,
      stopLoss: null,
      takeProfit: null,
      marginMode: "CROSS",
      leverage: 5,
      source: "USER",
    })
    expect(localStorage.getItem(PAPER_STORAGE_KEY)).toBeTruthy()

    resetClientSessionOnLogout({ userId: "user-1" })

    expect(sessionStorage.getItem("access_token")).toBeNull()
    expect(localStorage.getItem(getChatStorageKey(null))).toBeNull()
    expect(localStorage.getItem(PAPER_STORAGE_KEY)).toBeNull()
    expect(getPaperSnapshot().positions).toHaveLength(0)
  })

  it("dispatches a session reset event for live UI listeners", () => {
    const handler = vi.fn()
    window.addEventListener(SESSION_RESET_EVENT, handler)
    resetClientSessionOnLogout({ userId: "user-1" })
    expect(handler).toHaveBeenCalledTimes(1)
    window.removeEventListener(SESSION_RESET_EVENT, handler)
  })

  it("resetPaperStore clears in-memory paper state without a reload", () => {
    paperOpenTrade({
      symbol: "BTC",
      side: "LONG",
      quantity: 1,
      entryPrice: 90_000,
      stopLoss: null,
      takeProfit: null,
      marginMode: "CROSS",
      leverage: 5,
      source: "USER",
    })
    expect(getPaperSnapshot().positions).toHaveLength(1)

    resetPaperStore()

    expect(getPaperSnapshot().positions).toHaveLength(0)
    expect(localStorage.getItem(PAPER_STORAGE_KEY)).toBeNull()
  })
})
