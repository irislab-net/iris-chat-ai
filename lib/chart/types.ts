import type { CandleBar } from "@/lib/api/candles"
import type { PredictionHorizon } from "@/lib/chart/prediction-contract"
import type { ChartPredictionContract } from "@/lib/chart/prediction-contract"
import type { TradeDraft, TradeInteractionMode } from "@/lib/trading/draft"
import type { ClosedTrade, Fill, Order, Position } from "@/lib/trading/types"

/** Shared chart surface — engine-agnostic props for Demo and Real modes. */
export type TradingChartProps = {
  symbol: string
  timeframe: string
  candles: CandleBar[]
  positions: Position[]
  openOrders: Order[]
  fills: Fill[]
  history: ClosedTrade[]
  draft: TradeDraft | null
  interactionMode: TradeInteractionMode
  liquidationPrice?: number | null
  /** Backend prediction contract for the active horizon (render-only). */
  prediction?: ChartPredictionContract | null
  predictionHorizon?: PredictionHorizon
  enabledPredictionHorizons?: readonly PredictionHorizon[]
  onPredictionHorizonChange?: (horizon: PredictionHorizon) => void
  onInteractionModeChange: (mode: TradeInteractionMode) => void
  onDraftLevelsChange: (mods: {
    stopLoss?: number | null
    takeProfit?: number | null
  }) => boolean
  onModifyPosition: (
    positionId: string,
    mods: { takeProfit?: number | null; stopLoss?: number | null }
  ) => boolean
  onClearLevel: (field: "stopLoss" | "takeProfit") => void
  /** IRIS copilot horizontal lines merged into the overlay model. */
  extraOverlayLines?: ChartOverlayLine[]
  className?: string
}

export type ChartEngine = "tradingview" | "lightweight"

/** TradingView chart mark (execution marker on bars). */
export type ChartExecutionMark = {
  id: string
  time: number
  color: string
  text: string
  label: string
  labelFontColor: string
  minSize: number
}

export type ChartOverlayLineKind =
  | "entry"
  | "average-entry"
  | "mark"
  | "stop-loss"
  | "take-profit"
  | "liquidation"
  | "open-order"
  | "prediction"
  | "support"
  | "resistance"
  | "trendline"
  | "ghost-entry"
  | "ghost-stop-loss"
  | "ghost-take-profit"
  | "preview-stop-loss"
  | "preview-take-profit"

/** Horizontal overlay line descriptor (entry / SL / TP / liq / orders / prediction). */
export type ChartOverlayLine = {
  id: string
  price: number
  color: string
  title: string
  lineStyle: "solid" | "dashed" | "dotted"
  kind?: ChartOverlayLineKind
  draggable?: boolean
  field?: "stopLoss" | "takeProfit"
  positionId?: string
  entryPrice?: number
  quantity?: number
  side?: Position["side"]
}

export type ChartOverlayModel = {
  lines: ChartOverlayLine[]
  marks: ChartExecutionMark[]
  predictedCandles: readonly CandleBar[]
}
