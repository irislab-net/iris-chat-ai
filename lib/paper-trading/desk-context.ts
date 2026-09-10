/** Cross-tree desk context sync (workspace → chat client_context). */

import type { PredictionHorizon } from "@/lib/chart/prediction-contract"
import type { PositionSide } from "@/lib/trading/types"

const DESK_CONTEXT_SYNC = "iris:desk-context-sync"

export type DeskOpenPositionSummary = {
  id: string
  symbol: string
  side: PositionSide
  quantity: number
  entryPrice: number
  markPrice: number
  stopLoss: number | null
  takeProfit: number | null
  leverage: number
  marginMode: "CROSS" | "ISOLATED"
  unrealizedPnl: number
}

export type DeskDraftSummary = {
  side: PositionSide
  quantity: number
  stopLoss: number | null
  takeProfit: number | null
} | null

export type DeskPaperAccountSummary = {
  startingBalance: number
  balance: number
  equity: number
  availableBalance: number
  riskPerTradeUsd: number
  riskFraction: number
}

export type DeskContextSnapshot = {
  symbol: string
  timeframe: string
  predictionHorizon: PredictionHorizon | null
  openPositions: DeskOpenPositionSummary[]
  draft: DeskDraftSummary
  markPrice: number | null
  paperAccount?: DeskPaperAccountSummary | null
}

function broadcastDeskContext(snapshot: DeskContextSnapshot): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<DeskContextSnapshot>(DESK_CONTEXT_SYNC, {
      detail: snapshot,
    })
  )
}

function subscribeDeskContextSync(
  handler: (snapshot: DeskContextSnapshot) => void
): () => void {
  const onSync = (event: Event) => {
    const detail = (event as CustomEvent<DeskContextSnapshot>).detail
    if (!detail) return
    handler(detail)
  }
  window.addEventListener(DESK_CONTEXT_SYNC, onSync)
  return () => window.removeEventListener(DESK_CONTEXT_SYNC, onSync)
}

export { broadcastDeskContext, subscribeDeskContextSync }
