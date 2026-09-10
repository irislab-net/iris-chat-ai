import { describe, expect, it } from "vitest"

import { hyperliquidCoin, mergeCandleUpdate, type CandleBar } from "@/lib/api/candles"

const bar = (t: number, c: number): CandleBar => ({
  t,
  o: c,
  h: c + 1,
  l: c - 1,
  c,
})

describe("hyperliquidCoin", () => {
  it("maps desk markets that can hold concurrent paper positions", () => {
    expect(hyperliquidCoin("ETH")).toBe("ETH")
    expect(hyperliquidCoin("BTC")).toBe("BTC")
    expect(hyperliquidCoin("SOL")).toBe("SOL")
    expect(hyperliquidCoin("XAU")).toBe("PAXG")
  })
})

describe("mergeCandleUpdate", () => {
  it("updates the forming candle in place", () => {
    const next = mergeCandleUpdate([bar(1, 10), bar(2, 11)], bar(2, 12))
    expect(next).toHaveLength(2)
    expect(next[1].c).toBe(12)
  })

  it("appends a newer candle and respects limit", () => {
    const seed = [bar(1, 10), bar(2, 11)]
    const next = mergeCandleUpdate(seed, bar(3, 13), 2)
    expect(next).toHaveLength(2)
    expect(next[0].t).toBe(2)
    expect(next[1].t).toBe(3)
  })
})
