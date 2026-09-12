import { beforeEach, describe, expect, it, vi } from "vitest"

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

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
}))

import { getStoredAccessToken } from "@/lib/api/auth"
import { apiFetch } from "@/lib/api/client"
import { sendCoPilotChatWithSessionRetry } from "@/lib/api/co-pilot"

describe("sendCoPilotChatWithSessionRetry", () => {
  const fetchMock = vi.mocked(apiFetch)

  beforeEach(() => {
    fetchMock.mockReset()
    vi.mocked(getStoredAccessToken).mockReturnValue("access-token")
  })

  it("refreshes the session and retries after a 402 for signed-in users", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "insufficient credit balance" }), {
          status: 402,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              session_id: "s1",
              output_text: "Hello",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
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
    expect(result.message).toBe("Hello")
  })
})
