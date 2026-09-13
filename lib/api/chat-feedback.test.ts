import { describe, expect, it, vi, afterEach } from "vitest"

import { submitChatMessageFeedback } from "@/lib/api/chat-feedback"
import { serverMessageId } from "@/lib/chat-message-id"

describe("submitChatMessageFeedback", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("skips the API when the message id is not server-backed", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const ok = await submitChatMessageFeedback({
      sessionId: "sess-1",
      messageId: "local-uuid",
      vote: "up",
    })

    expect(ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("posts feedback for server-backed message ids", async () => {
    vi.stubEnv("NEXT_PUBLIC_CHAT_API_ORIGIN", "https://chat.example")

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    })
    vi.stubGlobal("fetch", fetchMock)

    const ok = await submitChatMessageFeedback({
      sessionId: "sess-1",
      messageId: serverMessageId(42),
      vote: "down",
    })

    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://chat.example/v1/chat/feedback",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          session_id: "sess-1",
          message_id: 42,
          vote: "down",
        }),
      })
    )
  })
})
