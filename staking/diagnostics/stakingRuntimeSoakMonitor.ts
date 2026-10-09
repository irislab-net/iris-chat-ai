import { analyzeRuntimeSoakTimeline } from "@/staking/diagnostics/stakingRuntimeSoakAnalysis"
import {
  isDevConsoleLoggingEnabled,
  stakingDevConsoleDebug,
  stakingDevConsoleLog,
  stakingDevConsoleWarn,
} from "@/staking/diagnostics/stakingDevConsole"
import type {
  RuntimeSoakHealth,
  StakingRuntimeSoakEventType,
  StakingRuntimeSoakSample,
  StakingRuntimeSoakTimelineEvent,
} from "@/staking/diagnostics/stakingRuntimeSoakTypes"

export type {
  RuntimeSoakHealth,
  StakingRuntimeSoakEventType,
  StakingRuntimeSoakSample,
  StakingRuntimeSoakTimelineEvent,
} from "@/staking/diagnostics/stakingRuntimeSoakTypes"

export { analyzeRuntimeSoakTimeline } from "@/staking/diagnostics/stakingRuntimeSoakAnalysis"
export type {
  RuntimeSoakTimelineAnalysis,
  RuntimeSoakTimelineMetrics,
  RuntimeSoakTimelineVerdict,
} from "@/staking/diagnostics/stakingRuntimeSoakAnalysis"

const MAX_EVENTS = 100
const HYDRATION_STALL_MS = 10_000
const EXECUTION_LEAKAGE_MS = 5_000
const IDENTITY_DRIFT_MS = 2_000
const TRANSITION_CHURN_WINDOW_MS = 15_000
const TRANSITION_CHURN_THRESHOLD = 3
const RECONNECT_STORM_WINDOW_MS = 20_000
const RECONNECT_STORM_THRESHOLD = 4

type WalletNamespace = "eip155" | "runtime_wallet"

type RecoveryRecord = Readonly<{
  from: "unstable" | "degraded"
  to: "stable"
  durationMs: number
  atMs: number
}>

type SoakMonitorInternal = {
  events: StakingRuntimeSoakTimelineEvent[]
  lastSample: StakingRuntimeSoakSample | null
  lastCursor: {
    runtimeKey: string
    generation: number
    runtimeWalletConnected: boolean
    executionConnected: boolean
    executionChainId: number | null
    runtimeWalletNetworkOk: boolean
    isWrongNetwork: boolean
    vaultDataReady: boolean
    sequenceStage: string
  } | null
  runtimeSettledAtMs: number | null
  runtimeSettledKey: string | null
  hydrationStallWarnedKeys: Set<string>
  executionLeakageWarnedSession: boolean
  executionLeakageSinceMs: number | null
  identityDriftSinceMs: number | null
  identityDriftWarnedSession: boolean
  swapTimestampsMs: number[]
  transitionChurnWarnedSession: boolean
  reconnectEdges: Readonly<{ atMs: number; namespace: WalletNamespace; kind: "connect" | "disconnect" }>[]
  reconnectStormWarnedNamespaces: Set<WalletNamespace>
  activeFlags: {
    hydrationStall: boolean
    executionLeakage: boolean
    identityDrift: boolean
    transitionChurn: boolean
    reconnectStorm: boolean
  }
  lastHealth: RuntimeSoakHealth
  prevHealth: RuntimeSoakHealth
  stableSinceMs: number | null
  currentStableStreakMs: number
  longestStableStreakMs: number
  unstableSinceMs: number | null
  degradedSinceMs: number | null
  lastInstabilityReason: string | null
  recoveryRecords: RecoveryRecord[]
  instabilityCounters: {
    hydrationStalls: number
    transitionChurns: number
    contaminationDisconnects: number
    identityDrifts: number
    reconnectStorms: number
    executionLeakages: number
  }
  lastUnstableSnapshot: Readonly<{
    frozenAtMs: number
    health: RuntimeSoakHealth
    reason: string
    events: StakingRuntimeSoakTimelineEvent[]
    activeFlags: SoakMonitorInternal["activeFlags"]
    lastSample: StakingRuntimeSoakSample | null
    timelineAnalysis: ReturnType<typeof analyzeRuntimeSoakTimeline>
  }> | null
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now()
}

