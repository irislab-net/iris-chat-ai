import { describe, expect, it } from "vitest"

import {
  applyMentionSelection,
  buildSignalPrompt,
  expandComposerDraft,
  expandComposerMentions,
  expandSummarizedSignalUserMessage,
  filterMentionOptions,
  formatSignalCommand,
  parseComposerToolTag,
  parseMentionPalette,
  summarizeSignalUserMessage,
} from "@/lib/chat/composer-mentions"

describe("composer mentions", () => {
  it("opens palette after @", () => {
    expect(parseMentionPalette("hello @sig", 10)).toEqual({
      query: "sig",
      replaceStart: 6,
      replaceEnd: 10,
    })
  })

  it("shows only the signal tool", () => {
    expect(filterMentionOptions("").map((item) => item.id)).toEqual(["signal"])
    expect(filterMentionOptions("signal").map((item) => item.id)).toEqual([
      "signal",
    ])
    expect(filterMentionOptions("eth")).toEqual([])
  })

  it("formats a short @signal command for any asset", () => {
    expect(formatSignalCommand("ETH")).toBe("@signal ETH")
    expect(buildSignalPrompt("اتریوم")).toBe("@signal اتریوم")
  })

  it("expands tool tag + user text to @signal only", () => {
    expect(expandComposerDraft({ tool: "signal", text: "SOL" })).toBe(
      "@signal SOL"
    )
  })

  it("expands legacy @signal inline text to @signal only", () => {
    const expanded = expandComposerMentions("Please run @signal ETH now")
    expect(expanded).toBe("@signal ETH")
  })

  it("parses typed @signal into chip draft", () => {
    expect(parseComposerToolTag("@signal ETH")).toEqual({
      tool: "signal",
      text: "ETH",
    })
  })

  it("parses Persian and Arabic signal tags into chip drafts", () => {
    expect(parseComposerToolTag("سیگنال BTC")).toEqual({
      tool: "signal",
      text: "BTC",
    })
    expect(parseComposerToolTag("إشارة ETH")).toEqual({
      tool: "signal",
      text: "ETH",
    })
  })

  it("expands Persian signal drafts to @signal for the API", () => {
    expect(expandComposerDraft({ tool: "signal", text: "BTC" })).toBe(
      "@signal BTC"
    )
    expect(expandComposerMentions("سیگنال BTC")).toBe("@signal BTC")
    expect(expandComposerMentions("إشارة SOL")).toBe("@signal SOL")
  })

  it("applies mention selection by removing @ fragment", () => {
    const result = applyMentionSelection({
      text: "check @sig",
      replaceStart: 6,
      replaceEnd: 10,
    })
    expect(result.nextText).toBe("check ")
    expect(result.nextCursor).toBe(6)
  })

  it("summarizes @signal commands for history", () => {
    expect(summarizeSignalUserMessage("@signal ETH")).toBe("Signal · ETH")
    expect(summarizeSignalUserMessage("سیگنال BTC", "سیگنال")).toBe(
      "سیگنال · BTC"
    )
    expect(summarizeSignalUserMessage("إشارة ETH", "إشارة")).toBe(
      "إشارة · ETH"
    )
    expect(summarizeSignalUserMessage("What is ETH doing today?")).toBe(
      "What is ETH doing today?"
    )
  })

  it("re-expands summarized labels to @signal commands", () => {
    expect(expandSummarizedSignalUserMessage("Signal · ETH")).toBe(
      "@signal ETH"
    )
    expect(expandSummarizedSignalUserMessage("سیگنال · BTC")).toBe(
      "@signal BTC"
    )
    expect(expandSummarizedSignalUserMessage("إشارة · ETH")).toBe(
      "@signal ETH"
    )
  })

  it("filters mention options by Persian and Arabic aliases", () => {
    expect(filterMentionOptions("سیگنال").map((item) => item.id)).toEqual([
      "signal",
    ])
    expect(filterMentionOptions("إشارة").map((item) => item.id)).toEqual([
      "signal",
    ])
  })

  it("still summarizes legacy desk prompts for history", () => {
    const leaked = `Trading desk request for BTC.

---
MARKET_CONTEXT (authoritative evidence; asOf=2026-09-19T00:00:00.000Z):
{"symbol":"BTC"}`
    expect(summarizeSignalUserMessage(leaked)).toBe("Signal · BTC")
  })
})
