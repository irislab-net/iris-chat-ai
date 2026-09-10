import { describe, expect, it } from "vitest"

import { assessPositionHealth } from "@/lib/chart/position-health"
import type { Position } from "@/lib/trading/types"

function samplePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: "p1",
    symbol: "ETH",
    side: "LONG",
    quantity: "1",
    entryPrice: "3400",
    markPrice: "3300",
    unrealizedPnl: "-100",
    realizedPnl: "0",
    marginUsed: "680",
    marginMode: "CROSS",
    leverage: { value: 5, max: 50 },
    stopLoss: null,
    takeProfit: null,
    liquidationPrice: "3250",
    liquidationStatus: "NONE",
    isolatedMargin: null,
    openedAt: Date.now(),
    ...overrides,
  }
}

describe("position health", () => {
  it("flags positions near liquidation", () => {
    const health = assessPositionHealth(samplePosition(), 3260)
    expect(health.level).toBe("at_risk")
  })

  it("marks stable positions as healthy", () => {
    const health = assessPositionHealth(
      samplePosition({
        markPrice: "3450",
        unrealizedPnl: "50",
        liquidationPrice: "2800",
      }),
      3450
    )
    expect(health.level).toBe("healthy")
  })
})
