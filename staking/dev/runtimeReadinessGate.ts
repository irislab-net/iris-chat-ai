/**
 * Phase 39 — DEV-only internal readiness gate before any internal runtime picker.
 *
 * Does not add picker UI, enable Tron execution, or persist runtime selection.
 * Inspect-only: torture counters, registry snapshots, telemetry tallies, orchestrator
 * session fields, and passive vs coordinator identity (no swaps, no RPC).
 *
 * ## Recommended manual sequence (browser console, `VITE_RUNTIME_TORTURE` on)
 *
 * 1. `await window.__STAKING_RUNTIME_TORTURE__.runLongSession()`
 * 2. `await window.__STAKING_RUNTIME_TORTURE__.runSwapStorm()`
 * 3. `await window.__STAKING_RUNTIME_TORTURE__.runHydrateLoop()` — wallet must be connected
 * 4. Wait for quiescence (a few seconds)
 * 5. `await window.__STAKING_RUNTIME_TORTURE__.runReadinessGate()`
 * 6. `window.__STAKING_RUNTIME_TORTURE__.dumpRuntimeState()`
 *
 * Optional: call `captureReadinessRegistryBaseline()` after a known-good registry shape
 * if the default session baseline is too old.
 */
import { getStakingRefreshOrchestratorDevSnapshot } from "@/staking/refresh"
import { getStakingProviderRegistryDevSnapshot } from "@/staking/core/providerRegistry"
import { deriveRuntimeExecutionIdentity, runtimeExecutionIdentityEquals } from "@/staking/core/runtimeExecutionGuard"
import { buildRuntimeTransitionCoordinatorSnapshot } from "@/staking/orchestration"
import {
  getRuntimeReadinessViolationSnapshot,
  getRuntimeStakingGasEstimateAsyncDepth,
  getRuntimeTortureCounterSnapshot,
} from "@/staking/core/runtimeTransitionTelemetry"
import type { RuntimeStressHarnessBundle } from "@/staking/dev/runtimeSwapStressHarness"
import type { RegistrySizeBaseline } from "@/staking/orchestration/runtimeLifecycleAssertions"

const DEFAULT_REGISTRY_MAX_DELTA = 4

let sessionRegistryBaseline: RegistrySizeBaseline | null = null

/** Called when DEV torture window installs; does not touch runtime swap state. */
export function installReadinessGateSessionBaseline(): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  sessionRegistryBaseline = getStakingProviderRegistryDevSnapshot()
}

/** Reset growth reference (e.g. after deliberate multi-runtime registry growth). */
export function captureReadinessRegistryBaseline(): RegistrySizeBaseline {
  const snap = getStakingProviderRegistryDevSnapshot()
  sessionRegistryBaseline = snap
  return snap
}

export type RuntimeReadinessGateCheckSeverity = "info" | "warning" | "error"

export type RuntimeReadinessGateCheck = Readonly<{
  id: string
  ok: boolean
  severity: RuntimeReadinessGateCheckSeverity
  message: string
  data?: unknown
}>

export type RuntimeReadinessGateResult = Readonly<{
  ok: boolean
  checks: RuntimeReadinessGateCheck[]
}>

export type EvaluateRuntimeReadinessGateInput = Readonly<{
  getBundle: () => RuntimeStressHarnessBundle
  /** Milliseconds to settle before sampling stale-async counter; then idle window for drift. */
  settleIdleMs?: number
  maxRegistryDelta?: number
}>

function pushRegistryDeltaChecks(
  checks: RuntimeReadinessGateCheck[],
  baseline: RegistrySizeBaseline,
  cur: ReturnType<typeof getStakingProviderRegistryDevSnapshot>,
  maxDelta: number
): void {
  const keys = [
    { id: "registry_evm_json_rpc_growth", key: "evmJsonRpcProviders" as const, label: "EVM JSON-RPC provider map" },
    { id: "registry_tron_http_growth", key: "tronHttpProviders" as const, label: "Tron HTTP provider map" },
    { id: "registry_receipt_resolver_growth", key: "receiptResolvers" as const, label: "receipt resolver map" },
    { id: "registry_ws_growth", key: "wsProviders" as const, label: "WebSocket provider map" },
  ]
  for (const { id, key, label } of keys) {
    const delta = cur[key] - baseline[key]
    const ok = delta <= maxDelta
    checks.push({
      id,
      ok,
      severity: ok ? "info" : "error",
      message: ok
        ? `${label} growth within bound (Δ=${delta}, max=${maxDelta}).`
        : `${label} grew by ${delta} (max ${maxDelta}); possible leak or unbounded registration.`,
      data: { baseline: baseline[key], current: cur[key], delta },
    })
  }
}

/**
 * Pass/fail readiness evaluation. Does not mutate runtime, registries, or orchestrator
 * (read-only snapshots + optional timers only).
 */
