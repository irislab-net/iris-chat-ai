import { projectedPnlAt } from "@/lib/trading/draft"
import type { ChartOverlayLine } from "@/lib/chart/types"
import type { PositionSide } from "@/lib/trading/types"

const GHOST_ENTRY = "rgba(99, 102, 241, 0.85)"
const GHOST_SL = "rgba(246, 70, 93, 0.7)"
const GHOST_TP = "rgba(14, 203, 129, 0.7)"

export type GhostTradePreview = {
  id: string
  symbol: string
  side: PositionSide
  entryPrice: number
  quantity: number
  stopLoss?: number | null
  takeProfit?: number | null
  label?: string
}

function pnlLabel(prefix: string, pnl: number): string {
  return `${prefix} ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`
}

/** Semi-transparent proposed trade lines shown before the user confirms. */
export function buildGhostTradeOverlayLines(
  preview: GhostTradePreview
): ChartOverlayLine[] {
  const lines: ChartOverlayLine[] = []
  const { entryPrice, quantity, side } = preview
  if (!(entryPrice > 0) || !(quantity > 0)) return lines

  const tag = preview.label?.trim() || "AI setup"
  lines.push({
    id: `${preview.id}:ghost-entry`,
    price: entryPrice,
    color: GHOST_ENTRY,
    title: `${tag} · ${side === "LONG" ? "Long" : "Short"} @ ${entryPrice.toFixed(2)}`,
    lineStyle: "dotted",
    kind: "ghost-entry",
  })

  const pnlAt = (target: number) =>
    parseFloat(projectedPnlAt(side, entryPrice, quantity, target).toFixed(2))

  const stopLoss = preview.stopLoss
  if (stopLoss != null && Number.isFinite(stopLoss) && stopLoss > 0) {
    lines.push({
      id: `${preview.id}:ghost-sl`,
      price: stopLoss,
      color: GHOST_SL,
      title: pnlLabel("Ghost SL", pnlAt(stopLoss)),
      lineStyle: "dashed",
      kind: "ghost-stop-loss",
    })
  }

  const takeProfit = preview.takeProfit
  if (takeProfit != null && Number.isFinite(takeProfit) && takeProfit > 0) {
    lines.push({
      id: `${preview.id}:ghost-tp`,
      price: takeProfit,
      color: GHOST_TP,
      title: pnlLabel("Ghost TP", pnlAt(takeProfit)),
      lineStyle: "dashed",
      kind: "ghost-take-profit",
    })
  }

  return lines
}
