import { describe, expect, it } from "vitest"

import {
  appendThinkingStep,
  joinReasoningTexts,
  parseChatSseBlock,
} from "@/lib/api/chat-sse"

describe("parseChatSseBlock", () => {
  it("parses reasoning events", () => {
    expect(
      parseChatSseBlock('event: reasoning\ndata: {"text":"Checking ETH"}')
    ).toEqual({
      event: "reasoning",
      data: { text: "Checking ETH" },
    })
  })

  it("parses tool events", () => {
    expect(
      parseChatSseBlock('event: tool\ndata: {"tool":"get_market_state"}')
    ).toEqual({
      event: "tool",
      data: { tool: "get_market_state" },
    })
  })

  it("parses error events", () => {
    expect(
      parseChatSseBlock(
        'event: error\ndata: {"message":"agent failed","code":"agent_error"}'
      )
    ).toEqual({
      event: "error",
      data: { message: "agent failed", code: "agent_error" },
    })
  })

  it("parses done payloads", () => {
    const event = parseChatSseBlock(
      'event: done\ndata: {"session_id":"s1","output_text":"Hello","reasoning":"Thought"}'
    )
    expect(event?.event).toBe("done")
    if (event?.event === "done") {
      expect(event.data.output_text).toBe("Hello")
      expect(event.data.reasoning).toBe("Thought")
    }
  })

  it("ignores comments and empty blocks", () => {
    expect(parseChatSseBlock(": keepalive")).toBeNull()
    expect(parseChatSseBlock("")).toBeNull()
  })
})

describe("thinking helpers", () => {
  it("appends steps and joins reasoning", () => {
    const steps = appendThinkingStep(undefined, {
      type: "reasoning",
      text: "One",
    })
    expect(
      appendThinkingStep(steps, { type: "tool", name: "get_market_state" })
    ).toEqual([
      { type: "reasoning", text: "One" },
      { type: "tool", name: "get_market_state" },
    ])
    expect(joinReasoningTexts(["One", "Two"])).toBe("One\n\nTwo")
  })
})
