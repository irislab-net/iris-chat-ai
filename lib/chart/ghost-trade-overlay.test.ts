import { describe, expect, it } from "vitest"

import { buildGhostTradeOverlayLines } from "@/lib/chart/ghost-trade-overlay"

describe("ghost trade overlay", () => {
  it("builds entry, sl, and tp ghost lines", () => {
    const lines = buildGhostTradeOverlayLines({
      id: "ghost-1",
      symbol: "ETH",
      side: "LONG",
      entryPrice: 3400,
      quantity: 1,
      stopLoss: 3300,
      takeProfit: 3600,
      label: "IRIS proposal",
    })

    expect(lines).toHaveLength(3)
    expect(lines[0]?.kind).toBe("ghost-entry")
    expect(lines[1]?.kind).toBe("ghost-stop-loss")
    expect(lines[2]?.kind).toBe("ghost-take-profit")
  })
})
