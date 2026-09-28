import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  AUTH_PWA_PENDING_KEY,
  claimAuthSuccessProcessed,
  clearAuthPwaPending,
  consumeAuthReturnTo,
  hasAuthPwaPending,
  markAuthPwaPending,
  persistAuthReturnTo,
} from "@/lib/auth-pwa"
import { isStandaloneDisplay } from "@/lib/display-mode"

function createMemoryStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

describe("display-mode + auth-pwa", () => {
  const local = createMemoryStorage()
  const session = createMemoryStorage()
  const classList = new Set<string>()

  beforeEach(() => {
    local.clear()
    session.clear()
    classList.clear()
    vi.stubGlobal("localStorage", local)
    vi.stubGlobal("sessionStorage", session)
    vi.stubGlobal("document", {
      documentElement: {
        classList: {
          contains: (name: string) => classList.has(name),
          add: (name: string) => {
            classList.add(name)
          },
          remove: (name: string) => {
            classList.delete(name)
          },
        },
      },
    })
    vi.stubGlobal("window", {
      document: {
        documentElement: {
          classList: {
            contains: (name: string) => classList.has(name),
          },
        },
      },
      matchMedia: () => ({ matches: false }),
      navigator: {},
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("detects display-standalone class", () => {
    classList.add("display-standalone")
    expect(isStandaloneDisplay()).toBe(true)
  })

  it("marks pending only in standalone", () => {
    markAuthPwaPending()
    expect(local.getItem(AUTH_PWA_PENDING_KEY)).toBeNull()

    classList.add("display-standalone")
    markAuthPwaPending()
    expect(hasAuthPwaPending()).toBe(true)
    clearAuthPwaPending()
    expect(hasAuthPwaPending()).toBe(false)
  })

  it("persists returnTo across session and local storage", () => {
    persistAuthReturnTo("/app/news")
    expect(consumeAuthReturnTo("/fallback")).toBe("/app/news")
    expect(consumeAuthReturnTo("/fallback")).toBe("/fallback")
  })

  it("dedupes auth success processing", () => {
    expect(claimAuthSuccessProcessed("abc")).toBe(false)
    expect(claimAuthSuccessProcessed("abc")).toBe(true)
  })

  it("marks auth success only after explicit write", async () => {
    const { wasAuthSuccessProcessed, markAuthSuccessProcessed } = await import(
      "@/lib/auth-pwa"
    )
    expect(wasAuthSuccessProcessed("xyz")).toBe(false)
    markAuthSuccessProcessed("xyz")
    expect(wasAuthSuccessProcessed("xyz")).toBe(true)
  })
})
