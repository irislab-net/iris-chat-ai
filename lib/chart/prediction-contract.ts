import type { CandleBar } from "@/lib/api/candles"
import type { Prediction } from "@/lib/api/types"

/** Backend-owned prediction horizons exposed on the chart. */
export type PredictionHorizon = "24h" | "4h" | "1m"

/** AI model signal rendered as a chart mark — derived from backend classifiers. */
export type ChartAiSignal = {
  id: string
  model: "long" | "short" | "breakout" | "fast"
  time: number
  direction: "LONG" | "SHORT" | "NEUTRAL"
  confidence: number
  active: boolean
  label: string
}

/**
 * Chart prediction contract — frontend renders only; never synthesizes model output.
 * `predictedCandles` must be supplied by the backend when available.
 */
export type ChartPredictionContract = {
  uuid: string
  symbol: string
  horizon: PredictionHorizon
  anchorPrice: number
  anchorTime: number
  /** Projected OHLC path from backend (empty until API ships candle series). */
  predictedCandles: readonly CandleBar[]
  confidence: {
    mfePct: number
    maePct: number
    volPct: number
    rewardRisk: number
  }
  signals: readonly ChartAiSignal[]
}

const HORIZON_MS: Record<PredictionHorizon, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
}

function signalFromClassifier(
  model: ChartAiSignal["model"],
  classifier: Prediction["classifiers"]["long"],
  anchorTime: number
): ChartAiSignal {
  const direction: ChartAiSignal["direction"] = classifier.policy_signal
    ? classifier.p >= classifier.p0
      ? "LONG"
      : "SHORT"
    : "NEUTRAL"
  return {
    id: `signal:${model}:${anchorTime}`,
    model,
    time: Math.floor(anchorTime / 1000),
    direction,
    confidence: classifier.p,
    active: classifier.policy_signal,
    label: model.toUpperCase(),
  }
}

/** Map backend Prediction API payload → chart rendering contract. */
export function mapPredictionToChartContract(input: {
  prediction: Prediction
  symbol: string
  horizon: PredictionHorizon
  anchorPrice: number
  /** Optional backend-supplied projected candles for this horizon. */
  predictedCandles?: readonly CandleBar[]
}): ChartPredictionContract | null {
  const { prediction, symbol, horizon, anchorPrice } = input
  if (!(anchorPrice > 0)) return null

  const key = symbol.trim().toUpperCase()
  const market = prediction.market.trim().toUpperCase()
  if (market !== key && !market.includes(key)) return null

  const anchorTime = prediction.timestamp || prediction.created_at
  const { mfe, mae, vol, rr } = prediction.geometry

  return {
    uuid: prediction.uuid,
    symbol: key,
    horizon,
    anchorPrice,
    anchorTime,
    predictedCandles: input.predictedCandles ?? [],
    confidence: {
      mfePct: mfe,
      maePct: mae,
      volPct: vol * 100,
      rewardRisk: rr,
    },
    signals: [
      signalFromClassifier("long", prediction.classifiers.long, anchorTime),
      signalFromClassifier("short", prediction.classifiers.short, anchorTime),
      signalFromClassifier("breakout", prediction.classifiers.breakout, anchorTime),
      signalFromClassifier("fast", prediction.classifiers.fast, anchorTime),
    ],
  }
}

export function horizonDurationMs(horizon: PredictionHorizon): number {
  return HORIZON_MS[horizon]
}

export function pickPredictionForHorizon(
  predictions: readonly Prediction[],
  symbol: string,
  _horizon: PredictionHorizon
): Prediction | null {
  const key = symbol.trim().toUpperCase()
  const matches = predictions.filter((item) => {
    const market = item.market.trim().toUpperCase()
    return market === key || market.includes(key)
  })
  if (matches.length === 0) return null
  // Until backend tags horizons explicitly, use latest prediction for each horizon slot.
  return matches.sort((a, b) => b.created_at - a.created_at)[0] ?? null
}
