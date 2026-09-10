import { describe, expect, it, vi } from "vitest"

import {
  applyPendingLevelChange,
  buildPendingLevelChange,
  createLinearPriceScale,
  findNearestDragTarget,
  validateSlTpPrice,
} from "@/lib/chart/trading-interactions"
import { DRAFT_POSITION_ID } from "@/lib/trading/draft"

describe("SL/TP interaction helpers", () => {
  it("validates long stop loss below entry", () => {
    expect(validateSlTpPrice("LONG", 2000, "stopLoss", 1900)).toBe(true)
    expect(validateSlTpPrice("LONG", 2000, "stopLoss", 2100)).toBe(false)
  })

  it("builds pending level change on drag release", () => {
    const pending = buildPendingLevelChange({
      target: {
        key: "paper:ETH:sl",
        positionId: "paper:ETH",
        field: "stopLoss",
        price: 1900,
        entryPrice: 2000,
        quantity: 1,
        side: "LONG",
      },
      rawPrice: 1850,
    })
    expect(pending?.nextPrice).toBe(1850)
    expect(pending?.valid).toBe(true)
  })

  it("commits draft level changes through adapter callbacks only", () => {
    const onDraftLevelsChange = vi.fn(() => true)
    const ok = applyPendingLevelChange({
      pending: {
        positionId: DRAFT_POSITION_ID,
        field: "takeProfit",
        previousPrice: 2200,
        nextPrice: 2250,
        pnlUsd: 250,
        valid: true,
      },
      draft: {
        side: "LONG",
        quantity: 1,
        entryPrice: 2000,
        stopLoss: null,
        takeProfit: 2200,
      },
      onDraftLevelsChange,
      onModifyPosition: vi.fn(() => true),
    })
    expect(ok).toBe(true)
    expect(onDraftLevelsChange).toHaveBeenCalledWith({ takeProfit: 2250 })
  })

  it("finds nearest draggable target within snap distance", () => {
    const target = findNearestDragTarget(
      108,
      100,
      [
        {
          key: "paper:ETH:sl",
          positionId: "paper:ETH",
          field: "stopLoss",
          price: 1900,
          entryPrice: 2000,
          quantity: 1,
          side: "LONG",
        },
      ],
      (price) => (price === 1900 ? 8 : null)
    )
    expect(target?.field).toBe("stopLoss")
  })

  it("maps y coordinates to prices with linear scale", () => {
    const scale = createLinearPriceScale(100, { min: 1900, max: 2100 })
    expect(scale.priceFromY(0)).toBeCloseTo(2100)
    expect(scale.priceFromY(100)).toBeCloseTo(1900)
  })
})
