import { decimalNumber, type Position } from "@/lib/trading/types"
import { tradingPnlPct } from "@/lib/trading/format"

export type PositionHealthLevel = "healthy" | "watch" | "at_risk"

export type PositionHealth = {
  level: PositionHealthLevel
  label: string
  detail: string
  liquidationDistancePct: number | null
  pnlPct: number
}

function liquidationDistancePct(
  position: Position,
  mark: number
): number | null {
  const liq = decimalNumber(position.liquidationPrice)
  if (!(liq > 0) || !(mark > 0)) return null
  return Math.abs((mark - liq) / mark) * 100
}

/** Lightweight desk health signal for open positions — no model inference. */
export function assessPositionHealth(
  position: Position,
  mark: number
): PositionHealth {
  const pnlPct = tradingPnlPct(position.side, position.entryPrice, mark)
  const liqDist = liquidationDistancePct(position, mark)

  if (liqDist != null && liqDist < 3) {
    return {
      level: "at_risk",
      label: "At risk",
      detail: `Liquidation ~${liqDist.toFixed(1)}% away`,
      liquidationDistancePct: liqDist,
      pnlPct,
    }
  }

  if (pnlPct <= -4 || (liqDist != null && liqDist < 8)) {
    return {
      level: "watch",
      label: "Watch",
      detail:
        pnlPct <= -4
          ? `Unrealized ${pnlPct.toFixed(1)}%`
          : `Liquidation ~${liqDist!.toFixed(1)}% away`,
      liquidationDistancePct: liqDist,
      pnlPct,
    }
  }

  return {
    level: "healthy",
    label: "Healthy",
    detail: "Levels and margin look stable",
    liquidationDistancePct: liqDist,
    pnlPct,
  }
}
