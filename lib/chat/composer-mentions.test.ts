import { describe, expect, it } from "vitest"

import {
  applyMentionSelection,
  buildSignalPrompt,
  expandComposerDraft,
  expandComposerMentions,
  filterMentionOptions,
  insertToolMentionAtCursor,
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

  it("builds a signal prompt for any asset", () => {
    expect(buildSignalPrompt("ETH")).toContain("Trading desk request for ETH")
    expect(buildSignalPrompt("اتریوم")).toContain("درخواست میز معاملاتی")
  })

  it("expands tool tag + user text", () => {
    const expanded = expandComposerDraft({ tool: "signal", text: "SOL" })
    expect(expanded).toContain("Trading desk request for SOL")
  })

  it("expands @signal inline anywhere in the message", () => {
    const expanded = expandComposerMentions("Please run @signal ETH now")
    expect(expanded).toContain("Trading desk request for ETH")
    expect(expanded).not.toContain("@signal ETH")
  })

  it("expands whole-draft @signal with a multi-word asset", () => {
    const expanded = expandComposerMentions("@signal Bitcoin Cash")
    expect(expanded).toContain("Trading desk request for Bitcoin Cash")
  })

  it("parses typed @signal into a draft shape (legacy)", () => {
    expect(parseComposerToolTag("@signal ETH")).toEqual({
      tool: "signal",
      text: "ETH",
    })
  })

  it("applies mention selection by inserting @signal at the @ fragment", () => {
    const result = applyMentionSelection({
      text: "check @sig",
      replaceStart: 6,
      replaceEnd: 10,
      tool: "signal",
    })
    expect(result.nextText).toBe("check @signal ")
    expect(result.nextCursor).toBe(14)
  })

  it("inserts @signal at the caret, with a leading space when needed", () => {
    expect(
      insertToolMentionAtCursor({
        text: "hello",
        cursor: 5,
        tool: "signal",
      })
    ).toEqual({ nextText: "hello @signal ", nextCursor: 14 })

    expect(
      insertToolMentionAtCursor({
        text: "before after",
        cursor: 7,
        selectionEnd: 7,
        tool: "signal",
      })
    ).toEqual({ nextText: "before @signal after", nextCursor: 15 })
  })

  it("summarizes expanded desk prompts for history", () => {
    expect(summarizeSignalUserMessage(buildSignalPrompt("ETH"))).toBe(
      "Signal · ETH"
    )
    expect(summarizeSignalUserMessage("What is ETH doing today?")).toBe(
      "What is ETH doing today?"
    )
  })
})
