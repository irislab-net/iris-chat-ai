import { describe, expect, it } from "vitest"

import {
  mapPredictionToChartContract,
  pickPredictionForHorizon,
} from "@/lib/chart/prediction-contract"
import { buildPredictionOverlay } from "@/lib/chart/prediction-overlay"
import type { Prediction } from "@/lib/api/types"

const prediction: Prediction = {
  uuid: "pred-1",
  market: "ETH",
  timestamp: 1_700_000_000_000,
  created_at: 1_700_000_000_000,
  classifiers: {
    long: {
      p: 0.7,
      p0: 0.5,
      thr: 0.55,
      margin: 0.2,
      edge: 0.1,
      policy: 1,
      signal: true,
      policy_signal: true,
    },
    short: {
      p: 0.3,
      p0: 0.5,
      thr: 0.45,
      margin: -0.2,
      edge: -0.1,
      policy: 0,
      signal: false,
      policy_signal: false,
    },
    breakout: {
      p: 0.6,
      p0: 0.5,
      thr: 0.5,
      margin: 0.1,
      edge: 0.05,
      policy: 1,
      signal: true,
      policy_signal: true,
    },
    fast: {
      p: 0.55,
      p0: 0.5,
      thr: 0.5,
      margin: 0.05,
      edge: 0.02,
      policy: 0,
      signal: false,
      policy_signal: false,
    },
  },
  geometry: {
    vol: 0.012,
    mfe: 2.5,
    mae: 1.2,
    rr: 2.1,
  },
}

describe("prediction contract mapping", () => {
  it("maps backend prediction to a render-only chart contract", () => {
    const contract = mapPredictionToChartContract({
      prediction,
      symbol: "ETH",
      horizon: "24h",
      anchorPrice: 2000,
    })
    expect(contract?.horizon).toBe("24h")
    expect(contract?.confidence.mfePct).toBe(2.5)
    expect(contract?.signals.some((signal) => signal.active)).toBe(true)
  })

  it("picks latest prediction for symbol", () => {
    const picked = pickPredictionForHorizon([prediction], "ETH", "4h")
    expect(picked?.uuid).toBe("pred-1")
  })
})

describe("prediction overlay rendering", () => {
  it("builds confidence band lines and AI signal marks", () => {
    const contract = mapPredictionToChartContract({
      prediction,
      symbol: "ETH",
      horizon: "24h",
      anchorPrice: 2000,
    })
    const overlay = buildPredictionOverlay(contract)
    expect(overlay.lines.some((line) => line.id.includes("mfe"))).toBe(true)
    expect(overlay.lines.some((line) => line.id.includes("mae"))).toBe(true)
    expect(overlay.marks.length).toBeGreaterThan(0)
    expect(overlay.predictedCandles).toEqual([])
  })

  it("renders backend-supplied predicted candles without synthesizing", () => {
    const contract = mapPredictionToChartContract({
      prediction,
      symbol: "ETH",
      horizon: "1m",
      anchorPrice: 2000,
      predictedCandles: [{ t: 1, o: 1, h: 2, l: 1, c: 2 }],
    })
    const overlay = buildPredictionOverlay(contract)
    expect(overlay.predictedCandles).toHaveLength(1)
  })
})
