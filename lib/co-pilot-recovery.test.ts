import { describe, expect, it } from "vitest"

import {
  COPILOT_AUTH_MESSAGE,
  COPILOT_CREDIT_MESSAGE,
  COPILOT_PRO_SESSION_REFRESH_MESSAGE,
  COPILOT_RECOVERY_MESSAGE,
  COPILOT_TIMEOUT_MESSAGE,
  COPILOT_TRIAL_EXHAUSTED_MESSAGE,
  buildFailedAssistantTurn,
  coPilotFailureAction,
  coPilotUserFacingError,
  getRetryUserMessage,
  isAbortError,
  isGuestTrialExhaustedError,
  isLowSignalUserMessage,
  prepareMessagesForRetry,
  removeEmptyAssistantTurn,
} from "@/lib/co-pilot-recovery"
import { setChatRegisteredUserId } from "@/lib/chat-auth-session"
import { sanitizeMessages, type ChatUiMessage } from "@/lib/chat-storage"

describe("co-pilot recovery helpers", () => {
  it("treats AbortError as expected teardown, not user error", () => {
    expect(isAbortError(Object.assign(new Error("aborted"), { name: "AbortError" }))).toBe(
      true
    )
    expect(isAbortError(new Error("HTTP 502"))).toBe(false)
    expect(coPilotUserFacingError(Object.assign(new Error("x"), { name: "AbortError" }))).toBe(
      ""
    )
  })

  it("maps transport failures to safe recovery copy (no HTTP codes)", () => {
    expect(coPilotUserFacingError(new Error("HTTP 502"))).toBe(COPILOT_RECOVERY_MESSAGE)
    expect(coPilotUserFacingError(new Error("Failed to fetch"))).toBe(
      COPILOT_RECOVERY_MESSAGE
    )
    expect(
      coPilotUserFacingError(
        Object.assign(new Error("Chat request timed out"), { name: "TimeoutError" })
      )
    ).toBe(COPILOT_TIMEOUT_MESSAGE)
    expect(coPilotUserFacingError(new Error("Exur returned an empty reply. Please try again."))).toBe(
      COPILOT_RECOVERY_MESSAGE
    )
    expect(COPILOT_RECOVERY_MESSAGE).not.toMatch(/HTTP|502|SSE|FetchError/i)
  })

  it("maps 402 credit exhaustion to upgrade copy", () => {
    const err = Object.assign(new Error("insufficient credit balance"), {
      status: 402,
    })
    expect(coPilotUserFacingError(err)).toBe(COPILOT_CREDIT_MESSAGE)
    expect(
      coPilotUserFacingError(err, { isProUser: true })
    ).toBe(COPILOT_PRO_SESSION_REFRESH_MESSAGE)
    expect(COPILOT_CREDIT_MESSAGE.toLowerCase()).toContain("upgrade")
    expect(COPILOT_CREDIT_MESSAGE).not.toMatch(/402|HTTP/i)
  })

  it("maps 401 to sign-in copy and connect action for registered users", () => {
    setChatRegisteredUserId("user-123")
    const err = Object.assign(new Error("unauthorized"), { status: 401 })
    expect(coPilotUserFacingError(err)).toBe(COPILOT_AUTH_MESSAGE)
    expect(coPilotFailureAction(err)).toBe("connect")
    expect(coPilotFailureAction(new Error("HTTP 502"))).toBe("retry")
    setChatRegisteredUserId(null)
  })

  it("maps guest 401 to retry instead of forced sign-in", () => {
    setChatRegisteredUserId(null)
    const err = Object.assign(new Error("invalid_token"), {
      status: 401,
      code: "invalid_token",
    })
    expect(coPilotFailureAction(err)).toBe("retry")
  })

  it("maps 403 login_required to trial exhausted copy and connect action", () => {
    const err = Object.assign(new Error("Guest trial exhausted"), {
      status: 403,
      code: "login_required",
    })
    expect(isGuestTrialExhaustedError(err)).toBe(true)
    expect(coPilotUserFacingError(err)).toBe(COPILOT_TRIAL_EXHAUSTED_MESSAGE)
    expect(coPilotFailureAction(err)).toBe("connect")
  })

  it("buildFailedAssistantTurn preserves partial content and marks retry", () => {
    const failed = buildFailedAssistantTurn({
      assistantId: "a1",
      partialContent: "Partial answer so far",
      userMessage: "Explain ETH",
      error: new Error("HTTP 502"),
    })
    expect(failed.content).toBe("Partial answer so far")
    expect(failed.error).toBe(true)
    expect(failed.action).toBe("retry")
    expect(failed.retryUserMessage).toBe("Explain ETH")
    expect(getRetryUserMessage(failed)).toBe("Explain ETH")
  })

  it("buildFailedAssistantTurn keeps empty content recoverable (no blank success)", () => {
    const failed = buildFailedAssistantTurn({
      assistantId: "a1",
      partialContent: "   ",
      userMessage: "Explain ETH",
      error: new Error("empty"),
    })
    expect(failed.content).toBe("")
    expect(failed.error).toBe(true)
    expect(failed.action).toBe("retry")
  })

  it("removeEmptyAssistantTurn clears blank in-flight bubbles after abort", () => {
    const messages = [
      { id: "u1", content: "Hi" },
      { id: "a1", content: "" },
      { id: "a2", content: "kept partial" },
    ]
    expect(removeEmptyAssistantTurn(messages, "a1")).toEqual([
      { id: "u1", content: "Hi" },
      { id: "a2", content: "kept partial" },
    ])
    expect(removeEmptyAssistantTurn(messages, "a2")).toEqual(messages)
  })

  it("prepareMessagesForRetry resets a single failed turn without duplicating the user", () => {
    const messages = [
      { id: "u1", content: "Explain ETH", role: "user" as const },
      {
        id: "a1",
        content: "partial",
        role: "assistant" as const,
        error: true,
        action: "retry",
        retryUserMessage: "Explain ETH",
      },
    ]
    const next = prepareMessagesForRetry(messages, "a1")
    expect(next).toHaveLength(2)
    expect(next[0]).toEqual(messages[0])
    expect(next[1]).toMatchObject({
      id: "a1",
      content: "",
      error: false,
      action: undefined,
    })
    expect(getRetryUserMessage(next[1])).toBeNull()
  })

  it("sanitizeMessages keeps recoverable retry turns and drops empty non-error assistants", () => {
    const messages: ChatUiMessage[] = [
      { id: "u1", role: "user", content: "Hi" },
      { id: "empty", role: "assistant", content: "" },
      {
        id: "fail",
        role: "assistant",
        content: "",
        error: true,
        action: "retry",
        retryUserMessage: "Hi",
      },
      {
        id: "partial-fail",
        role: "assistant",
        content: "Half",
        error: true,
        action: "retry",
        retryUserMessage: "Hi",
      },
    ]
    const cleaned = sanitizeMessages(messages)
    expect(cleaned.map((m) => m.id)).toEqual(["u1", "fail", "partial-fail"])
  })

  it("flags digit-only and punctuation-only input as low signal", () => {
    expect(isLowSignalUserMessage("12312434546")).toBe(true)
    expect(isLowSignalUserMessage("!!!")).toBe(true)
    expect(isLowSignalUserMessage("ETH outlook")).toBe(false)
    expect(isLowSignalUserMessage("Should I short?")).toBe(false)
  })

  it("preserves fallback content on failed assistant turns", () => {
    const failed = buildFailedAssistantTurn({
      assistantId: "a1",
      partialContent: "",
      fallbackContent: "Partial trade setup…",
      userMessage: "123",
      error: new Error("HTTP 502"),
    })
    expect(failed.content).toBe("Partial trade setup…")
    expect(failed.error).toBe(true)
  })
})
