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
import {
  sendCoPilotChatWithSessionRetry,
  streamCoPilotChatWithSessionRetry,
} from "@/lib/api/co-pilot"

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function sseResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  })
}

describe("sendCoPilotChatWithSessionRetry", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
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
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/v1/chat/message")
    expect(result.message).toBe("Hello")
  })

  it("does not retry login_required", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(403, {
        error: "Guest trial exhausted for this week. Sign in to continue.",
        success: "false",
        code: "login_required",
      })
    )
    const refreshAfterUpgrade = vi.fn(async () => undefined)
    await expect(
      sendCoPilotChatWithSessionRetry(
        { message: "Hi", conversationId: "s1", history: [] },
        { refreshAfterUpgrade }
      )
    ).rejects.toMatchObject({ code: "login_required", status: 403 })
    expect(refreshAfterUpgrade).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe("streamCoPilotChatWithSessionRetry SSE errors", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockReset()
    vi.mocked(getStoredAccessToken).mockReturnValue("access-token")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("maps event:error credit codes to status 402", async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse(
        'event: error\ndata: {"message":"daily usage limit reached","code":"daily_limit_reached"}\n\n'
      )
    )

    await expect(
      streamCoPilotChatWithSessionRetry({
        message: "Hi",
        conversationId: "s1",
        history: [],
      })
    ).rejects.toMatchObject({
      message: "daily usage limit reached",
      code: "daily_limit_reached",
      status: 402,
    })
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/v1/chat/message/stream")
  })

  it("maps event:error login_required to status 403", async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse(
        'event: error\ndata: {"message":"Guest trial exhausted for this week. Sign in to continue.","code":"login_required"}\n\n'
      )
    )

    await expect(
      streamCoPilotChatWithSessionRetry({
        message: "Hi",
        conversationId: "s1",
        history: [],
      })
    ).rejects.toMatchObject({
      code: "login_required",
      status: 403,
    })
  })

  it("keeps agent execution failed as a generic failure without credit status", async () => {
    fetchMock.mockResolvedValueOnce(
      sseResponse(
        'event: error\ndata: {"message":"agent execution failed","code":""}\n\n'
      )
    )

    try {
      await streamCoPilotChatWithSessionRetry({
        message: "Hi",
        conversationId: "s1",
        history: [],
      })
      expect.unreachable("expected stream error")
    } catch (error) {
      expect((error as Error).message).toBe("agent execution failed")
      expect((error as { status?: number }).status).toBeUndefined()
      expect((error as { code?: string }).code).toBeUndefined()
    }
  })
})