function isRuntimeSequenceSettled(sequenceStage: string): boolean {
  return sequenceStage === "idle" || sequenceStage === "settled"
}

function createMonitor(): SoakMonitorInternal {
  return {
    events: [],
    lastSample: null,
    lastCursor: null,
    runtimeSettledAtMs: null,
    runtimeSettledKey: null,
    hydrationStallWarnedKeys: new Set(),
    executionLeakageWarnedSession: false,
    executionLeakageSinceMs: null,
    identityDriftSinceMs: null,
    identityDriftWarnedSession: false,
    swapTimestampsMs: [],
    transitionChurnWarnedSession: false,
    reconnectEdges: [],
    reconnectStormWarnedNamespaces: new Set(),
    activeFlags: {
      hydrationStall: false,
      executionLeakage: false,
      identityDrift: false,
      transitionChurn: false,
      reconnectStorm: false,
    },
    lastHealth: "stable",
    prevHealth: "stable",
    stableSinceMs: null,
    currentStableStreakMs: 0,
    longestStableStreakMs: 0,
    unstableSinceMs: null,
    degradedSinceMs: null,
    lastInstabilityReason: null,
    recoveryRecords: [],
    instabilityCounters: {
      hydrationStalls: 0,
      transitionChurns: 0,
      contaminationDisconnects: 0,
      identityDrifts: 0,
      reconnectStorms: 0,
      executionLeakages: 0,
    },
    lastUnstableSnapshot: null,
  }
}

let monitor: SoakMonitorInternal | null = null
let soakIntervalId: number | null = null

function getMonitor(): SoakMonitorInternal | null {
  if (!(process.env.NODE_ENV !== 'production')) return null
  if (!monitor) monitor = createMonitor()
  return monitor
}

function runDurationDetectors(m: SoakMonitorInternal, sample: StakingRuntimeSoakSample): void {
  runHydrationStallDetector(m, sample)
  runExecutionLeakageDetector(m, sample)
  runIdentityDriftDetector(m, sample)
  const nextHealth = computeRuntimeSoakHealthFromMonitor(m, sample)
  observeHealthTransition(m, m.lastHealth, nextHealth, sample)
  m.prevHealth = m.lastHealth
  m.lastHealth = nextHealth
}

function ensureSoakDurationInterval(): void {
  if (!(process.env.NODE_ENV !== 'production') || typeof window === "undefined") return
  if (soakIntervalId != null) return
  soakIntervalId = window.setInterval(() => {
    const m = getMonitor()
    if (!m?.lastSample) return
    runDurationDetectors(m, m.lastSample)
  }, 1_000)
}

function pushEvent(
  m: SoakMonitorInternal,
  type: StakingRuntimeSoakEventType,
  sample: StakingRuntimeSoakSample,
  detail?: Record<string, unknown>
): void {
  const atMs = nowMs()
  m.events.push({
    atMs,
    type,
    runtimeKey: sample.runtimeKey,
    generation: sample.generation,
    chainFamily: sample.chainFamily,
    detail,
  })
  if (m.events.length > MAX_EVENTS) {
    m.events.splice(0, m.events.length - MAX_EVENTS)
  }
  if (isDevConsoleLoggingEnabled()) {
    stakingDevConsoleDebug("[staking-runtime-soak]", type, {
      runtimeKey: sample.runtimeKey,
      generation: sample.generation,
      chainFamily: sample.chainFamily,
      ...detail,
    })
  }
}

function soakWarn(code: string, detail: Record<string, unknown>): void {
  if (!isDevConsoleLoggingEnabled()) return
  stakingDevConsoleWarn(`[staking-runtime-soak] ${code}`, detail)
}

function freezeUnstableSnapshot(m: SoakMonitorInternal, reason: string): void {
  const events = [...m.events]
  const snapshot = {
    frozenAtMs: nowMs(),
    health: "unstable" as const,
    reason,
    events,
    activeFlags: { ...m.activeFlags },
    lastSample: m.lastSample,
    timelineAnalysis: analyzeRuntimeSoakTimeline(events),
  }
  m.lastUnstableSnapshot = snapshot
  if (typeof window !== "undefined") {
    window.__stakingRuntimeLastUnstableSnapshot = snapshot
  }
}

