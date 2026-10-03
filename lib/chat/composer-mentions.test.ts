import { describe, expect, it } from "vitest"

import {
  applyMentionSelection,
  buildSignalPrompt,
  expandComposerDraft,
  expandComposerMentions,
  expandSummarizedSignalUserMessage,
  filterMentionOptions,
  formatSignalCommand,
  mentionTokenForTool,
  parseComposerToolTag,
  parseMentionPalette,
  splitComposerMentionHighlights,
  summarizeSignalUserMessage,
} from "@/lib/chat/composer-mentions"

describe("composer mentions", () => {
  it("opens palette after /", () => {
    expect(parseMentionPalette("hello /sig", 10)).toEqual({
      query: "sig",
      replaceStart: 6,
      replaceEnd: 10,
    })
  })

  it("closes palette once whitespace follows the query", () => {
    expect(parseMentionPalette("/Signal ETH", 11)).toBeNull()
    expect(parseMentionPalette("/سیگنال اتریوم", 8)).toBeNull()
  })

  it("does not open palette for @", () => {
    expect(parseMentionPalette("hello @sig", 10)).toBeNull()
  })

  it("shows only the signal tool", () => {
    expect(filterMentionOptions("").map((item) => item.id)).toEqual(["signal"])
    expect(filterMentionOptions("signal").map((item) => item.id)).toEqual([
      "signal",
    ])
    expect(filterMentionOptions("eth")).toEqual([])
  })

  it("formats a short @signal command for compact assets", () => {
    expect(formatSignalCommand("ETH")).toBe("@signal ETH")
    expect(buildSignalPrompt("اتریوم")).toBe("@signal اتریوم")
  })

  it("expands free-form /Signal prose into an explicit wire prompt", () => {
    const wire = expandComposerMentions("/Signal میخوام")
    expect(wire.startsWith("@signal میخوام")).toBe(true)
    expect(wire).toContain("trade-signal tool request")
    expect(wire).toContain("show_trade_signal")
    expect(wire.startsWith("/Signal")).toBe(false)
  })

  it("never leaves a bare /Signal token for the model", () => {
    const wire = expandComposerMentions("/Signal")
    expect(wire.startsWith("@signal")).toBe(true)
    expect(wire).toContain("trade-signal tool request")
    expect(wire).not.toBe("/Signal")
  })

  it("builds localized inline mention tokens with slash", () => {
    expect(mentionTokenForTool("signal", "Signal")).toBe("/Signal ")
    expect(mentionTokenForTool("signal", "سیگنال")).toBe("/سیگنال ")
  })

  it("expands tool tag + user text to @signal only", () => {
    expect(expandComposerDraft({ tool: "signal", text: "SOL" })).toBe(
      "@signal SOL"
    )
  })

  it("expands slash and legacy @signal inline text to @signal only", () => {
    expect(expandComposerMentions("Please run /signal ETH now")).toBe(
      "@signal ETH"
    )
    expect(expandComposerMentions("Please run @signal ETH now")).toBe(
      "@signal ETH"
    )
  })

  it("expands localized inline mentions to @signal", () => {
    expect(expandComposerMentions("/Signal ETH")).toBe("@signal ETH")
    expect(expandComposerMentions("/سیگنال BTC")).toBe("@signal BTC")
    expect(expandComposerMentions("/إشارة SOL")).toBe("@signal SOL")
    expect(expandComposerMentions("@Signal ETH")).toBe("@signal ETH")
  })

  it("parses typed /signal into draft parts", () => {
    expect(parseComposerToolTag("/signal ETH")).toEqual({
      tool: "signal",
      text: "ETH",
    })
  })

  it("parses Persian and Arabic signal tags into draft parts", () => {
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

  it("applies mention selection by inserting an inline slash token", () => {
    const result = applyMentionSelection({
      text: "check /sig",
      replaceStart: 6,
      replaceEnd: 10,
      token: "/Signal ",
    })
    expect(result.nextText).toBe("check /Signal ")
    expect(result.nextCursor).toBe(14)
  })

  it("highlights committed inline mention tokens", () => {
    expect(splitComposerMentionHighlights("/Signal ETH")).toEqual([
      { type: "mention", value: "/Signal" },
      { type: "text", value: " ETH" },
    ])
    expect(splitComposerMentionHighlights("/سیگنال اتریوم")).toEqual([
      { type: "mention", value: "/سیگنال" },
      { type: "text", value: " اتریوم" },
    ])
    expect(splitComposerMentionHighlights("/sig")).toEqual([
      { type: "text", value: "/sig" },
    ])
  })

  it("summarizes signal commands for history", () => {
    expect(summarizeSignalUserMessage("@signal ETH")).toBe("Signal · ETH")
    expect(summarizeSignalUserMessage("/signal ETH")).toBe("Signal · ETH")
    expect(
      summarizeSignalUserMessage(
        "@signal میخوام\nTreat this as a trade-signal tool request (/Signal)."
      )
    ).toBe("Signal · میخوام")
    expect(summarizeSignalUserMessage("سیگنال BTC", "سیگنال")).toBe(
      "سیگنال · BTC"
    )
    expect(summarizeSignalUserMessage("إشارة ETH", "إشارة")).toBe("إشارة · ETH")
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
    expect(expandSummarizedSignalUserMessage("إشارة · ETH")).toBe("@signal ETH")
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
