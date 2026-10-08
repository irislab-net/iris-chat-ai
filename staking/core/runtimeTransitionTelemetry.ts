import type { RuntimeExecutionIdentity } from "@/staking/core/runtimeExecutionGuard"
import type { RuntimeSwapPolicyDenialReason } from "@/staking/orchestration"
import type { RuntimeSwapTxModalSurface } from "@/staking/orchestration"
import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import {
  isRuntimeChaosSuiteEnabled,
  isRuntimeSwapStressHarnessEnabled,
  isRuntimeTortureSuiteEnabled,
} from "@/staking/config"

const PREFIX = "[staking][runtimeTransition]"

function devDebug(tag: string, payload: Record<string, unknown>): void {
  if (!(process.env.NODE_ENV !== 'production')) return
   
  console.debug(PREFIX, tag, payload)
}

/** Phase 38 — custom window event: TransactionStatusProvider may re-run persisted hydrate path. */
export const STAKING_RUNTIME_TORTURE_REHYDRATE_EVENT = "staking-runtime-torture-rehydrate"

/** Phase 38 — DEV stress or torture or Phase 41 chaos env: extra counters / depth (no production effect). */
export function isRuntimeStakingDevObservabilityEnabled(): boolean {
  return (
    (process.env.NODE_ENV !== 'production') &&
    (isRuntimeTortureSuiteEnabled() ||
      isRuntimeSwapStressHarnessEnabled() ||
      isRuntimeChaosSuiteEnabled())
  )
}

/** Phase 37 — optional swap stress context consumed once per `executeRuntimeSwap` (DEV-only). */
export type RuntimeSwapStressTelemetryAttachment = Readonly<{
  scenarioId: string
  scenarioName: string
  swapId: string
  startedAtMs: number
  runtimeKeyBefore: string
  generationBefore: number
}>

let pendingSwapStressTelemetry: RuntimeSwapStressTelemetryAttachment | null = null

export function assignRuntimeSwapStressTelemetry(
  attachment: RuntimeSwapStressTelemetryAttachment | null
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  pendingSwapStressTelemetry = attachment
}

export function takeRuntimeSwapStressTelemetry(): RuntimeSwapStressTelemetryAttachment | null {
  if (!(process.env.NODE_ENV !== 'production')) return null
  const x = pendingSwapStressTelemetry
  pendingSwapStressTelemetry = null
  return x
}

export type RuntimeTransitionStressTraceFields = Readonly<{
  scenarioId: string
  scenarioName: string
  swapId: string
  elapsedMs: number
  runtimeKeyBefore: string
  generationBefore: number
  runtimeKeyAfter: string
  generationAfter: number
}>

function buildStressTraceFields(
  stress: RuntimeSwapStressTelemetryAttachment,
  selection: { runtimeKey: string; generation: number }
): RuntimeTransitionStressTraceFields {
  return {
    scenarioId: stress.scenarioId,
    scenarioName: stress.scenarioName,
    swapId: stress.swapId,
    elapsedMs: Math.round(performance.now() - stress.startedAtMs),
    runtimeKeyBefore: stress.runtimeKeyBefore,
    generationBefore: stress.generationBefore,
    runtimeKeyAfter: selection.runtimeKey,
    generationAfter: Number(selection.generation),
  }
}

/** Phase 37 — build stress trace row for current selection (swap engine + policy traces). */
export function buildRuntimeSwapStressTraceFieldsForSelection(
  stress: RuntimeSwapStressTelemetryAttachment,
  selection: Pick<ActiveRuntimeSelection, "runtimeKey" | "generation">
): RuntimeTransitionStressTraceFields {
  return buildStressTraceFields(stress, {
    runtimeKey: selection.runtimeKey,
    generation: Number(selection.generation),
  })
}

/** Phase 37 — DEV-only: `useStakingVault` cleanup while stress env is on (detect stray async after teardown). */
export function devNotifyRuntimeStressVaultUnmountForStress(): void {
  if (!isRuntimeStakingDevObservabilityEnabled()) return
  traceRuntimeStressLeak("vault_unmount_during_stress_env", {})
}

let stressGasEstimateDepth = 0

