import { afterEach, describe, expect, it, vi } from "vitest"

import { exchangeGoogleOneTapCredential } from "@/lib/api/auth"

describe("exchangeGoogleOneTapCredential", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    Reflect.deleteProperty(globalThis, "sessionStorage")
  })

  it("posts the GIS credential to the one-tap auth endpoint", async () => {
    const storage = new Map<string, string>()
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value)
        },
        removeItem: (key: string) => {
          storage.delete(key)
        },
        clear: () => storage.clear(),
      },
      configurable: true,
    })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "access-123",
        expires_at: "2099-01-01T00:00:00.000Z",
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const pair = await exchangeGoogleOneTapCredential({
      credential: "jwt-credential",
      legalAccepted: true,
      app: "chat",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/v1/auth/google/one-tap",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          credential: "jwt-credential",
          terms: "accepted",
          privacy_notice: "accepted",
          app: "chat",
        }),
      })
    )
    expect(pair.access_token).toBe("access-123")
    expect(sessionStorage.getItem("access_token")).toBe("access-123")
  })
})
