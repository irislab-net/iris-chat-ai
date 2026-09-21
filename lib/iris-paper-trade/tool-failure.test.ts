import { describe, expect, it } from "vitest"

import {
  findToolFailureSignalRecoveryTargets,
  isOpenPaperTradeToolFailureProse,
} from "@/lib/iris-paper-trade/tool-failure"

describe("isOpenPaperTradeToolFailureProse", () => {
  it("detects unknown-tool failures", () => {
    expect(
      isOpenPaperTradeToolFailureProse(
        "I am unable to execute the open_paper_trade function. It appears to be an unknown tool."
      )
    ).toBe(true)
  })

  it("ignores regular assistant replies", () => {
    expect(
      isOpenPaperTradeToolFailureProse(
        "Exur setup. Not a profit guarantee. No paper trade is open yet."
      )
    ).toBe(false)
  })
})

describe("findToolFailureSignalRecoveryTargets", () => {
  it("does not recover @signal turns via the local desk synthesizer", () => {
    const targets = findToolFailureSignalRecoveryTargets([
      { id: "u1", role: "user", content: "Signal · eth" },
      {
        id: "a1",
        role: "assistant",
        content:
          "I am unable to execute the open_paper_trade function. It appears to be an unknown tool.",
      },
    ])

    expect(targets).toEqual([])
  })

  it("recovers legacy desk-prompt turns that failed open_paper_trade", () => {
    const targets = findToolFailureSignalRecoveryTargets([
      {
        id: "u1",
        role: "user",
        content:
          "Trading desk request for eth. Use ALL available Exur evidence.",
      },
      {
        id: "a1",
        role: "assistant",
        content:
          "I am unable to execute the open_paper_trade function. It appears to be an unknown tool.",
      },
    ])

    expect(targets).toEqual([
      {
        messageId: "a1",
        userMessage: expect.stringContaining("Trading desk request for eth"),
      },
    ])
  })
})
