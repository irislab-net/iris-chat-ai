/**
 * Staking balance refresh orchestration: single-flight, semantic notify coalescing,
 * performance.now floors, adaptive timer (never tied to WS block callback).
 *
 * ## Phase 19 — runtime context (audit)
 *
 * - **Implicit legacy runtime:** orchestrator only calls `executeStakingFastRead` /
 *   `executeStakingSlowRead` without `read` options — those resolve **legacy** deployment + HTTP
 *   via `stakingReadFactory` / `getReadProviderForDeployment`, matching pre-Phase-19 behavior.
 * - **Deployment-sensitive reads:** ERC20 `balanceOf` / `allowance`, vault `balanceOf`, caps, fee.
 * - **Future:** optional `read` on execute params (or session carrying `StakingDeploymentConfig`)
 *   would thread non-legacy rows without changing refresh timing semantics here.
 *
 * **Phase 31–36:** session may carry **`coordinatorSnapshot`** + **`getLatestCoordinatorSnapshot`** — **`tick`**
 * skips RPC when **`!canRuntimeOperationRefresh(latest)`** (includes Phase 33 **`sequenceStage`** before
 * **`resume_requested`**, **`refreshPaused`**, **`pausing`** / **`switching`** lifecycle). No slow-read work is
 * scheduled while those gates fail (early return before **`needSlow`** RPC; mid-tick gates before slow read).
 * **`onCommit`** runs only when **`canRuntimeOperationCommit(captured, latest)`** — rejects
 * **`begin_requested`**, **`refresh_paused`**, **`runtime_swapped`** on latest; stale reads after
 * **`beginRuntimeTransition`** / internal swaps (**`executeRuntimeSwap`**, gated by **`runtimeSwapPolicy`**) still
 * fail via **`transitionGeneration`** and execution identity. **`getLatestCoordinatorSnapshot`** reflects the
 * post-swap passive row once React commits (Phase 34). Adaptive **`scheduleNext`** keeps firing so
 * **`resume_requested`** can resume without new timers. **Phase 36 (DEV):** orchestrator skips emit
 * **`traceOrchestratorRefreshSkipped`** with refresh/commit denial reasons. **Phase 37 (DEV):**
 * **`registerStakingRefreshOrchestratorStressTickProbe`** for stress harness tick instrumentation.
 * **Phase 38 (DEV):** torture suite records orchestrator session start/stop ids (no production behavior change).
 * **Phase 41 (DEV):** optional chaos lag + intermittent RPC throws before fast/slow reads (`runtimeChaosSuite` /
 * `VITE_RUNTIME_CHAOS`); tick skips while **`inFlight`** are counted for chaos recovery probes.
 *
 * **Phase 42 — PRODUCTION-FROZEN:** single-flight refresh + semantic coalescing + coordinator gates are the
 * balance-of-truth path; change only for orchestration bugs. See `docs/staking-runtime-phase42-stabilization.md`.
 * **Future:** warm-cache path may reuse partial slow-read
 * results across the resume boundary without relaxing sequence gates.
 */
import {
  acquireStakingWsBlockSignal,
  probeStakingRpcCapabilities,
} from "@/staking/execution"
import {
  executeStakingFastRead,
  executeStakingSlowRead,
  type StakingFastReadResult,
  type StakingSlowReadResult,
} from "@/staking/execution"
import type { RuntimeExecutionIdentity } from "@/staking/core/runtimeExecutionGuard"
import {
  canRuntimeOperationCommit,
  canRuntimeOperationRefresh,
  explainCanRuntimeOperationCommitDenied,
  explainCanRuntimeOperationRefreshDenied,
  summarizeCoordinatorSnapshotForTelemetry,
  type RuntimeTransitionCoordinatorSnapshot,
} from "@/staking/orchestration"
import {
  devRuntimeChaosMaybeThrowIntermittentRpc,
  devRuntimeChaosSleepReadLag,
  recordRuntimeChaosOrchestratorTickSkippedInflight,
  recordRuntimeTortureOrchestratorSessionStart,
  recordRuntimeTortureOrchestratorSessionStop,
  traceOrchestratorRefreshSkipped,
} from "@/staking/core/runtimeTransitionTelemetry"
import { sequenceStageAllowsBalanceRefresh } from "@/staking/orchestration"
import {
  stakingMetricsBackpressure,
  stakingMetricsCoalesced,
  stakingMetricsRefreshCompleted,
  stakingMetricsRefreshSkipped,
  stakingMetricsRefreshStarted,
} from "@/staking/refresh/stakingRefreshMetrics"
import {
  buildRuntimeTelemetryEvent,
  emitRuntimeTelemetry,
  isRuntimeTelemetryEmitEnabled,
} from "@/lib/runtimeTelemetry/runtimeTelemetry"
import {
  attachNetworkErrorMetadata,
  normalizeNetworkError,
  setLastRpcFailureForRuntimeKey,
} from "@/lib/networkErrors"
import { getDefaultStakingRuntimeDeployment } from "@/staking/core/runtimeSelectionDefaults"

