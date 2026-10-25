import { describe, expect, it } from "vitest"

import { marketAssetLogoSrc } from "@/lib/market-asset-logo"

describe("marketAssetLogoSrc", () => {
  it("resolves tape asset logos case-insensitively", () => {
    expect(marketAssetLogoSrc("btc")).toContain("bitcoin")
    expect(marketAssetLogoSrc("ETH")).toContain("ethereum")
    expect(marketAssetLogoSrc("SOL")).toContain("solana")
    expect(marketAssetLogoSrc("XAU")).toContain("gold")
    expect(marketAssetLogoSrc("DXY")).toContain("USD")
  })

  it("falls back to TradingView for live tickers outside the curated map", () => {
    expect(marketAssetLogoSrc("DOGE")).toContain("dogecoin")
    expect(marketAssetLogoSrc("ZEC")).toContain("XTVCZEC")
    expect(marketAssetLogoSrc("BONK")).toContain("XTVCBONK")
  })

  it("maps Hyperliquid 1000x units to the base logo", () => {
    expect(marketAssetLogoSrc("kPEPE")).toContain("pepe")
    expect(marketAssetLogoSrc("1000PEPE")).toContain("pepe")
  })

  it("returns null for empty or invalid symbols", () => {
    expect(marketAssetLogoSrc("")).toBeNull()
    expect(marketAssetLogoSrc("!!")).toBeNull()
  })
})