function observeHealthTransition(
  m: SoakMonitorInternal,
  prevHealth: RuntimeSoakHealth,
  nextHealth: RuntimeSoakHealth,
  sample: StakingRuntimeSoakSample
): void {
  const atMs = nowMs()

  if (prevHealth === nextHealth) {
    if (nextHealth === "stable" && m.stableSinceMs != null) {
      m.currentStableStreakMs = atMs - m.stableSinceMs
      if (m.currentStableStreakMs > m.longestStableStreakMs) {
        m.longestStableStreakMs = m.currentStableStreakMs
      }
    }
    return
  }

  if (prevHealth === "stable" && m.stableSinceMs != null) {
    const streak = atMs - m.stableSinceMs
    if (streak > m.longestStableStreakMs) {
      m.longestStableStreakMs = streak
    }
    m.stableSinceMs = null
    m.currentStableStreakMs = 0
  }

  if (nextHealth === "unstable" && prevHealth !== "unstable") {
    m.unstableSinceMs = atMs
    const reason =
      m.lastInstabilityReason ??
      inferInstabilityReason(m) ??
      "runtime_health_unstable"
    m.lastInstabilityReason = reason
    freezeUnstableSnapshot(m, reason)
    logRecoveryTelemetry("entered_unstable", {
      reason,
      runtimeKey: sample.runtimeKey,
    })
  }

  if (nextHealth === "degraded" && prevHealth !== "degraded") {
    m.degradedSinceMs = atMs
    if (!m.lastInstabilityReason) {
      m.lastInstabilityReason = "identity_drift_or_slow_hydration"
    }
  }

  if (nextHealth === "stable") {
    if (prevHealth === "unstable" && m.unstableSinceMs != null) {
      const durationMs = atMs - m.unstableSinceMs
      m.recoveryRecords.push({
        from: "unstable",
        to: "stable",
        durationMs,
        atMs,
      })
      logRecoveryTelemetry("unstable_to_stable", {
        durationMs: Math.round(durationMs),
        runtimeKey: sample.runtimeKey,
      })
      m.unstableSinceMs = null
    }
    if (prevHealth === "degraded" && m.degradedSinceMs != null) {
      const durationMs = atMs - m.degradedSinceMs
      m.recoveryRecords.push({
        from: "degraded",
        to: "stable",
        durationMs,
        atMs,
      })
      logRecoveryTelemetry("degraded_to_stable", {
        durationMs: Math.round(durationMs),
        runtimeKey: sample.runtimeKey,
      })
      m.degradedSinceMs = null
    }
    m.stableSinceMs = atMs
    m.currentStableStreakMs = 0
    m.lastInstabilityReason = null
  }
}

function inferInstabilityReason(m: SoakMonitorInternal): string | null {
  const f = m.activeFlags
  if (f.hydrationStall) return "hydration_stall"
  if (f.executionLeakage) return "execution_leakage"
  if (f.transitionChurn) return "transition_churn"
  if (f.reconnectStorm) return "reconnect_storm"
  if (f.identityDrift) return "identity_drift"
  return null
}

function logRecoveryTelemetry(
  tag: string,
  detail: Record<string, unknown>
): void {
  if (!isDevConsoleLoggingEnabled()) return
  stakingDevConsoleDebug("[staking-runtime-soak][recovery]", tag, detail)
}

function recordWalletEdge(
  m: SoakMonitorInternal,
  sample: StakingRuntimeSoakSample,
  namespace: WalletNamespace,
  kind: "connect" | "disconnect"
): void {
  const type = kind === "connect" ? "wallet_connect" : "wallet_disconnect"
  pushEvent(m, type, sample, { namespace, kind })
  const atMs = nowMs()
  m.reconnectEdges = [...m.reconnectEdges, { atMs, namespace, kind }].filter(
    e => atMs - e.atMs <= RECONNECT_STORM_WINDOW_MS
  )
  const nsEdges = m.reconnectEdges.filter(e => e.namespace === namespace)
  if (
    nsEdges.length > RECONNECT_STORM_THRESHOLD &&
    !m.reconnectStormWarnedNamespaces.has(namespace)
  ) {
    m.reconnectStormWarnedNamespaces.add(namespace)
    m.activeFlags.reconnectStorm = true
    m.instabilityCounters.reconnectStorms += 1
    m.lastInstabilityReason = `reconnect_storm:${namespace}`
    soakWarn("reconnect_storm", {
      namespace,
      edges: nsEdges.length,
      windowMs: RECONNECT_STORM_WINDOW_MS,
      runtimeKey: sample.runtimeKey,
    })
  }
}

