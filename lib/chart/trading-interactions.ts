import {
  DRAFT_POSITION_ID,
  isValidDraftStopLoss,
  isValidDraftTakeProfit,
  projectedPnlAt,
  snapDraftPrice,
  type TradeDraft,
} from "@/lib/trading/draft"
import type { PositionSide } from "@/lib/trading/types"

export type SlTpField = "stopLoss" | "takeProfit"

export type OverlayLineDragTarget = {
  key: string
  positionId: string
  field: SlTpField
  price: number
  entryPrice: number
  quantity: number
  side: PositionSide
}

export type PendingLevelChange = {
  positionId: string
  field: SlTpField
  previousPrice: number
  nextPrice: number
  pnlUsd: number
  valid: boolean
}

export function slTpFieldLabel(field: SlTpField): "SL" | "TP" {
  return field === "stopLoss" ? "SL" : "TP"
}

export function validateSlTpPrice(
  side: PositionSide,
  entryPrice: number,
  field: SlTpField,
  price: number
): boolean {
  const ctx = { side, entryPrice }
  return field === "stopLoss"
    ? isValidDraftStopLoss(ctx, price)
    : isValidDraftTakeProfit(ctx, price)
}

export function projectedSlTpPnl(
  side: PositionSide,
  entryPrice: number,
  quantity: number,
  price: number
): number {
  return parseFloat(projectedPnlAt(side, entryPrice, quantity, price).toFixed(2))
}

export function buildPendingLevelChange(input: {
  target: OverlayLineDragTarget
  rawPrice: number
}): PendingLevelChange | null {
  const nextPrice = snapDraftPrice(input.rawPrice)
  const valid = validateSlTpPrice(
    input.target.side,
    input.target.entryPrice,
    input.target.field,
    nextPrice
  )
  if (Math.abs(nextPrice - input.target.price) < 1e-12) return null

  return {
    positionId: input.target.positionId,
    field: input.target.field,
    previousPrice: input.target.price,
    nextPrice,
    pnlUsd: projectedSlTpPnl(
      input.target.side,
      input.target.entryPrice,
      input.target.quantity,
      nextPrice
    ),
    valid,
  }
}

export function applyPendingLevelChange(input: {
  pending: PendingLevelChange
  draft: TradeDraft | null
  onDraftLevelsChange: (mods: Partial<Record<SlTpField, number | null>>) => boolean
  onModifyPosition: (
    positionId: string,
    mods: Partial<Record<SlTpField, number | null>>
  ) => boolean
}): boolean {
  if (!input.pending.valid) return false
  const { pending } = input
  if (pending.positionId === DRAFT_POSITION_ID) {
    return input.onDraftLevelsChange({ [pending.field]: pending.nextPrice })
  }
  return input.onModifyPosition(pending.positionId, { [pending.field]: pending.nextPrice })
}

/** Linear price scale helper when chart API coordinate conversion is unavailable. */
export function createLinearPriceScale(
  containerHeight: number,
  priceRange: { min: number; max: number }
) {
  const span = priceRange.max - priceRange.min
  if (!(containerHeight > 0) || !(span > 0)) {
    return {
      priceFromY: () => null as number | null,
      yFromPrice: () => null as number | null,
    }
  }
  return {
    priceFromY(y: number): number | null {
      const ratio = Math.min(1, Math.max(0, y / containerHeight))
      return priceRange.max - ratio * span
    },
    yFromPrice(price: number): number | null {
      const ratio = (priceRange.max - price) / span
      return ratio * containerHeight
    },
  }
}

export function findNearestDragTarget(
  clientY: number,
  containerTop: number,
  targets: readonly OverlayLineDragTarget[],
  yFromPrice: (price: number) => number | null,
  snapPx = 8
): OverlayLineDragTarget | null {
  const mouseY = clientY - containerTop
  let closest: { target: OverlayLineDragTarget; dist: number } | null = null

  for (const target of targets) {
    const lineY = yFromPrice(target.price)
    if (lineY == null) continue
    const dist = Math.abs(mouseY - lineY)
    if (dist <= snapPx && (!closest || dist < closest.dist)) {
      closest = { target, dist }
    }
  }
  return closest?.target ?? null
}
