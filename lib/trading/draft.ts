import type { PositionSide } from "@/lib/trading/types"

export type TradeInteractionMode =
  | "idle"
  | "placing-sl"
  | "placing-tp"
  | "dragging-sl"
  | "dragging-tp"

export type TradeDraft = {
  side: PositionSide
  quantity: number
  entryPrice: number
  stopLoss: number | null
  takeProfit: number | null
}

export const DRAFT_POSITION_ID = "__draft__"

export function projectedPnlAt(
  side: PositionSide,
  entryPrice: number,
  quantity: number,
  level: number
): number {
  return (side === "LONG" ? level - entryPrice : entryPrice - level) * quantity
}

export function isValidStopLoss(
  side: PositionSide,
  entryPrice: number,
  stopLoss: number
): boolean {
  return (
    entryPrice > 0 &&
    stopLoss > 0 &&
    (side === "LONG" ? stopLoss < entryPrice : stopLoss > entryPrice)
  )
}

export function isValidTakeProfit(
  side: PositionSide,
  entryPrice: number,
  takeProfit: number
): boolean {
  return (
    entryPrice > 0 &&
    takeProfit > 0 &&
    (side === "LONG" ? takeProfit > entryPrice : takeProfit < entryPrice)
  )
}

export function isValidDraftStopLoss(
  draft: Pick<TradeDraft, "side" | "entryPrice">,
  stopLoss: number
): boolean {
  return isValidStopLoss(draft.side, draft.entryPrice, stopLoss)
}

export function isValidDraftTakeProfit(
  draft: Pick<TradeDraft, "side" | "entryPrice">,
  takeProfit: number
): boolean {
  return isValidTakeProfit(draft.side, draft.entryPrice, takeProfit)
}

export function snapDraftPrice(price: number): number {
  if (!Number.isFinite(price)) return price
  const absolute = Math.abs(price)
  const digits = absolute >= 100 ? 2 : absolute >= 1 ? 4 : 6
  return Number(price.toFixed(digits))
}

export function commitDraftStopLoss(draft: TradeDraft, rawPrice: number): TradeDraft | null {
  const stopLoss = snapDraftPrice(rawPrice)
  return isValidStopLoss(draft.side, draft.entryPrice, stopLoss)
    ? { ...draft, stopLoss }
    : null
}

export function commitDraftTakeProfit(draft: TradeDraft, rawPrice: number): TradeDraft | null {
  const takeProfit = snapDraftPrice(rawPrice)
  return isValidTakeProfit(draft.side, draft.entryPrice, takeProfit)
    ? { ...draft, takeProfit }
    : null
}

export function clearDraftLevel(
  draft: TradeDraft,
  field: "stopLoss" | "takeProfit"
): TradeDraft {
  return { ...draft, [field]: null }
}