/** Phase 37 — nested gas estimate RPC (DEV stress): warns on re-entrancy / overlap with runtime swaps. */
export function devRuntimeStressGasEstimateBegin(): void {
  if (!isRuntimeStakingDevObservabilityEnabled()) return
  stressGasEstimateDepth += 1
  if (stressGasEstimateDepth > 4) {
    traceRuntimeStressLeak("gas_estimate_depth", {
      depth: stressGasEstimateDepth,
      hint: "overlapping gas RPC; check for swap during estimate",
    })
  }
}

export function devRuntimeStressGasEstimateEnd(): void {
  if (!isRuntimeStakingDevObservabilityEnabled()) return
  stressGasEstimateDepth = Math.max(0, stressGasEstimateDepth - 1)
}

/** Phase 38 — DEV-only: concurrent in-flight gas estimate RPC depth (torture / stress observability). */
export function getRuntimeStakingGasEstimateAsyncDepth(): number {
  if (!(process.env.NODE_ENV !== 'production')) return 0
  return stressGasEstimateDepth
}

type RuntimeStressTxSnapshotProbe = () => Readonly<{
  dialogOpen: boolean
  uiPhase: string | null
  hasFrozenRuntime: boolean
}>

let stressTxSnapshotProbe: RuntimeStressTxSnapshotProbe | null = null

/** Phase 37 — TransactionStatusProvider registers latest tx modal shape for stress invariant checks. */
export function devRegisterRuntimeStressTxSnapshotProbe(
  probe: RuntimeStressTxSnapshotProbe | null
): () => void {
  if (!(process.env.NODE_ENV !== 'production')) {
    return () => {}
  }
  stressTxSnapshotProbe = probe
  return () => {
    stressTxSnapshotProbe = null
  }
}

export function devPeekRuntimeStressTxSnapshot(): ReturnType<
  RuntimeStressTxSnapshotProbe
> | null {
  if (!(process.env.NODE_ENV !== 'production') || stressTxSnapshotProbe == null) return null
  return stressTxSnapshotProbe()
}

/** Phase 37 — DEV-only leak / overlap warnings (console.warn). */
export function traceRuntimeStressLeak(
  kind: string,
  details: Record<string, unknown>
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
   
  console.warn(PREFIX, "stress_leak", kind, details)
}

export type RuntimeTransitionTelemetryIdentity = Readonly<{
  runtimeKey: string
  generation: number
}>

export type RuntimeTransitionTracePayload = Readonly<{
  event: string
  lifecycle: string
  sequenceStage: string
  transitionGeneration: number
  runtimeGeneration: number
  runtimeKey: string
  executionIdentity: RuntimeTransitionTelemetryIdentity
  /** Phase 37 — present when swap was initiated by the internal stress harness. */
  stress?: RuntimeTransitionStressTraceFields
}>

/** Phase 36 — DEV-only: lifecycle / sequence / generations / identity for transition or swap steps. */
export function traceRuntimeTransition(payload: RuntimeTransitionTracePayload): void {
  devDebug("transition", { ...payload })
}

export type RuntimeControllerSlicePayload = Readonly<{
  event: string
  prev: Readonly<{
    lifecycle: string
    sequenceStage: string
    transitionGeneration: number
    refreshPaused: boolean
  }>
  next: Readonly<{
    lifecycle: string
    sequenceStage: string
    transitionGeneration: number
    refreshPaused: boolean
  }>
}>

/** Phase 36 — DEV-only: controller row before/after a pure transition action. */
export function traceControllerStateTransition(payload: RuntimeControllerSlicePayload): void {
  devDebug("controller_slice", { ...payload })
}

/** Phase 36 — DEV-only: swap engine denied after policy passed (protocol / invariant). */
export function traceRuntimeSwapDenied(payload: Readonly<{
  reason: string
  currentRuntimeKey: string
  targetRuntimeKey: string
  controller: Readonly<{
    lifecycle: string
    sequenceStage: string
    transitionGeneration: number
    refreshPaused: boolean
  }>
  stress?: RuntimeTransitionStressTraceFields
}>): void {
  devDebug("swap_denied", payload)
}

