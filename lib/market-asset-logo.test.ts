import { describe, expect, it } from "vitest"

import { marketAssetLogoSrc } from "@/lib/market-asset-logo"

describe("marketAssetLogoSrc", () => {
  it("resolves tape asset logos case-insensitively", () => {
    expect(marketAssetLogoSrc("btc")).toContain("bitcoin")
    expect(marketAssetLogoSrc("ETH")).toContain("ethereum")
    expect(marketAssetLogoSrc("XAU")).toContain("gold")
    expect(marketAssetLogoSrc("DXY")).toContain("USD")
  })

  it("returns null for unknown symbols", () => {
    expect(marketAssetLogoSrc("SOL")).toBeNull()
  })
})
