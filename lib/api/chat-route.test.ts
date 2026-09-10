import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { handleChatApiRoute } from "@/lib/api/chat-route"

describe("chat API route", () => {
  beforeEach(() => {
    vi.stubEnv("CHAT_API_ORIGIN", "https://primary.example")
    vi.stubEnv("CHAT_API_GUEST_FALLBACK_ORIGIN", "https://fallback.example")
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("returns upstream_unreachable when chat origin is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")))

    const res = await handleChatApiRoute(
      new Request("https://local.test/v1/chat/guest/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
      "/v1/chat/guest/session"
    )
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.code).toBe("upstream_unreachable")
  })

  it("retries guest session on fallback when primary returns guest_unavailable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "guest_unavailable",
            error: "guest sessions are not configured",
            success: "false",
          }),
          { status: 503, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            guest_token: "guest-token",
            user_id: "anon-1",
            trial: {
              is_guest: true,
              messages_limit: 3,
              messages_used: 0,
              messages_remaining: 3,
              weekly_reset_at: "2026-09-15T00:00:00Z",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    vi.stubGlobal("fetch", fetchMock)

    const res = await handleChatApiRoute(
      new Request("https://local.test/v1/chat/guest/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
      "/v1/chat/guest/session"
    )

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://primary.example/v1/chat/guest/session"
    )
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://fallback.example/v1/chat/guest/session"
    )
  })
})