export type StakingSemanticReason =
  | "wallet-state-change"
  | "tx-state-change"
  | "visibility-state-change"
  | "periodic-sync"
  | "network-state-change"

const SEM_BIT: Record<StakingSemanticReason, number> = {
  "wallet-state-change": 1,
  "tx-state-change": 2,
  "visibility-state-change": 4,
  "periodic-sync": 8,
  "network-state-change": 16,
}

export function mapToStakingSemanticReason(raw: string): StakingSemanticReason {
  const r = raw.toLowerCase()
  if (
    r.includes("tx") ||
    r.includes("deposit") ||
    r.includes("withdraw") ||
    r.includes("approve") ||
    r.includes("receipt")
  ) {
    return "tx-state-change"
  }
  if (r.includes("visibility") || r.includes("visible") || r.includes("hidden")) {
    return "visibility-state-change"
  }
  if (r.includes("network") || r.includes("chain")) {
    return "network-state-change"
  }
  if (r.includes("periodic") || r.includes("profit") || r.includes("heartbeat")) {
    return "periodic-sync"
  }
  return "wallet-state-change"
}

export type StakingBalanceCommit = {
  walletBalance: bigint
  allowance: bigint
  vaultShares: bigint
  stakedAssets: bigint
  vaultMaxDepositWei: bigint
  vaultMaxWithdrawWei: bigint
  minWithdrawalFeeWei: bigint
  commitVersion: number
  sharesChanged: boolean
}

export type StakingOrchestratorSession = {
  /** Phase 28 — session owner identity from **`useRuntimeTransitionSnapshot().executionIdentity`** (optional for legacy callers). */
  executionIdentity?: RuntimeExecutionIdentity
  /**
   * Phase 31 — coordinator row captured at **`startStakingRefreshOrchestrator`**; paired with
   * **`getLatestCoordinatorSnapshot`** for canonical commit/refresh gates.
   */
  coordinatorSnapshot?: RuntimeTransitionCoordinatorSnapshot
  /** Latest coordinator snapshot from React (ref callback). */
  getLatestCoordinatorSnapshot?: () => RuntimeTransitionCoordinatorSnapshot
  walletAddress: string
  tokenAddress: string
  isVisible: () => boolean
  isChainOk: () => boolean
  onCommit: (c: StakingBalanceCommit) => void
  getPrevious: () => Omit<StakingBalanceCommit, "commitVersion" | "sharesChanged">
}

/** Phase 37 — DEV-only: invoked at orchestrator tick boundaries for stress harness invariant checks. */
export type StakingRefreshOrchestratorStressTickProbe = (info: Readonly<{
  phase: "tick_start"
  latestCoordinator: RuntimeTransitionCoordinatorSnapshot | undefined
  sessionExecutionIdentity: RuntimeExecutionIdentity | undefined
  refreshAllowed: boolean
}>) => void

let stressOrchestratorTickProbe: StakingRefreshOrchestratorStressTickProbe | null = null

export function registerStakingRefreshOrchestratorStressTickProbe(
  fn: StakingRefreshOrchestratorStressTickProbe | null
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  stressOrchestratorTickProbe = fn
}

const ABSOLUTE_MIN_MS = 900
const FAST_FLOOR_MS = 45_000
const SLOW_FLOOR_MS = 420_000
const HIDDEN_HEARTBEAT_BASE_MS = 600_000
const HIDDEN_HEARTBEAT_JITTER_MS = 120_000
const IDLE_MAX_MS = 90_000