export async function evaluateRuntimeReadinessGate(
  input: EvaluateRuntimeReadinessGateInput
): Promise<RuntimeReadinessGateResult> {
  const checks: RuntimeReadinessGateCheck[] = []
  const settleIdleMs = input.settleIdleMs ?? 450
  const maxDelta = input.maxRegistryDelta ?? DEFAULT_REGISTRY_MAX_DELTA

  if (!(process.env.NODE_ENV !== 'production')) {
    checks.push({
      id: "dev_only",
      ok: false,
      severity: "error",
      message: "Readiness gate runs in development builds only.",
    })
    return { ok: false, checks }
  }

  const torture = getRuntimeTortureCounterSnapshot()
  const violations = getRuntimeReadinessViolationSnapshot()
  const orch = getStakingRefreshOrchestratorDevSnapshot()
  const gasDepth = getRuntimeStakingGasEstimateAsyncDepth()
  const curRegistry = getStakingProviderRegistryDevSnapshot()
  const baseline = sessionRegistryBaseline ?? curRegistry

  pushRegistryDeltaChecks(checks, baseline, curRegistry, maxDelta)

  const gasOk = gasDepth === 0
  checks.push({
    id: "gas_estimate_async_depth_idle",
    ok: gasOk,
    severity: gasOk ? "info" : "error",
    message: gasOk
      ? "No in-flight nested gas estimate depth (idle)."
      : `Gas estimate async depth is ${gasDepth}; wait for estimates to finish before gating.`,
    data: { gasEstimateAsyncDepth: gasDepth },
  })

  const missingDevSessionId = orch.hasSession && orch.tortureSessionId == null
  const tortureGhostActive =
    !orch.hasSession && torture.orchestratorActiveSessionId != null
  const tortureCounterMissingWhileOrchRunning =
    orch.hasSession &&
    orch.tortureSessionId != null &&
    torture.orchestratorActiveSessionId == null
  const tortureIdMismatch =
    orch.hasSession &&
    orch.tortureSessionId != null &&
    torture.orchestratorActiveSessionId != null &&
    torture.orchestratorActiveSessionId !== orch.tortureSessionId
  const orchOk =
    !missingDevSessionId &&
    !tortureGhostActive &&
    !tortureIdMismatch &&
    !tortureCounterMissingWhileOrchRunning
  checks.push({
    id: "orchestrator_session_consistency",
    ok: orchOk,
    severity: orchOk ? "info" : "error",
    message: orchOk
      ? "Orchestrator session and torture session id are consistent (or no session)."
      : missingDevSessionId
        ? "Orchestrator has an active session but DEV session id is missing."
        : tortureGhostActive
          ? "Torture thinks an orchestrator session is active but orchestrator has no session."
          : tortureCounterMissingWhileOrchRunning
            ? "Orchestrator is running but torture active session id is null (telemetry skew)."
            : "Orchestrator DEV session id disagrees with torture active session id.",
    data: { orch, tortureOrchestratorActiveSessionId: torture.orchestratorActiveSessionId },
  })

  const vMount = torture.vaultMount
  const vUnmount = torture.vaultUnmount
  const vaultDiff = vMount - vUnmount
  const vaultOk = vaultDiff >= 0 && vaultDiff <= 1
  const vaultSeverity: RuntimeReadinessGateCheckSeverity = vaultOk
    ? "info"
    : vaultDiff > 1 || vaultDiff < 0
      ? "error"
      : "warning"
  checks.push({
    id: "vault_mount_unmount_balance",
    ok: vaultOk,
    severity: vaultSeverity,
    message: vaultOk
      ? `Vault mount/unmount plausible (mount=${vMount}, unmount=${vUnmount}, Δ=${vaultDiff}; Δ=1 means one mounted vault).`
      : `Vault mount/unmount skew: mount=${vMount}, unmount=${vUnmount} (Δ=${vaultDiff}).`,
    data: { vaultMount: vMount, vaultUnmount: vUnmount },
  })

  const staleBefore = torture.staleAsyncCommitDenied
  if (settleIdleMs > 0) {
    await new Promise<void>(r => setTimeout(r, Math.max(0, Math.floor(settleIdleMs / 2))))
  }
  const staleMid = getRuntimeTortureCounterSnapshot().staleAsyncCommitDenied
  if (settleIdleMs > 0) {
    await new Promise<void>(r => setTimeout(r, Math.max(0, Math.ceil(settleIdleMs / 2))))
  }
  const staleAfter = getRuntimeTortureCounterSnapshot().staleAsyncCommitDenied
  const driftDuringIdle = staleAfter > staleMid || staleMid > staleBefore
  const staleOk = !driftDuringIdle
  checks.push({
    id: "stale_async_commit_idle_drift",
    ok: staleOk,
    severity: staleOk ? "info" : "error",
    message: staleOk
      ? "Stale async-commit denied counter did not increase during settle window (idle)."
      : "Stale async-commit denied counter increased during settle window; async work may still be racing transitions.",
    data: { staleBefore, staleMid, staleAfter, settleIdleMs },
  })

  const hydrateOk = torture.hydrateSamples > 0 && torture.reconcileSamples > 0
  checks.push({
    id: "hydrate_reconcile_timings_present",
    ok: hydrateOk,
    severity: hydrateOk ? "info" : "warning",
    message: hydrateOk
      ? "Hydrate/reconcile samples recorded (runHydrateLoop was exercised)."
      : "No hydrate/reconcile samples yet; run runHydrateLoop() for this check to pass.",
    data: {
      hydrateSamples: torture.hydrateSamples,
      reconcileSamples: torture.reconcileSamples,
      hydrateMsAvg:
        torture.hydrateSamples > 0 ? torture.hydrateMsTotal / torture.hydrateSamples : null,
      reconcileMsAvg:
        torture.reconcileSamples > 0 ? torture.reconcileMsTotal / torture.reconcileSamples : null,
    },
  })

  const prodInvariantOk = violations.invariantProdLike === 0
  checks.push({
    id: "invariant_prod_like_violations",
    ok: prodInvariantOk,
    severity: prodInvariantOk ? "info" : "error",
    message: prodInvariantOk
      ? "No production-path invariant violations (non-stress / non-torture codes)."
      : `Production-like invariant violations: ${violations.invariantProdLike} (see console debug [staking][runtimeTransition] invariant_violation).`,
    data: violations,
  })

  if (violations.invariantTorture > 0) {
    checks.push({
      id: "invariant_torture_events",
      ok: true,
      severity: "warning",
      message: `Torture-scoped invariant events recorded (${violations.invariantTorture}); informational after deliberate torture.`,
      data: { count: violations.invariantTorture },
    })
  }

  if (violations.invariantStress > 0) {
    checks.push({
      id: "invariant_stress_events",
      ok: true,
      severity: "info",
      message: `Stress harness invariant signals (ignored for pass/fail): ${violations.invariantStress}.`,
      data: { count: violations.invariantStress },
    })
  }

  const desyncOk = violations.selectionCoordinatorDesync === 0
  checks.push({
    id: "selection_coordinator_desync",
    ok: desyncOk,
    severity: desyncOk ? "info" : "error",
    message: desyncOk
      ? "No runtime selection vs coordinator desync events recorded."
      : `Selection/coordinator desync count: ${violations.selectionCoordinatorDesync}.`,
    data: { count: violations.selectionCoordinatorDesync },
  })

  const bundle = input.getBundle()
  const coord = buildRuntimeTransitionCoordinatorSnapshot(
    bundle.selection,
    bundle.transitionController
  )
  const selId = deriveRuntimeExecutionIdentity(bundle.selection)
  const alignOk = runtimeExecutionIdentityEquals(selId, coord.activeExecutionIdentity)
  checks.push({
    id: "passive_coordinator_identity_snapshot",
    ok: alignOk,
    severity: alignOk ? "info" : "error",
    message: alignOk
      ? "Passive selection execution identity matches coordinator snapshot at gate time."
      : "Passive selection and coordinator execution identity disagree at gate time.",
    data: {
      selection: selId,
      coordinator: coord.activeExecutionIdentity,
      lifecycle: coord.lifecycle,
      sequenceStage: coord.sequenceStage,
    },
  })

  if (sessionRegistryBaseline == null) {
    checks.push({
      id: "registry_baseline_defaulted",
      ok: true,
      severity: "info",
      message:
        "Registry baseline was unset; compared growth vs current snapshot (no historical reference). Call captureReadinessRegistryBaseline() after a warm-up if needed.",
      data: { baseline: baseline },
    })
  }

  const ok = !checks.some(c => !c.ok && c.severity === "error")
  return { ok, checks }
}

/** Console output for a gate result (DEV only; user-invoked). */
export function printRuntimeReadinessGateResult(result: RuntimeReadinessGateResult): void {
  if (!(process.env.NODE_ENV !== 'production')) return
   
  console.groupCollapsed("[staking][runtimeReadinessGate]")
   
  console.log("ok:", result.ok)
  for (const c of result.checks) {
    const line = `[${c.severity}] ${c.id}: ${c.message}`
    const rest = c.data !== undefined ? [c.data] : []
    if (!c.ok) {
      if (c.severity === "error") {
         
        console.error(line, ...rest)
      } else {
         
        console.warn(line, ...rest)
      }
    } else if (c.severity === "warning") {
       
      console.warn(line, ...rest)
    } else {
       
      console.log(line, ...rest)
    }
  }
   
  console.groupEnd()
}