/** Phase 36 — DEV-only: admission policy denied a swap. */
export function traceRuntimeSwapPolicyDenied(payload: Readonly<{
  reason: RuntimeSwapPolicyDenialReason
  current: Pick<ActiveRuntimeSelection, "runtimeKey" | "generation" | "deployment">
  target: Pick<ActiveRuntimeSelection, "runtimeKey" | "generation" | "deployment">
  controller: Readonly<{
    lifecycle: string
    sequenceStage: string
    transitionGeneration: number
    refreshPaused: boolean
  }>
  txModal: RuntimeSwapTxModalSurface
  stress?: RuntimeTransitionStressTraceFields
}>): void {
  devDebug("swap_policy_denied", {
    reason: payload.reason,
    currentRuntimeKey: payload.current.runtimeKey,
    currentGeneration: Number(payload.current.generation),
    targetRuntimeKey: payload.target.runtimeKey,
    targetDeploymentId: payload.target.deployment.id.trim(),
    controller: payload.controller,
    txModal: {
      dialogOpen: payload.txModal.dialogOpen,
      uiPhase: payload.txModal.uiPhase,
      hasFrozenRuntime: payload.txModal.transactionRuntime != null,
    },
    ...(payload.stress ? { stress: payload.stress } : {}),
  })
}

/** Phase 36 — DEV-only: async React path skipped commit (coordinator gate). */
export function traceRuntimeAsyncCommitRejected(payload: Readonly<{
  surface: string
  reason: string
  captured: Record<string, unknown>
  latest: Record<string, unknown>
}>): void {
  devDebug("async_commit_rejected", payload)
}

// --- Phase 39 — readiness gate tallies (DEV-only; incremented alongside traces) ---

const readinessViolationTallies = {
  invariantStress: 0,
  invariantTorture: 0,
  invariantProdLike: 0,
  selectionCoordinatorDesync: 0,
}

function recordReadinessInvariantClassification(code: string): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  if (code.startsWith("stress_")) {
    readinessViolationTallies.invariantStress += 1
  } else if (code.startsWith("torture_")) {
    readinessViolationTallies.invariantTorture += 1
  } else {
    readinessViolationTallies.invariantProdLike += 1
  }
}

/** Phase 39 — DEV-only snapshot for `runtimeReadinessGate` (pass/fail; no production use). */
export function getRuntimeReadinessViolationSnapshot(): Readonly<typeof readinessViolationTallies> {
  return { ...readinessViolationTallies }
}

/** Phase 36 — DEV-only: invariant / ordering issues (never throws). */
export function traceRuntimeInvariantViolation(
  code: string,
  details: Record<string, unknown>
): void {
  recordReadinessInvariantClassification(code)
  devDebug("invariant_violation", { code, ...details })
}

/** Phase 36 — DEV-only: balance orchestrator skipped work due to coordinator / transition gates. */
export function traceOrchestratorRefreshSkipped(payload: Readonly<{
  kind: "tick_refresh_gate" | "pre_slow_refresh_gate" | "commit_coordinator_gate"
  reason?: string
  coordinator?: Record<string, unknown> | null
}>): void {
  devDebug("orchestrator_refresh_skipped", payload)
}

/** Phase 36 — DEV-only: passive selection identity disagrees with coordinator-derived identity (single render). */
export function traceRuntimeSelectionCoordinatorDesync(payload: Readonly<{
  selectionIdentity: RuntimeExecutionIdentity
  coordinatorIdentity: RuntimeExecutionIdentity
}>): void {
  if ((process.env.NODE_ENV !== 'production')) {
    readinessViolationTallies.selectionCoordinatorDesync += 1
  }
  devDebug("selection_coordinator_desync", {
    selection: {
      runtimeKey: payload.selectionIdentity.runtimeKey,
      generation: Number(payload.selectionIdentity.generation),
    },
    coordinator: {
      runtimeKey: payload.coordinatorIdentity.runtimeKey,
      generation: Number(payload.coordinatorIdentity.generation),
    },
  })
}

// --- Phase 38 — runtime torture counters (DEV-only; no production behavior change) ---

const tortureCounters = {
  staleAsyncCommitDenied: 0,
  hydrateMsTotal: 0,
  hydrateSamples: 0,
  reconcileMsTotal: 0,
  reconcileSamples: 0,
  vaultMount: 0,
  vaultUnmount: 0,
  orchestratorSessionEpoch: 0,
  orchestratorActiveSessionId: null as string | null,
}

