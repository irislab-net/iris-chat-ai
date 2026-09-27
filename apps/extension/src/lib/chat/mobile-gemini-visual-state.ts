type MobileGeminiVisualPhase = "empty" | "focused" | "streaming" | "threaded"

function resolveMobileGeminiVisualPhase(input: {
  isMobileOverlay: boolean
  messageCount: number
  composerFocused: boolean
  sending: boolean
}): MobileGeminiVisualPhase | null {
  if (!input.isMobileOverlay) return null
  if (input.messageCount > 0) {
    return input.sending ? "streaming" : "threaded"
  }
  if (input.sending) return "streaming"
  if (input.composerFocused) return "focused"
  return "empty"
}

function isMobileGeminiBackgroundVisible(
  phase: MobileGeminiVisualPhase | null,
  messageCount: number
): boolean {
  return phase !== null && messageCount === 0
}

function isMobileGeminiBackgroundActive(
  phase: MobileGeminiVisualPhase | null
): boolean {
  return phase === "focused" || phase === "streaming"
}

export {
  isMobileGeminiBackgroundActive,
  isMobileGeminiBackgroundVisible,
  resolveMobileGeminiVisualPhase,
}
export type { MobileGeminiVisualPhase }