function detectSampleDeltas(
  m: SoakMonitorInternal,
  sample: StakingRuntimeSoakSample,
  prev: NonNullable<SoakMonitorInternal["lastCursor"]>
): void {
  if (
    prev.runtimeKey !== sample.runtimeKey ||
    prev.generation !== sample.generation
  ) {
    pushEvent(m, "runtime_swap", sample, {
      fromRuntimeKey: prev.runtimeKey,
      fromGeneration: prev.generation,
    })
    const atMs = nowMs()
    m.swapTimestampsMs = [...m.swapTimestampsMs, atMs].filter(
      t => atMs - t <= TRANSITION_CHURN_WINDOW_MS
    )
    if (
      m.swapTimestampsMs.length > TRANSITION_CHURN_THRESHOLD &&
      !m.transitionChurnWarnedSession
    ) {
      m.transitionChurnWarnedSession = true
      m.activeFlags.transitionChurn = true
      m.instabilityCounters.transitionChurns += 1
      m.lastInstabilityReason = "transition_churn"
      pushEvent(m, "transition_churn", sample, {
        swaps: m.swapTimestampsMs.length,
        windowMs: TRANSITION_CHURN_WINDOW_MS,
      })
      soakWarn("transition_churn", {
        swaps: m.swapTimestampsMs.length,
        windowMs: TRANSITION_CHURN_WINDOW_MS,
      })
    }
    m.runtimeSettledKey = null
    m.runtimeSettledAtMs = null
    m.executionLeakageSinceMs = null
    m.identityDriftSinceMs = null
  }

  if (prev.executionConnected !== sample.executionConnected) {
    recordWalletEdge(
      m,
      sample,
      "eip155",
      sample.executionConnected ? "connect" : "disconnect"
    )
  }
  if (prev.runtimeWalletConnected !== sample.runtimeWalletConnected) {
    recordWalletEdge(
      m,
      sample,
      "runtime_wallet",
      sample.runtimeWalletConnected ? "connect" : "disconnect"
    )
  }

  if (
    prev.isWrongNetwork !== sample.isWrongNetwork ||
    prev.sequenceStage !== sample.sequenceStage
  ) {
    pushEvent(m, "network_change", sample, {
      isWrongNetwork: sample.isWrongNetwork,
      sequenceStage: sample.sequenceStage,
    })
  }

  if (prev.vaultDataReady !== sample.vaultDataReady) {
    pushEvent(m, sample.vaultDataReady ? "vault_ready" : "vault_not_ready", sample)
  }
}

function runHydrationStallDetector(
  m: SoakMonitorInternal,
  sample: StakingRuntimeSoakSample
): void {
  const settled = isRuntimeSequenceSettled(sample.sequenceStage)
  if (settled) {
    if (m.runtimeSettledKey !== sample.runtimeKey) {
      m.runtimeSettledKey = sample.runtimeKey
      m.runtimeSettledAtMs = nowMs()
    }
  } else {
    m.runtimeSettledKey = null
    m.runtimeSettledAtMs = null
    m.activeFlags.hydrationStall = false
    return
  }

  if (sample.vaultDataReady) {
    m.activeFlags.hydrationStall = false
    return
  }

  if (m.runtimeSettledAtMs == null) return
  const elapsed = nowMs() - m.runtimeSettledAtMs
  if (elapsed <= HYDRATION_STALL_MS) return
  if (m.hydrationStallWarnedKeys.has(sample.runtimeKey)) return

  m.hydrationStallWarnedKeys.add(sample.runtimeKey)
  m.activeFlags.hydrationStall = true
  m.instabilityCounters.hydrationStalls += 1
  m.lastInstabilityReason = "hydration_stall"
  pushEvent(m, "hydration_stall", sample, {
    stallMs: Math.round(elapsed),
    sequenceStage: sample.sequenceStage,
    lifecycle: sample.lifecycle,
  })
  soakWarn("hydration_stall", {
    runtimeKey: sample.runtimeKey,
    stallMs: Math.round(elapsed),
    sequenceStage: sample.sequenceStage,
    lifecycle: sample.lifecycle,
  })
}

