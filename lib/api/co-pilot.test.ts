import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/chat-auth-session", () => ({
  isGuestChatSession: vi.fn(() => false),
}))

vi.mock("@/lib/guest-chat", () => ({
  ensureGuestSession: vi.fn(),
  getStoredGuestToken: vi.fn(() => null),
}))

vi.mock("@/lib/api/auth", () => ({
  getStoredAccessToken: vi.fn(() => "access-token"),
}))

import { getStoredAccessToken } from "@/lib/api/auth"
import { sendCoPilotChatWithSessionRetry } from "@/lib/api/co-pilot"

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("sendCoPilotChatWithSessionRetry", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CHAT_API_ORIGIN", "https://chat.example")
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockReset()
    vi.mocked(getStoredAccessToken).mockReturnValue("access-token")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("refreshes the session and retries after a 402 for signed-in users", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(402, { error: "insufficient credit balance" })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            session_id: "s1",
            output_text: "Hello",
          },
        })
      )

    const refreshAfterUpgrade = vi.fn(async () => undefined)

    const result = await sendCoPilotChatWithSessionRetry(
      {
        message: "Hi",
        conversationId: "s1",
        history: [],
      },
      { refreshAfterUpgrade }
    )

    expect(refreshAfterUpgrade).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://chat.example/v1/chat/message"
    )
    expect(result.message).toBe("Hello")
  })
})
