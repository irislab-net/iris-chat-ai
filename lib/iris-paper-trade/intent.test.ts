import { describe, expect, it } from "vitest"

import { isPaperTradeIntent } from "@/lib/iris-paper-trade/intent"
import { ETH_SIGNAL_SAMPLE_PROMPT } from "@/lib/iris-paper-trade/signal-prompts"
import {
  IRIS_SAMPLE_PROMPTS,
  PAPER_TRADE_SAMPLE_PROMPT,
} from "@/lib/iris-paper-trade/types"

describe("isPaperTradeIntent", () => {
  it("matches explicit paper-trade prompts", () => {
    expect(isPaperTradeIntent(PAPER_TRADE_SAMPLE_PROMPT)).toBe(true)
  })

  it("matches signal starters through the paper-trade pipeline", () => {
    expect(isPaperTradeIntent(ETH_SIGNAL_SAMPLE_PROMPT)).toBe(true)
    expect(isPaperTradeIntent(IRIS_SAMPLE_PROMPTS[0]?.text ?? "")).toBe(true)
  })

  it("does not match analysis-only starters", () => {
    expect(isPaperTradeIntent(IRIS_SAMPLE_PROMPTS[1]?.text ?? "")).toBe(false)
    expect(isPaperTradeIntent(IRIS_SAMPLE_PROMPTS[2]?.text ?? "")).toBe(false)
  })

  it("matches natural ETH signal phrasing", () => {
    expect(
      isPaperTradeIntent(
        "Give me an ETH trade signal with entry, stop loss, and take profit on paper."
      )
    ).toBe(true)
    expect(
      isPaperTradeIntent(
        "Scan live ETH and propose a paper trade if the setup is valid."
      )
    ).toBe(true)
  })

  it("does not treat regular co-pilot questions as paper-trade requests", () => {
    expect(isPaperTradeIntent("Should I long ETH this candle?")).toBe(false)
    expect(isPaperTradeIntent("What is the news pulse on ETH?")).toBe(false)
  })
})
