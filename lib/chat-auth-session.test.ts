import { afterEach, describe, expect, it } from "vitest"

import {
  isGuestChatSession,
  setChatRegisteredUserId,
} from "@/lib/chat-auth-session"

describe("chat auth session", () => {
  afterEach(() => {
    setChatRegisteredUserId(null)
  })

  it("uses guest chat when no registered user is set", () => {
    expect(isGuestChatSession()).toBe(true)
  })

  it("uses registered chat when a user id is set", () => {
    setChatRegisteredUserId("user-123")
    expect(isGuestChatSession()).toBe(false)
  })
})
