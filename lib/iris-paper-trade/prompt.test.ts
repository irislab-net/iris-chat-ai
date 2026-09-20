import { describe, expect, it } from "vitest"

import { stripMarketContextAppendix } from "@/lib/iris-paper-trade/prompt"

describe("stripMarketContextAppendix", () => {
  it("removes MARKET_CONTEXT blocks from the end of messages", () => {
    const text = `BTC is consolidating near 81558.

---
MARKET_CONTEXT (authoritative evidence; asOf=2026-09-19T00:00:00.000Z):
{"symbol":"BTC","live":{"price":81558}}

Use open_paper_trade or no_trade via function call only.`
    expect(stripMarketContextAppendix(text)).toBe(
      "BTC is consolidating near 81558."
    )
  })

  it("leaves clean messages untouched", () => {
    expect(stripMarketContextAppendix("No paper trade opened.")).toBe(
      "No paper trade opened."
    )
  })
})
