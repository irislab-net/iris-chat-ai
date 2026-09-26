import { describe, expect, it } from "vitest"

import {
  aboutUsdFromCryptoLabel,
  formatCountdown,
  formatCryptoAmount,
  formatUsd,
} from "@/lib/billing/crypto-format"

describe("crypto-format", () => {
  it("formats invoice crypto amounts with USDT decimals", () => {
    expect(formatCryptoAmount("800000.000000000000000000")).toBe("0.80 USDT")
    expect(formatCryptoAmount("7990000.000000000000000000")).toBe("7.99 USDT")
    expect(formatCryptoAmount("9990000.000000000000000000")).toBe("9.99 USDT")
    expect(formatCryptoAmount("19000000")).toBe("19.00 USDT")
  })

  it("formats USD amounts for invoice summaries", () => {
    expect(formatUsd(0.8)).toBe("$0.80")
    expect(formatUsd(9.99)).toBe("$9.99")
  })

  it("formats countdown timers", () => {
    expect(formatCountdown(125_000)).toBe("2:05")
    expect(formatCountdown(4_500)).toBe("0:04")
  })

  it("keeps About USD locked to the crypto amount label", () => {
    expect(aboutUsdFromCryptoLabel("19.00 USDT", 19)).toBe(19)
    expect(aboutUsdFromCryptoLabel("39.99 USDT", 19)).toBe(39.99)
    expect(aboutUsdFromCryptoLabel("bad", 19)).toBe(19)
  })
})
