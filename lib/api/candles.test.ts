import { describe, expect, it } from "vitest"

import { hyperliquidCoin } from "@/lib/api/candles"

describe("hyperliquidCoin", () => {
  it("maps symbols used for signal market context", () => {
    expect(hyperliquidCoin("ETH")).toBe("ETH")
    expect(hyperliquidCoin("BTC")).toBe("BTC")
    expect(hyperliquidCoin("SOL")).toBe("SOL")
    expect(hyperliquidCoin("XAU")).toBe("PAXG")
  })
})
