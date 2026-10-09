import { DEBUG_LOGS } from "@/config/env"
import { logger } from "@/lib/logger"
import { useSyncExternalStore } from "react"

/**
 * Latency metrics + adaptive auto-tuning for staking gas estimation UX.
 *
 * Module-scoped singleton (NO React state, NO context, NO storage).
 * Drives the smoothing layer (debounce, min-display, alphas) without ever
 * surfacing latency to the user. See §18 / §19 / §20 of the staking-form-ux
 * refinement plan for the full contract.
 */

export type StakingGasTuningMode = "fast" | "normal" | "slow"

export type StakingGasTuning = {
  debounceMs: number
  minDisplayMs: number
  alphaSmall: number
  alphaLarge: number
  smoothingThresholdBps: number
}

export type StakingGasMetricsSample = {
  latencyMs: number
  renderDelayMs: number
  endToEndMs: number
}

export type StakingGasMetricsSnapshot = {
  avgLatencyMs: number
  maxLatencyMs: number
  p95LatencyMs: number
  sampleCount: number
  tuningMode: StakingGasTuningMode
}

export const TUNING: Record<StakingGasTuningMode, StakingGasTuning> = {
  fast: {
    debounceMs: 250,
    minDisplayMs: 600,
    alphaSmall: 3500,
    alphaLarge: 1500,
    smoothingThresholdBps: 300,
  },
  normal: {
    debounceMs: 400,
    minDisplayMs: 1000,
    alphaSmall: 2500,
    alphaLarge: 800,
    smoothingThresholdBps: 300,
  },
  slow: {
    debounceMs: 600,
    minDisplayMs: 1300,
    alphaSmall: 1500,
    alphaLarge: 500,
    smoothingThresholdBps: 600,
  },
}

const WINDOW = 25
const MIN_SAMPLES = 5

const state: {
  samples: number[]
  avg: number
  max: number
  p95: number
  sampleCount: number
  tuningMode: StakingGasTuningMode
  lastMode: StakingGasTuningMode
} = {
  samples: [],
  avg: 0,
  max: 0,
  p95: 0,
  sampleCount: 0,
  tuningMode: "normal",
  lastMode: "normal",
}

const listeners = new Set<() => void>()

function computeSnapshot(): StakingGasMetricsSnapshot {
  return {
    avgLatencyMs: state.avg,
    maxLatencyMs: state.max,
    p95LatencyMs: state.p95,
    sampleCount: state.sampleCount,
    tuningMode: state.tuningMode,
  }
}

let snapshot: StakingGasMetricsSnapshot = computeSnapshot()

function deriveTuningMode(
  avg: number,
  last: StakingGasTuningMode,
  count: number
): StakingGasTuningMode {
  if (count < MIN_SAMPLES) return "normal"

  switch (last) {
    case "fast":
      if (avg > 350) return avg > 950 ? "slow" : "normal"
      return "fast"
    case "normal":
      if (avg < 250) return "fast"
      if (avg > 950) return "slow"
      return "normal"
    case "slow":
      if (avg < 850) return avg < 250 ? "fast" : "normal"
      return "slow"
  }
}

function attachDevDebug(): void {
  if (!DEBUG_LOGS) return
  ;(window as unknown as { __stakingGasDebug?: object }).__stakingGasDebug =
    Object.freeze({
      avgLatencyMs: state.avg,
      maxLatencyMs: state.max,
      p95LatencyMs: state.p95,
      sampleCount: state.sampleCount,
      tuningMode: state.tuningMode,
    })
  if (state.sampleCount % 5 === 0) {
    logger.log(
      `[gas] avg=${state.avg.toFixed(0)}ms p95=${state.p95.toFixed(0)}ms n=${state.sampleCount} mode=${state.tuningMode}`
    )
  }
}

/**
 * Insert a new latency sample, recompute aggregates, derive tuning mode with
 * hysteresis. Notifies subscribers ONLY when `tuningMode` flips.
 */
export function recordStakingGasMetric(input: StakingGasMetricsSample): void {
  const { latencyMs } = input
  if (!Number.isFinite(latencyMs) || latencyMs < 0) return

  state.samples.push(latencyMs)
  if (state.samples.length > WINDOW) state.samples.shift()
  state.sampleCount += 1

  let sum = 0
  let mx = 0
  for (let i = 0; i < state.samples.length; i++) {
    const v = state.samples[i]
    sum += v
    if (v > mx) mx = v
  }
  state.avg = sum / state.samples.length
  state.max = mx

  // §20.8 (optional optimization, applied):
  // - First qualifying sample (when sampleCount crosses MIN_SAMPLES): compute p95.
  // - Otherwise compute every 5 inserts. Between, retain the previous p95.
  // - avg / max still update every insert.
  const justCrossedMinSamples =
    state.sampleCount === MIN_SAMPLES || state.sampleCount === MIN_SAMPLES + 0
  const onCadence = state.sampleCount % 5 === 0
  if (state.sampleCount < MIN_SAMPLES) {
    state.p95 = 0
  } else if (justCrossedMinSamples || onCadence) {
    const sorted = state.samples.slice().sort((a, b) => a - b)
    const idx = Math.floor(0.95 * (sorted.length - 1))
    state.p95 = sorted[idx] ?? 0
  }

  const nextMode = deriveTuningMode(state.avg, state.lastMode, state.sampleCount)
  if (nextMode !== state.tuningMode) {
    state.tuningMode = nextMode
    state.lastMode = nextMode
    snapshot = computeSnapshot()
    for (const l of listeners) l()
  }

  if (DEBUG_LOGS) attachDevDebug()
}

export function getStakingGasTuning(): StakingGasTuning {
  return TUNING[state.tuningMode]
}

/**
 * Public synchronous read of the metrics snapshot.
 * Required by §20.2 for explicit string-based tuningMode checks
 * (`getStakingGasMetricsSnapshot().tuningMode === "slow"`).
 */
export function getStakingGasMetricsSnapshot(): StakingGasMetricsSnapshot {
  return snapshot
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): StakingGasMetricsSnapshot {
  return snapshot
}

/**
 * React subscription. Re-renders subscribers ONLY when `tuningMode` flips
 * (snapshot reference is reassigned only on mode change).
 */
export function useStakingGasMetrics(): StakingGasMetricsSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
