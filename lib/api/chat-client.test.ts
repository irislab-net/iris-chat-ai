import { describe, expect, it } from "vitest"

import { chatApiPath } from "@/lib/api/chat"

describe("chatApiPath", () => {
  it("builds same-origin chat proxy paths", () => {
    expect(chatApiPath("/message")).toBe("/v1/chat/message")
    expect(chatApiPath("credits")).toBe("/v1/chat/credits")
    expect(chatApiPath("/guest/session")).toBe("/v1/chat/guest/session")
  })
})
