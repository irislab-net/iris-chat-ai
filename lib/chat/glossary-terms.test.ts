import { describe, expect, it } from "vitest"

import {
  resolveGlossaryTerm,
  splitGlossarySegments,
} from "@/lib/chat/glossary-terms"

describe("glossary terms", () => {
  it("resolves terms case-insensitively", () => {
    expect(resolveGlossaryTerm("vwap")).toBe("VWAP")
    expect(resolveGlossaryTerm("Order Block")).toBe("Order Block")
    expect(resolveGlossaryTerm("funding   rate")).toBe("Funding Rate")
  })

  it("splits prose and prefers multi-word terms", () => {
    const segments = splitGlossarySegments(
      "Fade the Order Block after VWAP reclaim; watch ATR."
    )
    expect(segments).toEqual([
      { type: "text", value: "Fade the " },
      {
        type: "term",
        value: "Order Block",
        term: "Order Block",
        definition: expect.any(String),
      },
      { type: "text", value: " after " },
      {
        type: "term",
        value: "VWAP",
        term: "VWAP",
        definition: expect.any(String),
      },
      { type: "text", value: " reclaim; watch " },
      {
        type: "term",
        value: "ATR",
        term: "ATR",
        definition: expect.any(String),
      },
      { type: "text", value: "." },
    ])
  })

  it("leaves unmatched prose alone", () => {
    expect(splitGlossarySegments("Clean breakout above prior high.")).toEqual([
      { type: "text", value: "Clean breakout above prior high." },
    ])
  })
})