let session: StakingOrchestratorSession | null = null
let releaseWs: (() => void) | null = null
let adaptiveTimer: ReturnType<typeof setTimeout> | null = null
let visibilityCleanup: (() => void) | null = null

/** Phase 38 — DEV torture: monotonic orchestrator session id (no production effect). */
let tortureOrchEpoch = 0
let tortureOrchSessionId: string | null = null

let pendingMask = 0
let lastCommitPerf = 0
let lastFastPerf = 0
let lastSlowPerf = 0
let commitVersion = 0
let inFlight = false
let invalidationGen = 0
let abortCtrl: AbortController | null = null

/** Wall clock of last successful balance commit (for sparse stall telemetry while visible). */
let lastSuccessfulCommitWallMs = 0

/** Phase 43 — aggregate RPC / coordinator health (no PII). */
let orchConsecutiveRpcFailures = 0
let orchConsecutiveCommitSkips = 0
let rpcDegradedTelemetry = false

function telemetryBreadcrumbFromCoordinator(
  latest: RuntimeTransitionCoordinatorSnapshot | undefined
): { runtimeKey?: string; lifecycle?: string; sequenceStage?: string; transitionGeneration?: number } {
  if (latest == null) return {}
  return {
    runtimeKey: latest.activeExecutionIdentity.runtimeKey,
    lifecycle: latest.lifecycle,
    sequenceStage: latest.sequenceStage,
    transitionGeneration: Number(latest.transitionGeneration),
  }
}

function noteOrchestratorReadsSucceededTelemetry(
  latest: RuntimeTransitionCoordinatorSnapshot | undefined
): void {
  if (!isRuntimeTelemetryEmitEnabled()) return
  orchConsecutiveRpcFailures = 0
  if (rpcDegradedTelemetry) {
    rpcDegradedTelemetry = false
    emitRuntimeTelemetry(
      buildRuntimeTelemetryEvent(
        "rpc_degradation_recovered",
        "info",
        telemetryBreadcrumbFromCoordinator(latest)
      )
    )
  }
}

function noteOrchestratorReadCatchTelemetry(
  latest: RuntimeTransitionCoordinatorSnapshot | undefined
): void {
  if (!isRuntimeTelemetryEmitEnabled()) return
  orchConsecutiveRpcFailures += 1
  if (orchConsecutiveRpcFailures >= 3 && !rpcDegradedTelemetry) {
    rpcDegradedTelemetry = true
    emitRuntimeTelemetry(
      buildRuntimeTelemetryEvent(
        "rpc_degradation_detected",
        "error",
        telemetryBreadcrumbFromCoordinator(latest),
        orchConsecutiveRpcFailures
      )
    )
  }
}

function devInvokeOrchestratorStressTickProbe(
  latestCoordinator: RuntimeTransitionCoordinatorSnapshot | undefined,
  refreshAllowed: boolean
): void {
  if (!(process.env.NODE_ENV !== 'production') || stressOrchestratorTickProbe == null || !session) return
  stressOrchestratorTickProbe({
    phase: "tick_start",
    latestCoordinator,
    sessionExecutionIdentity: session.executionIdentity,
    refreshAllowed,
  })
}

function clearAdaptive() {
  if (adaptiveTimer != null) {
    clearTimeout(adaptiveTimer)
    adaptiveTimer = null
  }
}

function pickSemanticFromMask(mask: number): StakingSemanticReason {
  if (mask & SEM_BIT["tx-state-change"]) return "tx-state-change"
  if (mask & SEM_BIT["wallet-state-change"]) return "wallet-state-change"
  if (mask & SEM_BIT["network-state-change"]) return "network-state-change"
  if (mask & SEM_BIT["visibility-state-change"]) return "visibility-state-change"
  return "periodic-sync"
}

function mergeField(prev: bigint, r: { ok: true; value: bigint } | { ok: false; error: string }): bigint {
  return r.ok ? r.value : prev
}

