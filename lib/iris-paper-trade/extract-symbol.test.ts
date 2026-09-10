import { describe, expect, it } from "vitest"

import { extractTradeSymbolFromMessage } from "@/lib/iris-paper-trade/extract-symbol"

describe("extractTradeSymbolFromMessage", () => {
  it("detects BTC", () => {
    expect(extractTradeSymbolFromMessage("Trading desk request for BTC")).toBe(
      "BTC"
    )
    expect(extractTradeSymbolFromMessage("signal بیتکوین")).toBe("BTC")
  })

  it("detects ETH", () => {
    expect(extractTradeSymbolFromMessage("Trading desk request for ETH")).toBe(
      "ETH"
    )
    expect(extractTradeSymbolFromMessage("signal اتریوم")).toBe("ETH")
  })

  it("defaults to ETH", () => {
    expect(extractTradeSymbolFromMessage("give me a trade")).toBe("ETH")
  })
})
