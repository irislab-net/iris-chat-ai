/**
 * Lightweight counters for staking refresh path (no hot-path console).
 * Ring buffers optional; primary surface is monotonic counters for dev/support.
 */

const ringMax = 64
const recentWs: string[] = []

let refreshStarted = 0
let refreshCompleted = 0
let refreshSkipped = 0
let inflightMax = 0
let timeoutCount = 0
let ethCallCount = 0
let multicallBatchCount = 0
let wsTransitionCount = 0
let backpressureActivations = 0
const coalesceByClass: Record<string, number> = {}

export function stakingMetricsRefreshStarted() {
  refreshStarted += 1
}

export function stakingMetricsRefreshCompleted() {
  refreshCompleted += 1
}

export function stakingMetricsRefreshSkipped() {
  refreshSkipped += 1
}

export function stakingMetricsInflightMax(n: number) {
  if (n > inflightMax) inflightMax = n
}

export function stakingMetricsTimeout() {
  timeoutCount += 1
}

export function stakingMetricsEthCall(n = 1) {
  ethCallCount += n
}

export function stakingMetricsMulticallBatch() {
  multicallBatchCount += 1
}

export function stakingMetricsCoalesced(className: string) {
  coalesceByClass[className] = (coalesceByClass[className] ?? 0) + 1
}

export function stakingMetricsBackpressure() {
  backpressureActivations += 1
}

export function stakingMetricsWsTransition(state: string) {
  wsTransitionCount += 1
  recentWs.push(`${Math.round(performance.now())}:${state}`)
  if (recentWs.length > ringMax) recentWs.splice(0, recentWs.length - ringMax)
}

export function getStakingRefreshMetricsSnapshot() {
  return {
    refreshStarted,
    refreshCompleted,
    refreshSkipped,
    inflightMax,
    timeoutCount,
    ethCallCount,
    multicallBatchCount,
    wsTransitionCount,
    backpressureActivations,
    coalesceByClass: { ...coalesceByClass },
    recentWs: [...recentWs],
  }
}