function buildCommit(
  prev: ReturnType<StakingOrchestratorSession["getPrevious"]>,
  fast: StakingFastReadResult,
  slow: StakingSlowReadResult | null,
  sharesChanged: boolean
): StakingBalanceCommit {
  commitVersion += 1
  const walletBalance = mergeField(prev.walletBalance, fast.walletBalance)
  const vaultShares = mergeField(prev.vaultShares, fast.vaultShares)
  const stakedAssets = vaultShares
  const allowance =
    slow != null ? mergeField(prev.allowance, slow.allowance) : prev.allowance
  const vaultMaxDepositWei =
    slow != null ? mergeField(prev.vaultMaxDepositWei, slow.maxDeposit) : prev.vaultMaxDepositWei
  const vaultMaxWithdrawWei =
    slow != null ? mergeField(prev.vaultMaxWithdrawWei, slow.maxWithdraw) : prev.vaultMaxWithdrawWei
  const minWithdrawalFeeWei =
    slow != null
      ? mergeField(prev.minWithdrawalFeeWei, slow.minWithdrawalFee)
      : prev.minWithdrawalFeeWei
  return {
    walletBalance,
    allowance,
    vaultShares,
    stakedAssets,
    vaultMaxDepositWei,
    vaultMaxWithdrawWei,
    minWithdrawalFeeWei,
    commitVersion,
    sharesChanged,
  }
}

function computeDelayMs(): number {
  if (!session) return IDLE_MAX_MS
  const now = performance.now()
  const untilAbs = Math.max(0, ABSOLUTE_MIN_MS - (now - lastCommitPerf))

  if (!session.isVisible()) {
    const j = Math.random() * HIDDEN_HEARTBEAT_JITTER_MS
    return Math.max(untilAbs, HIDDEN_HEARTBEAT_BASE_MS + j)
  }

  if (pendingMask !== 0) {
    return untilAbs > 0 ? untilAbs : ABSOLUTE_MIN_MS + Math.random() * 150
  }

  const untilFast = Math.max(0, FAST_FLOOR_MS - (now - lastFastPerf))
  const base = Math.min(Math.max(untilFast, 2_000), IDLE_MAX_MS)
  return untilAbs > 0 ? untilAbs : base + Math.random() * 400
}

function scheduleNext() {
  clearAdaptive()
  adaptiveTimer = setTimeout(() => {
    adaptiveTimer = null
    void tick()
  }, computeDelayMs())
}