function runExecutionLeakageDetector(
  m: SoakMonitorInternal,
  sample: StakingRuntimeSoakSample
): void {
  if (sample.chainFamily !== "tron" || !sample.executionConnected) {
    m.executionLeakageSinceMs = null
    m.activeFlags.executionLeakage = false
    return
  }
  const atMs = nowMs()
  if (m.executionLeakageSinceMs == null) {
    m.executionLeakageSinceMs = atMs
    return
  }
  const elapsed = atMs - m.executionLeakageSinceMs
  if (elapsed <= EXECUTION_LEAKAGE_MS) return
  if (m.executionLeakageWarnedSession) return
  m.executionLeakageWarnedSession = true
  m.activeFlags.executionLeakage = true
  m.instabilityCounters.executionLeakages += 1
  m.lastInstabilityReason = "execution_leakage"
  soakWarn("execution_leakage", {
    runtimeKey: sample.runtimeKey,
    durationMs: Math.round(elapsed),
  })
}

function runIdentityDriftDetector(
  m: SoakMonitorInternal,
  sample: StakingRuntimeSoakSample
): void {
  if (sample.chainFamily !== "evm") {
    m.identityDriftSinceMs = null
    m.activeFlags.identityDrift = false
    return
  }
  const runtimeAddr = sample.runtimeWalletAddress?.trim() ?? ""
  const execAddr = sample.executionAddress?.trim() ?? ""
  const drifting =
    sample.runtimeWalletConnected &&
    sample.executionConnected &&
    runtimeAddr !== execAddr

  if (!drifting) {
    m.identityDriftSinceMs = null
    m.activeFlags.identityDrift = false
    return
  }

  const atMs = nowMs()
  if (m.identityDriftSinceMs == null) {
    m.identityDriftSinceMs = atMs
    return
  }
  const elapsed = atMs - m.identityDriftSinceMs
  if (elapsed <= IDENTITY_DRIFT_MS) {
    m.activeFlags.identityDrift = true
    return
  }
  if (m.identityDriftWarnedSession) return
  m.identityDriftWarnedSession = true
  m.activeFlags.identityDrift = true
  m.instabilityCounters.identityDrifts += 1
  m.lastInstabilityReason = "identity_drift"
  pushEvent(m, "identity_drift", sample, {
    durationMs: Math.round(elapsed),
    runtimeWalletAddress: runtimeAddr || null,
    executionAddress: execAddr || null,
  })
  soakWarn("identity_drift", {
    runtimeKey: sample.runtimeKey,
    durationMs: Math.round(elapsed),
    runtimeWalletAddress: runtimeAddr || null,
    executionAddress: execAddr || null,
  })
}

export type RuntimeSoakConvergenceMetrics = Readonly<{
  consecutiveStableMinutes: number
  longestStableStreakMinutes: number
  currentStableStreakMs: number
  longestStableStreakMs: number
  instabilityRecoveryDurationMs: number | null
  lastRecoveryFrom: "unstable" | "degraded" | null
  recoveryRecords: readonly RecoveryRecord[]
}>

export function getRuntimeSoakConvergenceMetrics(): RuntimeSoakConvergenceMetrics {
  const m = getMonitor()
  if (!m) {
    return {
      consecutiveStableMinutes: 0,
      longestStableStreakMinutes: 0,
      currentStableStreakMs: 0,
      longestStableStreakMs: 0,
      instabilityRecoveryDurationMs: null,
      lastRecoveryFrom: null,
      recoveryRecords: [],
    }
  }

  const atMs = nowMs()
  let currentStreakMs = m.currentStableStreakMs
  if (m.lastHealth === "stable" && m.stableSinceMs != null) {
    currentStreakMs = atMs - m.stableSinceMs
    if (currentStreakMs > m.longestStableStreakMs) {
      m.longestStableStreakMs = currentStreakMs
    }
  }

  const lastRecovery = m.recoveryRecords[m.recoveryRecords.length - 1]

  return {
    consecutiveStableMinutes: currentStreakMs / 60_000,
    longestStableStreakMinutes: m.longestStableStreakMs / 60_000,
    currentStableStreakMs: currentStreakMs,
    longestStableStreakMs: m.longestStableStreakMs,
    instabilityRecoveryDurationMs: lastRecovery?.durationMs ?? null,
    lastRecoveryFrom: lastRecovery?.from ?? null,
    recoveryRecords: [...m.recoveryRecords],
  }
}

