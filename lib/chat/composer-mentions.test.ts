import { describe, expect, it } from "vitest"

import {
  applyMentionSelection,
  buildSignalPrompt,
  composerHasMixedBidiScripts,
  composerInputDirection,
  expandComposerDraft,
  expandComposerMentions,
  expandSummarizedSignalUserMessage,
  filterComposerPaletteTools,
  filterMentionOptions,
  formatSignalCommand,
  mapCursorThroughSignalNormalize,
  mentionTokenForTool,
  normalizeComposerSignalMentions,
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

  it("shows only the signal tool in mention options", () => {
    expect(filterMentionOptions("").map((item) => item.id)).toEqual(["signal"])
    expect(filterMentionOptions("signal").map((item) => item.id)).toEqual([
      "signal",
    ])
    expect(filterMentionOptions("eth")).toEqual([])
  })

  it("filters composer palette tools by typed query", () => {
    const labels = {
      signal: "Signal",
      correlation: "Asset Correlation",
      volatility: "Volatility Forecast",
    }
    expect(filterComposerPaletteTools("", labels).map((item) => item.id)).toEqual([
      "signal",
      "correlation",
      "volatility",
    ])
    expect(
      filterComposerPaletteTools("vol", labels).map((item) => item.id)
    ).toEqual(["volatility"])
    expect(
      filterComposerPaletteTools("همبستگی", labels).map((item) => item.id)
    ).toEqual(["correlation"])
    expect(filterComposerPaletteTools("eth", labels)).toEqual([])
  })

  it("picks composer input direction from first strong character", () => {
    expect(composerInputDirection("", "rtl")).toBe("rtl")
    expect(composerInputDirection("/Signal eth", "rtl")).toBe("ltr")
    expect(composerInputDirection("/سیگنال اتریوم", "ltr")).toBe("rtl")
    expect(composerInputDirection("hello", "rtl")).toBe("ltr")
    expect(composerInputDirection("سلام", "ltr")).toBe("rtl")
    // Mixed: Persian first → RTL (must not flip to LTR because of /Signal).
    expect(composerInputDirection("سلام /Signal", "ltr")).toBe("rtl")
    expect(composerInputDirection("/Signal سلام", "rtl")).toBe("ltr")
  })

  it("detects mixed RTL/LTR scripts for mention-mirror safety", () => {
    expect(composerHasMixedBidiScripts("/Signal ETH")).toBe(false)
    expect(composerHasMixedBidiScripts("سلام دنیا")).toBe(false)
    expect(composerHasMixedBidiScripts("سلام /Signal")).toBe(true)
    expect(composerHasMixedBidiScripts("/سیگنال ETH")).toBe(true)
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

  it("expands bare Signal + Persian prose (asset + intent) for the wire", () => {
    const simple = expandComposerMentions("Signal ارتریوم میخوام")
    expect(simple.startsWith("@signal ارتریوم میخوام")).toBe(true)
    expect(simple).toContain("trade-signal tool request")
    expect(simple).toContain("show_trade_signal")

    const withAdj = expandComposerMentions("Signal ارتریوم قوی میخوام")
    expect(withAdj.startsWith("@signal ارتریوم قوی میخوام")).toBe(true)
    expect(withAdj).toContain("trade-signal tool request")

    const compactFa = expandComposerMentions("Signal اتریوم")
    expect(compactFa).toBe("@signal اتریوم")
  })

  it("never leaves a bare /Signal token for the model", () => {
    const wire = expandComposerMentions("/Signal")
    expect(wire.startsWith("@signal")).toBe(true)
    expect(wire).toContain("trade-signal tool request")
    expect(wire).not.toBe("/Signal")
  })

  it("builds localized inline mention tokens without slash", () => {
    expect(mentionTokenForTool("signal", "Signal")).toBe("Signal ")
    expect(mentionTokenForTool("signal", "سیگنال")).toBe("سیگنال ")
  })

  it("normalizes pasted /signal variants into the bare UI mention", () => {
    expect(normalizeComposerSignalMentions("/signal btc")).toBe("Signal BTC")
    expect(normalizeComposerSignalMentions("/Signal ETH")).toBe("Signal ETH")
    expect(normalizeComposerSignalMentions("@signal sol")).toBe("Signal SOL")
    expect(normalizeComposerSignalMentions("/سیگنال btc", "سیگنال")).toBe(
      "سیگنال BTC"
    )
    expect(normalizeComposerSignalMentions("check /signal eth now")).toBe(
      "check Signal ETH now"
    )
    expect(normalizeComposerSignalMentions("/signal")).toBe("Signal")
    // In-progress palette query — do not rewrite until whitespace follows.
    expect(normalizeComposerSignalMentions("/sig")).toBe("/sig")
    expect(normalizeComposerSignalMentions("/signa")).toBe("/signa")
  })

  it("maps the caret through signal normalize", () => {
    expect(mapCursorThroughSignalNormalize("/signal btc", 12)).toBe(10)
    expect(mapCursorThroughSignalNormalize("/signal btc", 0)).toBe(0)
  })

  it("expands tool tag + user text to @signal only", () => {
    expect(expandComposerDraft({ tool: "signal", text: "SOL" })).toBe(
      "@signal SOL"
    )
  })

  it("does not treat mid-sentence signal wording as a tool command", () => {
    // Casual chat — must not force @signal / open the guidance modal.
    expect(expandComposerMentions("برای اتریوم سیگنال میخوام")).toBe(
      "برای اتریوم سیگنال میخوام"
    )
    expect(
      expandComposerMentions(
        "خب فکر نمیکنی داری سخت میگیری پس با نظریه تو کسی امروز معامله نکرده و سود نکرده ؟ به نظرم نباید انقد محتاط باشی و بیا با تمام قدرتت یک سیگنال خوب توی اتریوم بهم بده"
      )
    ).not.toMatch(/^@signal/i)
    expect(expandComposerMentions("Please run /signal ETH now")).toBe(
      "Please run /signal ETH now"
    )
    expect(expandComposerMentions("لطفا سیگنال BTC")).toBe("لطفا سیگنال BTC")
  })

  it("expands localized inline mentions to @signal", () => {
    expect(expandComposerMentions("/Signal ETH")).toBe("@signal ETH")
    expect(expandComposerMentions("Signal ETH")).toBe("@signal ETH")
    expect(expandComposerMentions("/سیگنال BTC")).toBe("@signal BTC")
    expect(expandComposerMentions("سیگنال BTC")).toBe("@signal BTC")
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

  it("applies mention selection by inserting a bare label token", () => {
    const result = applyMentionSelection({
      text: "check /sig",
      replaceStart: 6,
      replaceEnd: 10,
      token: "Signal ",
    })
    expect(result.nextText).toBe("check Signal ")
    expect(result.nextCursor).toBe(13)
  })

  it("highlights committed inline mention tokens", () => {
    expect(splitComposerMentionHighlights("Signal ETH")).toEqual([
      { type: "mention", value: "Signal" },
      { type: "text", value: " ETH" },
    ])
    expect(splitComposerMentionHighlights("سیگنال اتریوم")).toEqual([
      { type: "mention", value: "سیگنال" },
      { type: "text", value: " اتریوم" },
    ])
    expect(splitComposerMentionHighlights("/Signal ETH")).toEqual([
      { type: "mention", value: "/Signal" },
      { type: "text", value: " ETH" },
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
