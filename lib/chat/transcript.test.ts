import { describe, expect, it } from "vitest"

import {
  formatConversationTranscript,
  formatPaperTicketBlock,
} from "@/lib/chat/transcript"
import type { ChatUiMessage } from "@/lib/chat-storage"

describe("formatConversationTranscript", () => {
  it("copies user and assistant turns as plain text", () => {
    const messages: ChatUiMessage[] = [
      { id: "1", role: "user", content: "Hello" },
      { id: "2", role: "assistant", content: "Hi there" },
    ]
    expect(formatConversationTranscript(messages)).toBe(
      "You:\nHello\n\nExur:\nHi there"
    )
  })

  it("includes the title and paper ticket details", () => {
    const messages: ChatUiMessage[] = [
      { id: "1", role: "user", content: "@signal BTC" },
      {
        id: "2",
        role: "assistant",
        content: "",
        paperTicket: {
          symbol: "BTC",
          side: "LONG",
          quantity: 0.1,
          markPrice: 100_000,
          stopLoss: 95_000,
          takeProfit: 110_000,
          leverage: 5,
          setup: "Breakout",
          thesis: "Momentum",
        },
      },
    ]
    const text = formatConversationTranscript(messages, { title: "BTC setup" })
    expect(text.startsWith("BTC setup\n\n")).toBe(true)
    expect(text).toContain("You:\n@signal BTC")
    expect(text).toContain("BTC LONG")
    expect(text).toContain("Setup: Breakout")
    expect(text).toContain("Thesis: Momentum")
  })

  it("falls back to history when UI messages are empty", () => {
    const text = formatConversationTranscript([], {
      history: [
        { role: "user", content: "Pulse?" },
        { role: "assistant", content: "Quiet tape." },
      ],
    })
    expect(text).toBe("You:\nPulse?\n\nExur:\nQuiet tape.")
  })
})

describe("formatPaperTicketBlock", () => {
  it("renders the core levels", () => {
    expect(
      formatPaperTicketBlock({
        symbol: "ETH",
        side: "SHORT",
        quantity: 1,
        markPrice: 2500,
        stopLoss: 2600,
        takeProfit: 2300,
        leverage: 3,
        setup: "Rejection",
        thesis: "Supply",
      })
    ).toContain("ETH SHORT")
  })
})
