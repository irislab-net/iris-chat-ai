import { pnlOf } from "@/lib/paper-trading/engine"
import {
  isValidStopLoss,
  isValidTakeProfit,
  snapPaperPrice,
} from "@/lib/paper-trading/levels"
import type { PaperSide } from "@/lib/paper-trading/types"

/** Chart interaction mode for Hyperliquid-style draft bracket. */
export type TradeInteractionMode =
  | "idle"
  | "placing-sl"
  | "placing-tp"
  | "dragging-sl"
  | "dragging-tp"

/**
 * Pre-submit bracket. Not persisted as an open position.
 * Entry tracks the live market mark until Open Paper Trade.
 */
export type PaperTradeDraft = {
  side: PaperSide
  quantity: number
  entryPrice: number
  stopLoss: number | null
  takeProfit: number | null
}

export const DRAFT_POSITION_ID = "__draft__"

export function createPaperTradeDraft(
  side: PaperSide,
  quantity: number,
  entryPrice: number
): PaperTradeDraft {
  return {
    side,
    quantity,
    entryPrice,
    stopLoss: null,
    takeProfit: null,
  }
}

/** Projected PnL at a level — same formula as the engine. */
export function projectedPnlAt(
  side: PaperSide,
  entryPrice: number,
  quantity: number,
  level: number
): number {
  return pnlOf(side, entryPrice, quantity, level)
}

export function isValidDraftStopLoss(
  draft: Pick<PaperTradeDraft, "side" | "entryPrice">,
  stopLoss: number
): boolean {
  return isValidStopLoss(draft.side, draft.entryPrice, stopLoss)
}

export function isValidDraftTakeProfit(
  draft: Pick<PaperTradeDraft, "side" | "entryPrice">,
  takeProfit: number
): boolean {
  return isValidTakeProfit(draft.side, draft.entryPrice, takeProfit)
}

export function snapDraftPrice(price: number): number {
  return snapPaperPrice(price)
}

/** Commit a chart-picked SL into draft, or null if geometry invalid. */
export function commitDraftStopLoss(
  draft: PaperTradeDraft,
  rawPrice: number
): PaperTradeDraft | null {
  const stopLoss = snapDraftPrice(rawPrice)
  if (!isValidDraftStopLoss(draft, stopLoss)) return null
  return { ...draft, stopLoss }
}

/** Commit a chart-picked TP into draft, or null if geometry invalid. */
export function commitDraftTakeProfit(
  draft: PaperTradeDraft,
  rawPrice: number
): PaperTradeDraft | null {
  const takeProfit = snapDraftPrice(rawPrice)
  if (!isValidDraftTakeProfit(draft, takeProfit)) return null
  return { ...draft, takeProfit }
}

/** Drag-update an existing draft level; rejects invalid geometry. */
export function dragDraftLevel(
  draft: PaperTradeDraft,
  field: "stopLoss" | "takeProfit",
  rawPrice: number
): PaperTradeDraft | null {
  const price = snapDraftPrice(rawPrice)
  if (field === "stopLoss") {
    if (!isValidDraftStopLoss(draft, price)) return null
    return { ...draft, stopLoss: price }
  }
  if (!isValidDraftTakeProfit(draft, price)) return null
  return { ...draft, takeProfit: price }
}

export function clearDraftLevel(
  draft: PaperTradeDraft,
  field: "stopLoss" | "takeProfit"
): PaperTradeDraft {
  return field === "stopLoss"
    ? { ...draft, stopLoss: null }
    : { ...draft, takeProfit: null }
}
