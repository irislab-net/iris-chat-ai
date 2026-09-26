import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  EXUR_SHARED_COOKIE_DOMAIN,
  getSharedCookieDomain,
  readBrowserCookie,
  readSharedJson,
  writeBrowserCookie,
  writeSharedJson,
} from "@/lib/exur-client-storage"

describe("exur client storage", () => {
  let store: Record<string, string>
  let cookieJar: string

  beforeEach(() => {
    store = {}
    cookieJar = ""
    vi.stubGlobal("window", {
      location: { hostname: "chat.exur.ai", protocol: "https:" },
    })
    vi.stubGlobal("document", {
      get cookie() {
        return cookieJar
      },
      set cookie(value: string) {
        const [pair] = value.split(";")
        const eq = pair.indexOf("=")
        const name = pair.slice(0, eq)
        const rawValue = pair.slice(eq + 1)
        if (value.includes("Max-Age=0")) {
          cookieJar = cookieJar
            .split("; ")
            .filter((part) => part && !part.startsWith(`${name}=`))
            .join("; ")
          return
        }
        const next = `${name}=${rawValue}`
        const others = cookieJar
          .split("; ")
          .filter((part) => part && !part.startsWith(`${name}=`))
        cookieJar = [...others, next].filter(Boolean).join("; ")
      },
    })
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("uses .exur.ai for production and local product hosts", () => {
    expect(getSharedCookieDomain("exur.ai")).toBe(EXUR_SHARED_COOKIE_DOMAIN)
    expect(getSharedCookieDomain("chat.exur.ai")).toBe(EXUR_SHARED_COOKIE_DOMAIN)
    expect(getSharedCookieDomain("local.exur.ai")).toBe(EXUR_SHARED_COOKIE_DOMAIN)
    expect(getSharedCookieDomain("localhost")).toBeNull()
    expect(getSharedCookieDomain("exur.vercel.app")).toBeNull()
  })

  it("writes a parent-domain cookie and mirrors into localStorage", () => {
    writeSharedJson("exur-cookie-consent", '{"analytics":true}')
    expect(store["exur-cookie-consent"]).toBe('{"analytics":true}')
    expect(readBrowserCookie("exur-cookie-consent")).toBe('{"analytics":true}')
    expect(cookieJar).toContain("exur-cookie-consent=")
  })

  it("hydrates localStorage from cookie when storage is empty", () => {
    writeBrowserCookie("exur-cookie-consent", '{"analytics":false}')
    expect(store["exur-cookie-consent"]).toBeUndefined()
    expect(readSharedJson("exur-cookie-consent")).toBe('{"analytics":false}')
    expect(store["exur-cookie-consent"]).toBe('{"analytics":false}')
  })
})
