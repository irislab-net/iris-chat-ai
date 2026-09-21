import { describe, expect, it } from "vitest"

import type { CoPilotHistoryMessage } from "@/lib/api/types"
import { shouldRunPaperTradePipeline } from "@/lib/iris-paper-trade/routing"
import { ETH_SIGNAL_SAMPLE_PROMPT } from "@/lib/iris-paper-trade/signal-prompts"

const setupHistory: CoPilotHistoryMessage[] = [
  { role: "user", content: "Signal · ETH" },
  {
    role: "assistant",
    content:
      "Exur setup. Not a profit guarantee. No paper trade is open yet.\n\nETH LONG",
  },
]

describe("shouldRunPaperTradePipeline", () => {
  it("routes explicit legacy desk prompts on a fresh thread", () => {
    expect(shouldRunPaperTradePipeline(ETH_SIGNAL_SAMPLE_PROMPT, [])).toBe(
      true
    )
  })

  it("keeps @signal commands on regular chat", () => {
    expect(shouldRunPaperTradePipeline("@signal ETH", [])).toBe(false)
  })

  it("does not re-run paper trade for follow-up chat after a setup", () => {
    expect(
      shouldRunPaperTradePipeline(
        "what are the top important news of BTC today?",
        setupHistory
      )
    ).toBe(false)
  })

  it("allows a fresh explicit desk signal request in the same thread", () => {
    expect(
      shouldRunPaperTradePipeline(ETH_SIGNAL_SAMPLE_PROMPT, setupHistory)
    ).toBe(true)
  })
})
