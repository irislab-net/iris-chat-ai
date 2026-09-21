import { afterEach, describe, expect, it, vi } from "vitest"

import { ABOUT_NARRATION_CDN } from "@/lib/about-narration"

describe("GET /media/about-narration", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("proxies the CDN body with audio headers", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer
    const fetchMock = vi.fn(async () => {
      return new Response(bytes, {
        status: 200,
        headers: {
          "content-type": "audio/mpeg",
          "content-length": "4",
          "accept-ranges": "bytes",
        },
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const { GET } = await import("@/app/media/about-narration/route")
    const res = await GET(new Request("https://exur.ai/media/about-narration"))

    expect(fetchMock).toHaveBeenCalledWith(
      ABOUT_NARRATION_CDN,
      expect.objectContaining({ cache: "no-store" })
    )
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("audio/mpeg")
    expect(res.headers.get("access-control-allow-origin")).toBe("*")
    expect(res.headers.get("cache-control")).toMatch(/max-age=86400/)
    expect(await res.arrayBuffer()).toEqual(bytes)
  })

  it("forwards Range requests as 206", async () => {
    const bytes = new Uint8Array([9, 9]).buffer
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        expect(new Headers(init?.headers).get("Range")).toBe("bytes=0-1")
        return new Response(bytes, {
          status: 206,
          headers: {
            "content-type": "audio/mpeg",
            "content-range": "bytes 0-1/991444",
            "accept-ranges": "bytes",
          },
        })
      })
    )

    const { GET } = await import("@/app/media/about-narration/route")
    const res = await GET(
      new Request("https://exur.ai/media/about-narration", {
        headers: { Range: "bytes=0-1" },
      })
    )

    expect(res.status).toBe(206)
    expect(res.headers.get("content-range")).toBe("bytes 0-1/991444")
  })

  it("returns 502 when the CDN fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network")
      })
    )

    const { GET } = await import("@/app/media/about-narration/route")
    const res = await GET(new Request("https://exur.ai/media/about-narration"))
    expect(res.status).toBe(502)
  })
})
