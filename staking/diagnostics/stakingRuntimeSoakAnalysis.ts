import type {
  StakingRuntimeSoakEventType,
  StakingRuntimeSoakTimelineEvent,
} from "@/staking/diagnostics/stakingRuntimeSoakTypes"

export type { StakingRuntimeSoakTimelineEvent }

export type RuntimeSoakTimelineVerdict = "stable" | "warning" | "unstable"

export type RuntimeSoakTimelineMetrics = Readonly<{
  swapFrequencyPerMin: number
  reconnectDensityPerMin: number
  avgHydrationMs: number | null
  maxHydrationDurationMs: number
  contaminationCount: number
  driftCount: number
  instabilityBursts: number
  eventSpanMs: number
  swapCount: number
  reconnectEdgeCount: number
}>

export type RuntimeSoakTimelineAnalysis = Readonly<{
  verdict: RuntimeSoakTimelineVerdict
  metrics: RuntimeSoakTimelineMetrics
  notes: string[]
}>

const INSTABILITY_EVENT_TYPES = new Set<StakingRuntimeSoakEventType>([
  "hydration_stall",
  "transition_churn",
  "identity_drift",
])

const BURST_WINDOW_MS = 30_000
const BURST_MIN_EVENTS = 2

/** Acceptable thresholds — align with docs/staking-runtime-wallet-migration-status.md */
export const RUNTIME_SOAK_ANALYSIS_THRESHOLDS = {
  maxHydrationMsWarning: 8_000,
  maxHydrationMsUnstable: 10_000,
  swapFrequencyPerMinWarning: 4,
  swapFrequencyPerMinUnstable: 8,
  reconnectDensityPerMinWarning: 6,
  reconnectDensityPerMinUnstable: 12,
  contaminationWarning: 1,
  instabilityBurstsUnstable: 2,
} as const

function eventSpanMs(events: readonly StakingRuntimeSoakTimelineEvent[]): number {
  if (events.length < 2) return 0
  const first = events[0]?.atMs ?? 0
  const last = events[events.length - 1]?.atMs ?? first
  return Math.max(0, last - first)
}

function perMinute(count: number, spanMs: number): number {
  if (spanMs <= 0) return count > 0 ? count : 0
  return (count / spanMs) * 60_000
}

function computeHydrationDurations(
  events: readonly StakingRuntimeSoakTimelineEvent[]
): { avgMs: number | null; maxMs: number } {
  const durations: number[] = []
  let openAt: number | null = null

  for (const e of events) {
    if (e.type === "hydration_stall") {
      const stall = e.detail?.stallMs
      if (typeof stall === "number" && Number.isFinite(stall)) {
        durations.push(stall)
      }
      continue
    }
    if (e.type === "vault_not_ready") {
      if (openAt == null) openAt = e.atMs
      continue
    }
    if (e.type === "vault_ready" && openAt != null) {
      durations.push(Math.max(0, e.atMs - openAt))
      openAt = null
    }
  }

  if (durations.length === 0) {
    return { avgMs: null, maxMs: 0 }
  }
  const sum = durations.reduce((a, b) => a + b, 0)
  return {
    avgMs: sum / durations.length,
    maxMs: Math.max(...durations),
  }
}

function countInstabilityBursts(
  events: readonly StakingRuntimeSoakTimelineEvent[]
): number {
  const instabilityTimes = events
    .filter(e => INSTABILITY_EVENT_TYPES.has(e.type))
    .map(e => e.atMs)
    .sort((a, b) => a - b)

  if (instabilityTimes.length < BURST_MIN_EVENTS) return 0

  let bursts = 0
  let windowStart = 0
  for (let i = 0; i < instabilityTimes.length; i++) {
    while (
      instabilityTimes[i]! - instabilityTimes[windowStart]! >
      BURST_WINDOW_MS
    ) {
      windowStart++
    }
    const count = i - windowStart + 1
    if (count >= BURST_MIN_EVENTS) {
      bursts++
      windowStart = i + 1
    }
  }
  return bursts
}

/**
 * DEV-only soak summary: derive stability verdict and convergence-oriented metrics from a timeline.
 */
export function analyzeRuntimeSoakTimeline(
  events: readonly StakingRuntimeSoakTimelineEvent[]
): RuntimeSoakTimelineAnalysis {
  const spanMs = eventSpanMs(events)
  const swapCount = events.filter(e => e.type === "runtime_swap").length
  const reconnectEdgeCount = events.filter(
    e => e.type === "wallet_connect" || e.type === "wallet_disconnect"
  ).length
  const contaminationCount = events.filter(
    e => e.type === "contamination_disconnect"
  ).length
  const driftCount = events.filter(e => e.type === "identity_drift").length
  const hydration = computeHydrationDurations(events)
  const instabilityBursts = countInstabilityBursts(events)

  const metrics: RuntimeSoakTimelineMetrics = {
    swapFrequencyPerMin: perMinute(swapCount, spanMs),
    reconnectDensityPerMin: perMinute(reconnectEdgeCount, spanMs),
    avgHydrationMs: hydration.avgMs,
    maxHydrationDurationMs: hydration.maxMs,
    contaminationCount,
    driftCount,
    instabilityBursts,
    eventSpanMs: spanMs,
    swapCount,
    reconnectEdgeCount,
  }

  const notes: string[] = []
  const t = RUNTIME_SOAK_ANALYSIS_THRESHOLDS

  let verdict: RuntimeSoakTimelineVerdict = "stable"

  const hasHydrationStall = events.some(e => e.type === "hydration_stall")
  const hasTransitionChurn = events.some(e => e.type === "transition_churn")

  if (
    hasHydrationStall ||
    hasTransitionChurn ||
    metrics.maxHydrationDurationMs > t.maxHydrationMsUnstable ||
    metrics.swapFrequencyPerMin > t.swapFrequencyPerMinUnstable ||
    metrics.reconnectDensityPerMin > t.reconnectDensityPerMinUnstable ||
    instabilityBursts >= t.instabilityBurstsUnstable
  ) {
    verdict = "unstable"
    if (hasHydrationStall) notes.push("hydration_stall observed")
    if (hasTransitionChurn) notes.push("transition_churn observed")
    if (metrics.maxHydrationDurationMs > t.maxHydrationMsUnstable) {
      notes.push(`max hydration ${Math.round(metrics.maxHydrationDurationMs)}ms`)
    }
    if (instabilityBursts >= t.instabilityBurstsUnstable) {
      notes.push(`instability bursts=${instabilityBursts}`)
    }
  } else if (
    contaminationCount >= t.contaminationWarning ||
    driftCount > 0 ||
    metrics.maxHydrationDurationMs > t.maxHydrationMsWarning ||
    (metrics.avgHydrationMs != null &&
      metrics.avgHydrationMs > t.maxHydrationMsWarning) ||
    metrics.swapFrequencyPerMin > t.swapFrequencyPerMinWarning ||
    metrics.reconnectDensityPerMin > t.reconnectDensityPerMinWarning ||
    instabilityBursts > 0
  ) {
    verdict = "warning"
    if (contaminationCount > 0) notes.push(`contamination=${contaminationCount}`)
    if (driftCount > 0) notes.push(`identity_drift=${driftCount}`)
    if (instabilityBursts > 0) notes.push(`instability bursts=${instabilityBursts}`)
  }

  return { verdict, metrics, notes }
}
