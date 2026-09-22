import { describe, expect, it } from "vitest"

import {
  enrichPaperTicketsOnMessages,
  signalRewardRiskRatio,
  splitSignalAssistantMessage,
} from "@/lib/chat/signal-setup"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"

const sampleTicket: PaperTradeTicket = {
  symbol: "ETH",
  side: "SHORT",
  quantity: 37.8787,
  markPrice: 2473.8,
  stopLoss: 2487,
  takeProfit: 2441.9,
  leverage: 5,
  setup: "Model short edge fade",
  thesis: "Models lean short while price sits below the 1h mean.",
}

describe("splitSignalAssistantMessage", () => {
  it("uses paperTicket and keeps thesis separate from the setup block", () => {
    const content = [
      "Exur setup. Not a profit guarantee. No paper trade is open yet.",
      "",
      "ETH SHORT",
      "Setup: Model short edge fade",
      "Entry 2,473.8",
      "SL 2,487",
      "TP 2,441.9",
      "Leverage 5x",
      "Size 37.8787 (risk ~$500.00 = 0.5% of demo equity)",
      "",
      sampleTicket.thesis,
    ].join("\n")

    const parts = splitSignalAssistantMessage({
      content,
      paperTicket: sampleTicket,
    })

    expect(parts.ticket).toEqual(sampleTicket)
    expect(parts.tailText).toBe("")
  })

  it("keeps free-form output_text as lead when a client signal card is present", () => {
    const parts = splitSignalAssistantMessage({
      content: "ETH short-term long from live structure.",
      paperTicket: sampleTicket,
    })

    expect(parts.leadText).toBe("ETH short-term long from live structure.")
    expect(parts.ticket).toEqual(sampleTicket)
    expect(parts.tailText).toBe("")
  })

  it("keeps thesis-only output_text on the ticket (card owns thesis)", () => {
    const parts = splitSignalAssistantMessage({
      content: sampleTicket.thesis,
      paperTicket: sampleTicket,
    })

    expect(parts.leadText).toBe("")
    expect(parts.ticket).toEqual(sampleTicket)
    expect(parts.tailText).toBe("")
  })

  it("keeps free-form prose when the ticket thesis is generic", () => {
    const parts = splitSignalAssistantMessage({
      content: "Models lean long into the London open.",
      paperTicket: { ...sampleTicket, thesis: "IRIS signal" },
    })

    expect(parts.leadText).toBe("Models lean long into the London open.")
    expect(parts.tailText).toBe("")
  })

  it("does not invent a Signal card from setup prose without a ticket", () => {
    const content =
      "ETH SHORT Setup: Model short edge fade Entry 2,473.8 SL 2,487 TP 2,441.9 Leverage 5x"

    const parts = splitSignalAssistantMessage({ content })

    expect(parts.ticket).toBeNull()
    expect(parts.leadText).toBe("")
    expect(parts.tailText).toBe("")
  })
})

describe("enrichPaperTicketsOnMessages", () => {
  it("does not attach paperTicket from setup prose alone", () => {
    const setupContent = [
      "Exur setup. Not a profit guarantee. No paper trade is open yet.",
      "",
      "ETH SHORT",
      "Setup: Model short edge fade",
      "Entry 2,473.8",
      "SL 2,487",
      "TP 2,441.9",
      "Leverage 5x",
    ].join("\n")

    const enriched = enrichPaperTicketsOnMessages([
      { id: "u1", role: "user", content: "signal please" },
      { id: "a1", role: "assistant", content: setupContent },
      { id: "u2", role: "user", content: "why this entry?" },
      { id: "a2", role: "assistant", content: "Because momentum faded." },
    ])

    expect(enriched[1]?.paperTicket).toBeUndefined()
    expect(enriched[3]?.paperTicket).toBeUndefined()
  })

  it("keeps signal-turn tickets and strips follow-up duplicates", () => {
    const ticket = {
      symbol: "ETH",
      side: "SHORT" as const,
      quantity: 1,
      markPrice: 1,
      stopLoss: 2,
      takeProfit: 3,
      leverage: 5,
      setup: "fade",
      thesis: "test",
    }

    const enriched = enrichPaperTicketsOnMessages([
      { id: "u1", role: "user", content: "@signal ETH" },
      {
        id: "a1",
        role: "assistant",
        content:
          "Exur setup. Not a profit guarantee.\n\nETH SHORT\nSetup: fade\nEntry 1\nSL 2\nTP 3\nLeverage 5x",
        paperTicket: ticket,
      },
      { id: "u2", role: "user", content: "why?" },
      {
        id: "a2",
        role: "assistant",
        content: "Because momentum faded.",
        paperTicket: ticket,
      },
    ])

    expect(enriched[1]?.paperTicket?.symbol).toBe("ETH")
    expect(enriched[3]?.paperTicket).toBeUndefined()
  })

  it("keeps a second @signal ticket later in the same thread", () => {
    const btcTicket = {
      symbol: "BTC",
      side: "SHORT" as const,
      quantity: 1,
      markPrice: 87000,
      stopLoss: 87500,
      takeProfit: 86000,
      leverage: 5,
      setup: "btc fade",
      thesis: "btc thesis",
    }
    const ethTicket = {
      symbol: "ETH",
      side: "LONG" as const,
      quantity: 1,
      markPrice: 2500,
      stopLoss: 2450,
      takeProfit: 2600,
      leverage: 5,
      setup: "eth bounce",
      thesis: "eth thesis",
    }

    const enriched = enrichPaperTicketsOnMessages([
      { id: "u1", role: "user", content: "@signal BTC" },
      {
        id: "a1",
        role: "assistant",
        content: "",
        paperTicket: btcTicket,
      },
      { id: "u2", role: "user", content: "Signal · ETH" },
      {
        id: "a2",
        role: "assistant",
        content: "",
        paperTicket: ethTicket,
      },
    ])

    expect(enriched[1]?.paperTicket?.symbol).toBe("BTC")
    expect(enriched[3]?.paperTicket?.symbol).toBe("ETH")
  })
})

describe("signalRewardRiskRatio", () => {
  it("computes reward-to-risk for short setups", () => {
    expect(signalRewardRiskRatio(sampleTicket)).toBeCloseTo(2.4167, 3)
  })
})
