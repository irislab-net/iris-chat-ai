import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  getChatStorageKey,
  writeChatStore,
  type ChatStore,
} from "@/lib/chat-storage"
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
          if (!listeners.has(type)) listeners.set(type, new Set())
          listeners.get(type)!.add(listener)
        },
        removeEventListener(type: string, listener: EventListener) {
          listeners.get(type)?.delete(listener)
        },
        dispatchEvent(event: Event) {
          const set = listeners.get(event.type)
          if (!set) return true
          for (const listener of set) listener(event)
          return true
        },
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("clears chat store and dispatches session reset", () => {
    const store: ChatStore = {
      version: 1,
      activeId: "c1",
      deletedIds: [],
      conversations: [
        {
          id: "c1",
          title: "Hello",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          history: [],
        },
      ],
    }
    writeChatStore(null, store)

    const onReset = vi.fn()
    window.addEventListener(SESSION_RESET_EVENT, onReset)

    resetClientSessionOnLogout()

    expect(localStorage.getItem(getChatStorageKey(null))).toBeNull()
    expect(onReset).toHaveBeenCalled()
  })
})