/** Phase 38 — DEV-only: async commit gate rejected (coordinator mismatch / stale generation). */
export function recordRuntimeTortureStaleAsyncCommitDenied(surface: string): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  tortureCounters.staleAsyncCommitDenied += 1
  devDebug("torture_stale_commit", { surface, total: tortureCounters.staleAsyncCommitDenied })
}

export function recordRuntimeTortureHydrateMs(ms: number): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  tortureCounters.hydrateMsTotal += ms
  tortureCounters.hydrateSamples += 1
}

export function recordRuntimeTortureReconcileMs(ms: number): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  tortureCounters.reconcileMsTotal += ms
  tortureCounters.reconcileSamples += 1
}

export function recordRuntimeTortureVaultMount(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  tortureCounters.vaultMount += 1
}

export function recordRuntimeTortureVaultUnmount(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  tortureCounters.vaultUnmount += 1
}

export function recordRuntimeTortureOrchestratorSessionStart(sessionId: string): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  tortureCounters.orchestratorSessionEpoch += 1
  tortureCounters.orchestratorActiveSessionId = sessionId
  devDebug("torture_orch_session_start", { sessionId, epoch: tortureCounters.orchestratorSessionEpoch })
}

export function recordRuntimeTortureOrchestratorSessionStop(sessionId: string | null): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  if (tortureCounters.orchestratorActiveSessionId === sessionId) {
    tortureCounters.orchestratorActiveSessionId = null
  }
  devDebug("torture_orch_session_stop", { sessionId })
}

export function getRuntimeTortureCounterSnapshot(): Readonly<typeof tortureCounters> {
  return { ...tortureCounters }
}

export function traceRuntimeTortureStep(tag: string, payload: Record<string, unknown>): void {
  if (!(process.env.NODE_ENV !== 'production') || !isRuntimeTortureSuiteEnabled()) return
  devDebug("torture_step", { tag, ...payload })
}

type RuntimeTortureWalletContext = Readonly<{ address: string; chainId: number }>

let runtimeTortureWalletGetter: (() => RuntimeTortureWalletContext | null) | null = null

/** Phase 38 — `TransactionStatusProvider` registers wallet for synthetic persisted torture sessions. */
export function registerRuntimeTortureWalletContext(
  getter: (() => RuntimeTortureWalletContext | null) | null
): () => void {
  if (!(process.env.NODE_ENV !== 'production')) {
    return () => {}
  }
  runtimeTortureWalletGetter = getter
  return () => {
    runtimeTortureWalletGetter = null
  }
}

export function getRuntimeTortureWalletContext(): RuntimeTortureWalletContext | null {
  if (!(process.env.NODE_ENV !== 'production') || runtimeTortureWalletGetter == null) return null
  return runtimeTortureWalletGetter()
}

// --- Phase 41 — DEV chaos fault injection (no production behavior unless env + DEV) ---

const CHAOS_FAULT_DEFAULTS = {
  fastReadLagMs: 0,
  slowReadLagMs: 0,
  rpcFailureProbability: 0,
  gasDelayMs: 0,
  gasForceFail: false,
  hydrateDelayMs: 0,
  hydrateForceFail: false,
  receiptLagMs: 0,
} as const

type RuntimeChaosFaultSnapshot = Readonly<{
  fastReadLagMs: number
  slowReadLagMs: number
  rpcFailureProbability: number
  gasDelayMs: number
  gasForceFail: boolean
  hydrateDelayMs: number
  hydrateForceFail: boolean
  receiptLagMs: number
}>

const chaosFaults: RuntimeChaosFaultSnapshot = { ...CHAOS_FAULT_DEFAULTS }

const chaosCounters = {
  simulatedRpcFailures: 0,
  gasForcedFailures: 0,
  hydrateForcedSkips: 0,
  orchestratorTickSkippedInflight: 0,
}

export function setRuntimeChaosFaultInjection(
  patch: Partial<RuntimeChaosFaultSnapshot>
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  Object.assign(chaosFaults, patch)
}

export function resetRuntimeChaosFaultInjection(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  Object.assign(chaosFaults, CHAOS_FAULT_DEFAULTS)
}

export function resetRuntimeChaosCounters(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  chaosCounters.simulatedRpcFailures = 0
  chaosCounters.gasForcedFailures = 0
  chaosCounters.hydrateForcedSkips = 0
  chaosCounters.orchestratorTickSkippedInflight = 0
}

