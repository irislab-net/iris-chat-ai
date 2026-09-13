import { afterEach, describe, expect, it, vi } from "vitest"

import { chatApiUrl, getChatClientOrigin } from "@/lib/api/chat"

describe("chatApiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("builds a direct Cloud Run chat URL from CHAT_API_ORIGIN", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_CHAT_API_ORIGIN",
      "https://intel-copilot-v1-git-71611170957.europe-west1.run.app"
    )

    expect(getChatClientOrigin()).toBe(
      "https://intel-copilot-v1-git-71611170957.europe-west1.run.app"
    )
    expect(chatApiUrl("/message")).toBe(
      "https://intel-copilot-v1-git-71611170957.europe-west1.run.app/v1/chat/message"
    )
  })

  it("throws when no chat origin is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CHAT_API_ORIGIN", "")
    vi.stubEnv("CHAT_API_ORIGIN", "")

    expect(() => chatApiUrl("/message")).toThrow(
      "NEXT_PUBLIC_CHAT_API_ORIGIN or CHAT_API_ORIGIN"
    )
  })
})
