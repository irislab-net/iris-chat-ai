import { describe, expect, it } from "vitest"

import {
  chatStreamErrorFromEvent,
  httpStatusForChatErrorCode,
  isChatCreditErrorCode,
  isChatLoginRequiredCode,
  isChatRetryableFailureMessage,
  normalizeChatErrorCode,
} from "@/lib/api/chat-errors"

describe("chat-errors", () => {
  it("normalizes empty and whitespace codes to undefined", () => {
    expect(normalizeChatErrorCode("")).toBeUndefined()
    expect(normalizeChatErrorCode("  ")).toBeUndefined()
    expect(normalizeChatErrorCode("daily_limit_reached")).toBe(
      "daily_limit_reached"
    )
  })

  it("recognizes credit and login_required codes", () => {
    expect(isChatCreditErrorCode("daily_limit_reached")).toBe(true)
    expect(isChatCreditErrorCode("weekly_limit_reached")).toBe(true)
    expect(isChatCreditErrorCode("insufficient_credit")).toBe(true)
    expect(isChatCreditErrorCode("login_required")).toBe(false)
    expect(isChatLoginRequiredCode("login_required")).toBe(true)
  })

  it("maps codes to the JSON /message HTTP status", () => {
    expect(httpStatusForChatErrorCode("daily_limit_reached")).toBe(402)
    expect(httpStatusForChatErrorCode("weekly_limit_reached")).toBe(402)
    expect(httpStatusForChatErrorCode("insufficient_credit")).toBe(402)
    expect(httpStatusForChatErrorCode("login_required")).toBe(403)
    expect(httpStatusForChatErrorCode("unauthorized")).toBe(401)
    expect(httpStatusForChatErrorCode("invalid_token")).toBe(401)
    expect(httpStatusForChatErrorCode("effort_not_allowed")).toBe(400)
    expect(httpStatusForChatErrorCode("stream_unsupported")).toBe(500)
    expect(httpStatusForChatErrorCode(undefined)).toBeUndefined()
  })

  it("treats agent / reserve failures as retryable, not paywall", () => {
    expect(isChatRetryableFailureMessage("agent execution failed")).toBe(true)
    expect(isChatRetryableFailureMessage("failed to reserve credit")).toBe(true)
    expect(isChatRetryableFailureMessage("daily usage limit reached")).toBe(
      false
    )
  })

  it("builds stream errors with inferred status from code", () => {
    const credit = chatStreamErrorFromEvent({
      message: "daily usage limit reached",
      code: "daily_limit_reached",
    })
    expect(credit.message).toBe("daily usage limit reached")
    expect(credit.code).toBe("daily_limit_reached")
    expect(credit.status).toBe(402)

    const guest = chatStreamErrorFromEvent({
      message: "Guest trial exhausted for this week. Sign in to continue.",
      code: "login_required",
    })
    expect(guest.code).toBe("login_required")
    expect(guest.status).toBe(403)

    const agent = chatStreamErrorFromEvent({
      message: "agent execution failed",
      code: "",
    })
    expect(agent.code).toBeUndefined()
    expect(agent.status).toBeUndefined()
    expect(agent.message).toBe("agent execution failed")
  })
})
