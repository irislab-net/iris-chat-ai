import { describe, expect, it } from "vitest"

import {
  isMobileGeminiBackgroundActive,
  isMobileGeminiBackgroundVisible,
  resolveMobileGeminiVisualPhase,
} from "@/lib/chat/mobile-gemini-visual-state"

describe("resolveMobileGeminiVisualPhase", () => {
  it("returns null on desktop", () => {
    expect(
      resolveMobileGeminiVisualPhase({
        isMobileOverlay: false,
        messageCount: 0,
        composerFocused: false,
        sending: false,
      })
    ).toBeNull()
  })

  it("tracks empty, focused, streaming, and threaded", () => {
    const base = {
      isMobileOverlay: true,
      messageCount: 0,
      composerFocused: false,
      sending: false,
    }

    expect(resolveMobileGeminiVisualPhase(base)).toBe("empty")
    expect(
      resolveMobileGeminiVisualPhase({ ...base, composerFocused: true })
    ).toBe("focused")
    expect(resolveMobileGeminiVisualPhase({ ...base, sending: true })).toBe(
      "streaming"
    )
    expect(
      resolveMobileGeminiVisualPhase({
        ...base,
        messageCount: 2,
        sending: true,
      })
    ).toBe("streaming")
    expect(
      resolveMobileGeminiVisualPhase({
        ...base,
        messageCount: 2,
        sending: false,
      })
    ).toBe("threaded")
  })
})

describe("isMobileGeminiBackgroundVisible", () => {
  it("is visible only while the thread is still empty", () => {
    expect(isMobileGeminiBackgroundVisible("empty", 0)).toBe(true)
    expect(isMobileGeminiBackgroundVisible("focused", 0)).toBe(true)
    expect(isMobileGeminiBackgroundVisible("streaming", 0)).toBe(true)
    expect(isMobileGeminiBackgroundVisible("threaded", 2)).toBe(false)
    expect(isMobileGeminiBackgroundVisible(null, 0)).toBe(false)
  })
})

describe("isMobileGeminiBackgroundActive", () => {
  it("speeds up ambient motion on focus or first send", () => {
    expect(isMobileGeminiBackgroundActive("empty")).toBe(false)
    expect(isMobileGeminiBackgroundActive("focused")).toBe(true)
    expect(isMobileGeminiBackgroundActive("streaming")).toBe(true)
    expect(isMobileGeminiBackgroundActive("threaded")).toBe(false)
  })
})