async function tick() {
  if (!session || !session.isChainOk()) {
    stakingMetricsRefreshSkipped()
    scheduleNext()
    return
  }
  const latestCoordinator = session.getLatestCoordinatorSnapshot?.()
  const refreshAllowed =
    latestCoordinator == null || canRuntimeOperationRefresh(latestCoordinator)
  devInvokeOrchestratorStressTickProbe(latestCoordinator, refreshAllowed)
  if (!refreshAllowed) {
    if ((process.env.NODE_ENV !== 'production')) {
      traceOrchestratorRefreshSkipped({
        kind: "tick_refresh_gate",
        reason:
          explainCanRuntimeOperationRefreshDenied(latestCoordinator) ?? undefined,
        coordinator: summarizeCoordinatorSnapshotForTelemetry(latestCoordinator),
      })
    }
    stakingMetricsRefreshSkipped()
    scheduleNext()
    return
  }
  const now = performance.now()
  if (inFlight) {
    if ((process.env.NODE_ENV !== 'production')) {
      recordRuntimeChaosOrchestratorTickSkippedInflight()
    }
    scheduleNext()
    return
  }
  if (now - lastCommitPerf < ABSOLUTE_MIN_MS) {
    scheduleNext()
    return
  }

  const mask = pendingMask
  pendingMask = 0
  const semantic = pickSemanticFromMask(mask || SEM_BIT["periodic-sync"])
  if (mask !== 0) stakingMetricsCoalesced(semantic)

  const coordForSlow = session.getLatestCoordinatorSnapshot?.()
  const sequenceAllowsSlowRpc =
    coordForSlow == null ||
    sequenceStageAllowsBalanceRefresh(coordForSlow.sequenceStage)

  const needFast = mask !== 0 || now - lastFastPerf >= FAST_FLOOR_MS || semantic === "tx-state-change"
  const needSlow =
    sequenceAllowsSlowRpc &&
    (mask !== 0 ||
      semantic === "tx-state-change" ||
      now - lastSlowPerf >= SLOW_FLOOR_MS ||
      (mask & SEM_BIT["network-state-change"]) !== 0)

  if (!needFast && !needSlow) {
    stakingMetricsRefreshSkipped()
    scheduleNext()
    return
  }

  inFlight = true
  stakingMetricsRefreshStarted()
  abortCtrl = new AbortController()
  const myGen = ++invalidationGen
  const prev = session.getPrevious()
  const prevShares = prev.vaultShares

  try {
    const fast = needFast
      ? await (async () => {
          await devRuntimeChaosSleepReadLag("fast", abortCtrl?.signal)
          devRuntimeChaosMaybeThrowIntermittentRpc()
          return executeStakingFastRead({
            tokenAddress: session.tokenAddress,
            walletAddress: session.walletAddress,
            signal: abortCtrl.signal,
          })
        })()
      : ({
          walletBalance: { ok: true, value: prev.walletBalance },
          vaultShares: { ok: true, value: prev.vaultShares },
        } as StakingFastReadResult)

    if (myGen !== invalidationGen) return

    if (needSlow) {
      const gateMid = session.getLatestCoordinatorSnapshot?.()
      if (gateMid != null && !canRuntimeOperationRefresh(gateMid)) {
        if ((process.env.NODE_ENV !== 'production')) {
          traceOrchestratorRefreshSkipped({
            kind: "pre_slow_refresh_gate",
            reason: explainCanRuntimeOperationRefreshDenied(gateMid) ?? undefined,
            coordinator: summarizeCoordinatorSnapshotForTelemetry(gateMid),
          })
        }
        stakingMetricsRefreshSkipped()
        return
      }
    }

    const slow = needSlow
      ? await (async () => {
          await devRuntimeChaosSleepReadLag("slow", abortCtrl?.signal)
          devRuntimeChaosMaybeThrowIntermittentRpc()
          return executeStakingSlowRead({
            tokenAddress: session.tokenAddress,
            walletAddress: session.walletAddress,
            signal: abortCtrl.signal,
          })
        })()
      : null

    if (myGen !== invalidationGen) return

    const mergedSlow =
      slow ??
      ({
        allowance: { ok: true, value: prev.allowance },
        maxDeposit: { ok: true, value: prev.vaultMaxDepositWei },
        maxWithdraw: { ok: true, value: prev.vaultMaxWithdrawWei },
        minWithdrawalFee: { ok: true, value: prev.minWithdrawalFeeWei },
      } as StakingSlowReadResult)

    noteOrchestratorReadsSucceededTelemetry(session.getLatestCoordinatorSnapshot?.())

    const newShares = mergeField(prev.vaultShares, fast.vaultShares)
    const sharesChanged = newShares !== prevShares
    const commit = buildCommit(prev, fast, mergedSlow, sharesChanged)
    const captured = session.coordinatorSnapshot
    const latest = session.getLatestCoordinatorSnapshot?.()
    if (
      captured != null &&
      latest != null &&
      !canRuntimeOperationCommit(captured, latest)
    ) {
      if ((process.env.NODE_ENV !== 'production')) {
        traceOrchestratorRefreshSkipped({
          kind: "commit_coordinator_gate",
          reason: explainCanRuntimeOperationCommitDenied(captured, latest) ?? undefined,
          coordinator: summarizeCoordinatorSnapshotForTelemetry(latest),
        })
      }
      stakingMetricsRefreshSkipped()
      if (isRuntimeTelemetryEmitEnabled()) {
        orchConsecutiveCommitSkips += 1
        if (orchConsecutiveCommitSkips >= 8) {
          emitRuntimeTelemetry(
            buildRuntimeTelemetryEvent(
              "orchestrator_starvation",
              "warning",
              telemetryBreadcrumbFromCoordinator(latest),
              orchConsecutiveCommitSkips
            )
          )
        }
      }
    } else {
      lastCommitPerf = performance.now()
      if (needFast) lastFastPerf = performance.now()
      if (needSlow) lastSlowPerf = performance.now()
      if (isRuntimeTelemetryEmitEnabled()) {
        orchConsecutiveCommitSkips = 0
      }
      session.onCommit(commit)
      lastSuccessfulCommitWallMs = Date.now()
    }
    stakingMetricsRefreshCompleted()
  } catch (tickErr) {
    stakingMetricsBackpressure()
    const latest = session?.getLatestCoordinatorSnapshot?.()
    const rtKey = latest?.activeExecutionIdentity.runtimeKey
    if (rtKey != null) {
      const dep = getDefaultStakingRuntimeDeployment()
      const normalized = normalizeNetworkError(tickErr, {
        endpointType: "rpc",
        transport: "http",
        url: dep.rpc.http,
        chainId: dep.caip2,
        deploymentId: dep.id,
        severity: "alert",
      })
      attachNetworkErrorMetadata(tickErr, normalized)
      setLastRpcFailureForRuntimeKey(rtKey, normalized)
    }
    noteOrchestratorReadCatchTelemetry(latest)
  } finally {
    inFlight = false
    abortCtrl = null
    if (session && isRuntimeTelemetryEmitEnabled() && lastSuccessfulCommitWallMs > 0) {
      const wallDt = Date.now() - lastSuccessfulCommitWallMs
      if (
        wallDt > 240_000 &&
        session.isVisible() &&
        session.isChainOk()
      ) {
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent(
            "staking_balance_refresh_wall_stall",
            "warning",
            {
              ...telemetryBreadcrumbFromCoordinator(
                session.getLatestCoordinatorSnapshot?.()
              ),
              reasonToken: "balance_commit_wall_idle_240s",
            }
          )
        )
      }
    }
    scheduleNext()
  }
}

