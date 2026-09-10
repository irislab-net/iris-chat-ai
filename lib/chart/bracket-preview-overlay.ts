import { projectedPnlAt } from "@/lib/trading/draft"
import type { ChartOverlayLine } from "@/lib/chart/types"
import type { Position, PositionSide } from "@/lib/trading/types"
import { decimalNumber } from "@/lib/trading/types"

const PREVIEW_SL = "#f97316"
const PREVIEW_TP = "#06b6d4"

export type BracketPreviewInput = {
  id: string
  positionId: string
  symbol: string
  side: PositionSide
  entryPrice: number
  quantity: number
  stopLoss?: number | null
  takeProfit?: number | null
}

function pnlLabel(prefix: string, pnl: number): string {
  return `${prefix} ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`
}

/** Proposed SL/TP changes overlaid on an open position (before user applies). */
export function buildBracketPreviewLines(
  input: BracketPreviewInput
): ChartOverlayLine[] {
  const lines: ChartOverlayLine[] = []
  const { entryPrice, quantity, side } = input
  if (!(entryPrice > 0)) return lines

  const pnlAt = (target: number) =>
    parseFloat(projectedPnlAt(side, entryPrice, quantity, target).toFixed(2))

  const stopLoss = input.stopLoss
  if (stopLoss != null && Number.isFinite(stopLoss) && stopLoss > 0) {
    lines.push({
      id: `${input.id}:preview-sl`,
      price: stopLoss,
      color: PREVIEW_SL,
      title: pnlLabel("New SL", pnlAt(stopLoss)),
      lineStyle: "dashed",
      kind: "preview-stop-loss",
      positionId: input.positionId,
    })
  }

  const takeProfit = input.takeProfit
  if (takeProfit != null && Number.isFinite(takeProfit) && takeProfit > 0) {
    lines.push({
      id: `${input.id}:preview-tp`,
      price: takeProfit,
      color: PREVIEW_TP,
      title: pnlLabel("New TP", pnlAt(takeProfit)),
      lineStyle: "dashed",
      kind: "preview-take-profit",
      positionId: input.positionId,
    })
  }

  return lines
}

export function bracketPreviewFromPosition(
  position: Position,
  mods: { stopLoss?: number | null; takeProfit?: number | null },
  id = `bracket:${Date.now()}`
): BracketPreviewInput {
  return {
    id,
    positionId: position.id,
    symbol: position.symbol,
    side: position.side,
    entryPrice: decimalNumber(position.entryPrice),
    quantity: decimalNumber(position.quantity),
    stopLoss: mods.stopLoss,
    takeProfit: mods.takeProfit,
  }
}
