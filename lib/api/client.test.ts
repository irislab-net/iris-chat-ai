import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AUTH_SESSION_EXPIRED_EVENT, storeTokenPair } from "@/lib/api/auth"
import { apiFetch } from "@/lib/api/client"

function memoryStorage() {
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
  }
}

function jsonResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }
}

describe("apiFetch auth recovery", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    const storage = memoryStorage()
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: storage,
    })
    const listeners = new Map<string, Set<EventListener>>()
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        dispatchEvent(event: Event) {
          for (const listener of listeners.get(event.type) ?? []) {
            listener(event)
          }
          return true
        },
        addEventListener(type: string, listener: EventListener) {
          const set = listeners.get(type) ?? new Set()
          set.add(listener)
          listeners.set(type, set)
        },
        removeEventListener(type: string, listener: EventListener) {
          listeners.get(type)?.delete(listener)
        },
      },
    })
    storeTokenPair({
      access_token: "stale-token",
      expires_at: "2099-01-01T00:00:00.000Z",
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(globalThis, "sessionStorage")
    Reflect.deleteProperty(globalThis, "window")
  })

  it("retries once with a refreshed access token after 401", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: "fresh-token",
          expires_at: "2099-01-01T00:00:00.000Z",
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const res = await apiFetch("/v1/chat/message", { method: "POST" })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(sessionStorage.getItem("access_token")).toBe("fresh-token")
  })

  it("clears tokens and notifies when refresh fails after 401", async () => {
    const expired = vi.fn()
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expired)

    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(401, { error: "refresh failed" }))

    const res = await apiFetch("/v1/chat/message", { method: "POST" })

    expect(res.status).toBe(401)
    expect(sessionStorage.getItem("access_token")).toBeNull()
    expect(expired).toHaveBeenCalledTimes(1)
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, expired)
  })
})