export function notifyStakingRefresh(raw: string) {
  const sem = mapToStakingSemanticReason(raw)
  pendingMask |= SEM_BIT[sem]
  scheduleNext()
}

export function notifyStakingRefreshSemantic(sem: StakingSemanticReason) {
  pendingMask |= SEM_BIT[sem]
  scheduleNext()
}

export function startStakingRefreshOrchestrator(s: StakingOrchestratorSession): () => void {
  stopStakingRefreshOrchestrator()
  session = s
  tortureOrchEpoch += 1
  tortureOrchSessionId = `orch-${tortureOrchEpoch}`
  if ((process.env.NODE_ENV !== 'production')) {
    recordRuntimeTortureOrchestratorSessionStart(tortureOrchSessionId)
  }
  void probeStakingRpcCapabilities()
  releaseWs = acquireStakingWsBlockSignal()

  const onVis = () => {
    notifyStakingRefreshSemantic("visibility-state-change")
  }
  document.addEventListener("visibilitychange", onVis)

  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted) {
      notifyStakingRefreshSemantic("visibility-state-change")
    }
  }
  window.addEventListener("pageshow", onPageShow)

  visibilityCleanup = () => {
    document.removeEventListener("visibilitychange", onVis)
    window.removeEventListener("pageshow", onPageShow)
  }

  lastCommitPerf = 0
  lastFastPerf = 0
  lastSlowPerf = 0
  lastSuccessfulCommitWallMs = 0
  pendingMask = SEM_BIT["network-state-change"] | SEM_BIT["wallet-state-change"]
  scheduleNext()

  return () => {
    stopStakingRefreshOrchestrator()
  }
}

export function stopStakingRefreshOrchestrator() {
  if ((process.env.NODE_ENV !== 'production')) {
    recordRuntimeTortureOrchestratorSessionStop(tortureOrchSessionId)
  }
  tortureOrchSessionId = null
  clearAdaptive()
  invalidationGen += 1
  abortCtrl?.abort()
  abortCtrl = null
  inFlight = false
  pendingMask = 0
  lastSuccessfulCommitWallMs = 0
  visibilityCleanup?.()
  visibilityCleanup = null
  releaseWs?.()
  releaseWs = null
  session = null
}

export function requestStakingBalanceRefresh(reason = "wallet-state-change") {
  notifyStakingRefresh(reason)
}

/** Phase 38 — DEV-only: orchestrator session probe for torture / lifecycle assertions. */
export function getStakingRefreshOrchestratorDevSnapshot(): Readonly<{
  hasSession: boolean
  tortureSessionId: string | null
  tortureEpoch: number
}> {
  return {
    hasSession: session !== null,
    tortureSessionId: tortureOrchSessionId,
    tortureEpoch: tortureOrchEpoch,
  }
}

/** Phase 41 — DEV-only: in-flight tick state for chaos recovery checks. */
export function getStakingRefreshOrchestratorChaosDevSnapshot(): Readonly<{
  hasSession: boolean
  inFlight: boolean
}> {
  return {
    hasSession: session !== null,
    inFlight,
  }
}