export function tickStakingRuntimeSoakMonitor(
  sample: StakingRuntimeSoakSample
): void {
  const m = getMonitor()
  if (!m) return

  const prev = m.lastCursor
  if (prev) {
    detectSampleDeltas(m, sample, prev)
  }

  m.lastCursor = {
    runtimeKey: sample.runtimeKey,
    generation: sample.generation,
    runtimeWalletConnected: sample.runtimeWalletConnected,
    executionConnected: sample.executionConnected,
    executionChainId: null,
    runtimeWalletNetworkOk: !sample.isWrongNetwork,
    isWrongNetwork: sample.isWrongNetwork,
    vaultDataReady: sample.vaultDataReady,
    sequenceStage: sample.sequenceStage,
  }
  m.lastSample = sample

  runDurationDetectors(m, sample)
  ensureSoakDurationInterval()
}

export function recordStakingRuntimeSoakContaminationDisconnect(
  detail: Readonly<{
    runtimeKey: string
    reason: string
  }>
): void {
  const m = getMonitor()
  if (!m) return
  m.instabilityCounters.contaminationDisconnects += 1
  m.lastInstabilityReason = `contamination_disconnect:${detail.reason}`
  const sample = m.lastSample
  if (!sample) {
    pushEvent(
      m,
      "contamination_disconnect",
      {
        runtimeKey: detail.runtimeKey,
        generation: 0,
        chainFamily: "tron",
        sequenceStage: "unknown",
        lifecycle: "unknown",
        vaultDataReady: false,
        runtimeWalletConnected: false,
        executionConnected: false,
        isWrongNetwork: false,
        canTransact: false,
      },
      detail
    )
    return
  }
  pushEvent(m, "contamination_disconnect", sample, detail)
}

export function dumpStakingRuntimeSoakMonitor(): Readonly<{
  health: RuntimeSoakHealth
  events: StakingRuntimeSoakTimelineEvent[]
  activeFlags: SoakMonitorInternal["activeFlags"]
  lastSample: StakingRuntimeSoakSample | null
  timelineAnalysis: ReturnType<typeof analyzeRuntimeSoakTimeline>
  convergence: RuntimeSoakConvergenceMetrics
  instabilityCounters: SoakMonitorInternal["instabilityCounters"]
  lastInstabilityReason: string | null
}> {
  const m = getMonitor()
  if (!m) {
    return {
      health: "stable",
      events: [],
      activeFlags: {
        hydrationStall: false,
        executionLeakage: false,
        identityDrift: false,
        transitionChurn: false,
        reconnectStorm: false,
      },
      lastSample: null,
      timelineAnalysis: analyzeRuntimeSoakTimeline([]),
      convergence: getRuntimeSoakConvergenceMetrics(),
      instabilityCounters: {
        hydrationStalls: 0,
        transitionChurns: 0,
        contaminationDisconnects: 0,
        identityDrifts: 0,
        reconnectStorms: 0,
        executionLeakages: 0,
      },
      lastInstabilityReason: null,
    }
  }
  const events = [...m.events]
  const health = m.lastSample
    ? computeRuntimeSoakHealthFromMonitor(m, m.lastSample)
    : m.lastHealth
  return {
    health,
    events,
    activeFlags: { ...m.activeFlags },
    lastSample: m.lastSample,
    timelineAnalysis: analyzeRuntimeSoakTimeline(events),
    convergence: getRuntimeSoakConvergenceMetrics(),
    instabilityCounters: { ...m.instabilityCounters },
    lastInstabilityReason: m.lastInstabilityReason,
  }
}

