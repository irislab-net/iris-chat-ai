import type { ChartExecutionMark, ChartOverlayLine } from "@/lib/chart/types"
import type { ChartPredictionContract } from "@/lib/chart/prediction-contract"
import type { CandleBar } from "@/lib/api/candles"

const IRIS_VIOLET = "#8b5cf6"
const IRIS_VIOLET_DIM = "rgba(139,92,246,0.35)"
const IRIS_AMBER = "#f59e0b"

export type PredictionOverlayModel = {
  lines: ChartOverlayLine[]
  marks: ChartExecutionMark[]
  predictedCandles: readonly CandleBar[]
}

/** Render backend prediction contract as chart overlays — no model inference. */
export function buildPredictionOverlay(
  contract: ChartPredictionContract | null
): PredictionOverlayModel {
  if (!contract) {
    return { lines: [], marks: [], predictedCandles: [] }
  }

  const lines: ChartOverlayLine[] = []
  const marks: ChartExecutionMark[] = []
  const { anchorPrice, confidence } = contract

  const upperMfe = anchorPrice * (1 + confidence.mfePct / 100)
  const lowerMae = anchorPrice * (1 - confidence.maePct / 100)
  const volHalf = (confidence.volPct / 100) * anchorPrice * 0.5
  const upperVol = anchorPrice + volHalf
  const lowerVol = anchorPrice - volHalf

  lines.push({
    id: `pred:${contract.uuid}:anchor`,
    price: anchorPrice,
    color: IRIS_VIOLET,
    title: `IRIS ${contract.horizon.toUpperCase()} anchor`,
    lineStyle: "solid",
  })
  lines.push({
    id: `pred:${contract.uuid}:mfe`,
    price: upperMfe,
    color: "#0ecb81",
    title: `MFE +${confidence.mfePct.toFixed(2)}%`,
    lineStyle: "dotted",
  })
  lines.push({
    id: `pred:${contract.uuid}:mae`,
    price: lowerMae,
    color: "#f6465d",
    title: `MAE -${confidence.maePct.toFixed(2)}%`,
    lineStyle: "dotted",
  })
  lines.push({
    id: `pred:${contract.uuid}:vol-up`,
    price: upperVol,
    color: IRIS_VIOLET_DIM,
    title: `Vol band`,
    lineStyle: "dashed",
  })
  lines.push({
    id: `pred:${contract.uuid}:vol-down`,
    price: lowerVol,
    color: IRIS_VIOLET_DIM,
    title: `Vol band`,
    lineStyle: "dashed",
  })

  for (const signal of contract.signals) {
    if (!signal.active) continue
    marks.push({
      id: signal.id,
      time: signal.time,
      color: signal.direction === "LONG" ? "#0ecb81" : signal.direction === "SHORT" ? "#f6465d" : IRIS_AMBER,
      text: signal.label.slice(0, 1),
      label: `${signal.label} ${(signal.confidence * 100).toFixed(0)}%`,
      labelFontColor: "#ffffff",
      minSize: 12,
    })
  }

  return {
    lines,
    marks,
    predictedCandles: contract.predictedCandles,
  }
}
