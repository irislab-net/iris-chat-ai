import { describe, expect, it } from "vitest"

import {
  applyMentionSelection,
  buildSignalPrompt,
  expandComposerDraft,
  expandComposerMentions,
  filterMentionOptions,
  parseComposerToolTag,
  parseMentionPalette,
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

  it("expands legacy @signal inline text", () => {
    const expanded = expandComposerMentions("Please run @signal ETH now")
    expect(expanded).toContain("Trading desk request for ETH")
    expect(expanded).not.toContain("@signal ETH")
  })

  it("parses typed @signal into chip draft", () => {
    expect(parseComposerToolTag("@signal ETH")).toEqual({
      tool: "signal",
      text: "ETH",
    })
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
})