export function getRuntimeChaosFaultInjectionSnapshot(): RuntimeChaosFaultSnapshot {
  return { ...chaosFaults }
}

export function getRuntimeChaosCounterSnapshot(): Readonly<typeof chaosCounters> {
  return { ...chaosCounters }
}

function chaosSleep(ms: number, signal: AbortSignal | undefined): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }
    const t = window.setTimeout(resolve, ms)
    const onAbort = () => {
      window.clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    }
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

/** Phase 41 — orchestrator read path: artificial lag (aborts with tick signal). */
export async function devRuntimeChaosSleepReadLag(
  kind: "fast" | "slow",
  signal: AbortSignal | undefined
): Promise<void> {
  if (!(process.env.NODE_ENV !== 'production') || !isRuntimeChaosSuiteEnabled()) return
  const ms = kind === "fast" ? chaosFaults.fastReadLagMs : chaosFaults.slowReadLagMs
  try {
    await chaosSleep(ms, signal)
  } catch {
    /* abort is normal when orchestrator invalidates */
  }
}

/** Phase 41 — throw before RPC to simulate flaky JSON-RPC (orchestrator catch → backpressure). */
export function devRuntimeChaosMaybeThrowIntermittentRpc(): void {
  if (!(process.env.NODE_ENV !== 'production') || !isRuntimeChaosSuiteEnabled()) return
  const p = chaosFaults.rpcFailureProbability
  if (p <= 0) return
  if (Math.random() < p) {
    chaosCounters.simulatedRpcFailures += 1
    devDebug("chaos_simulated_rpc_failure", { total: chaosCounters.simulatedRpcFailures })
    throw new Error("[staking][runtimeChaos] simulated intermittent RPC failure")
  }
}

export function recordRuntimeChaosOrchestratorTickSkippedInflight(): void {
  if (!(process.env.NODE_ENV !== 'production') || !isRuntimeChaosSuiteEnabled()) return
  chaosCounters.orchestratorTickSkippedInflight += 1
}

export async function devRuntimeChaosSleepHydrateLag(): Promise<void> {
  if (!(process.env.NODE_ENV !== 'production') || !isRuntimeChaosSuiteEnabled()) return
  await chaosSleep(chaosFaults.hydrateDelayMs, undefined)
}

export function devRuntimeChaosShouldSkipHydrateReconcile(): boolean {
  return (process.env.NODE_ENV !== 'production') && isRuntimeChaosSuiteEnabled() && chaosFaults.hydrateForceFail
}

export function recordRuntimeChaosHydrateForcedSkip(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  chaosCounters.hydrateForcedSkips += 1
  devDebug("chaos_hydrate_reconcile_skipped", { total: chaosCounters.hydrateForcedSkips })
}

/** Phase 41 — gas estimate path: delay then optional forced throw (caller catch). */
export async function devRuntimeChaosGasEstimatePreamble(
  signal: AbortSignal | undefined
): Promise<void> {
  if (!(process.env.NODE_ENV !== 'production') || !isRuntimeChaosSuiteEnabled()) return
  try {
    await chaosSleep(chaosFaults.gasDelayMs, signal)
  } catch {
    return
  }
  if (chaosFaults.gasForceFail) {
    chaosCounters.gasForcedFailures += 1
    devDebug("chaos_gas_forced_fail", { total: chaosCounters.gasForcedFailures })
    throw new Error("[staking][runtimeChaos] forced gas estimate failure")
  }
}

/** Phase 41 — `useStakingVault` listens for wallet surge simulations. */
export const STAKING_RUNTIME_CHAOS_WALLET_SURGE_EVENT = "staking-runtime-chaos-wallet-surge"

/** Phase 41 — BFCache / mobile resume style hint (optional consumer). */
export const STAKING_RUNTIME_CHAOS_MOBILE_RESUME_EVENT = "staking-runtime-chaos-mobile-resume"

export function traceRuntimeChaosStep(tag: string, payload: Record<string, unknown>): void {
  if (!(process.env.NODE_ENV !== 'production') || !isRuntimeChaosSuiteEnabled()) return
  devDebug("chaos_step", { tag, ...payload })
}