function computeRuntimeSoakHealthFromMonitor(
  m: SoakMonitorInternal,
  sample: StakingRuntimeSoakSample
): RuntimeSoakHealth {
  const flags = m.activeFlags
  if (
    flags.hydrationStall ||
    flags.executionLeakage ||
    flags.transitionChurn ||
    flags.reconnectStorm
  ) {
    return "unstable"
  }
  if (flags.identityDrift) {
    return "degraded"
  }

  const settled = isRuntimeSequenceSettled(sample.sequenceStage)
  if (!settled) {
    return "warming"
  }

  if (!sample.vaultDataReady && m.runtimeSettledAtMs != null) {
    const warmingMs = nowMs() - m.runtimeSettledAtMs
    if (warmingMs < HYDRATION_STALL_MS * 0.3) return "warming"
    if (warmingMs < HYDRATION_STALL_MS) return "degraded"
    return "unstable"
  }

  const recentSwap = m.swapTimestampsMs.some(t => nowMs() - t < 5_000)
  if (recentSwap) return "warming"

  return "stable"
}

export function getRuntimeSoakHealth(): RuntimeSoakHealth {
  if (!(process.env.NODE_ENV !== 'production')) return "stable"
  const m = getMonitor()
  if (!m?.lastSample) return "stable"
  return computeRuntimeSoakHealthFromMonitor(m, m.lastSample)
}

export function printStakingRuntimeHealthSummary(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  const dump = dumpStakingRuntimeSoakMonitor()
  const sample = dump.lastSample
  const lines = [
    "── Staking runtime soak health ──",
    `health:              ${dump.health}`,
    `timeline verdict:    ${dump.timelineAnalysis.verdict}`,
    `active runtime:      ${sample?.runtimeKey ?? "—"} (${sample?.chainFamily ?? "—"})`,
    `stable streak:       ${dump.convergence.consecutiveStableMinutes.toFixed(2)} min (longest ${dump.convergence.longestStableStreakMinutes.toFixed(2)} min)`,
    `last instability:    ${dump.lastInstabilityReason ?? "—"}`,
    `last recovery:       ${
      dump.convergence.lastRecoveryFrom
        ? `${dump.convergence.lastRecoveryFrom} → stable in ${((dump.convergence.instabilityRecoveryDurationMs ?? 0) / 1000).toFixed(1)}s`
        : "—"
    }`,
    "instability counters:",
    `  hydration_stalls:  ${dump.instabilityCounters.hydrationStalls}`,
    `  transition_churns: ${dump.instabilityCounters.transitionChurns}`,
    `  contamination:     ${dump.instabilityCounters.contaminationDisconnects}`,
    `  identity_drifts:     ${dump.instabilityCounters.identityDrifts}`,
    `  reconnect_storms:  ${dump.instabilityCounters.reconnectStorms}`,
    `  execution_leakage: ${dump.instabilityCounters.executionLeakages}`,
    "timeline metrics:",
    `  swap freq/min:       ${dump.timelineAnalysis.metrics.swapFrequencyPerMin.toFixed(2)}`,
    `  reconnect/min:       ${dump.timelineAnalysis.metrics.reconnectDensityPerMin.toFixed(2)}`,
    `  max hydration ms:    ${Math.round(dump.timelineAnalysis.metrics.maxHydrationDurationMs)}`,
    `  instability bursts:  ${dump.timelineAnalysis.metrics.instabilityBursts}`,
  ]
  if (dump.timelineAnalysis.notes.length > 0) {
    lines.push(`notes:               ${dump.timelineAnalysis.notes.join("; ")}`)
  }
  lines.push("────────────────────────────────")
   
  stakingDevConsoleLog(lines.join("\n"))
}

declare global {
  interface Window {
    __stakingRuntimeSoakDump?: () => ReturnType<typeof dumpStakingRuntimeSoakMonitor>
    __stakingRuntimeLastUnstableSnapshot?: NonNullable<
      SoakMonitorInternal["lastUnstableSnapshot"]
    >
    __printStakingRuntimeHealth?: () => void
  }
}

function installStakingRuntimeSoakWindow(): void {
  if (!(process.env.NODE_ENV !== 'production') || typeof window === "undefined") return
  if (!window.__stakingRuntimeSoakDump) {
    window.__stakingRuntimeSoakDump = () => dumpStakingRuntimeSoakMonitor()
  }
  if (!window.__printStakingRuntimeHealth) {
    window.__printStakingRuntimeHealth = () => printStakingRuntimeHealthSummary()
  }
}

installStakingRuntimeSoakWindow()
