/**
 * Phase 37 — DEV-only, opt-in internal runtime swap stress harness (`VITE_RUNTIME_SWAP_STRESS`).
 * Loaded via dynamic import from `RuntimeSelectionProvider` only when the flag is enabled.
 * **Phase 38:** composed with `runtimeTortureSuite` when `VITE_RUNTIME_TORTURE` or stress is on (`bootstrapStakingRuntimeDevTooling`).
 * **Phase 39:** pass/fail readiness gate lives in `runtimeReadinessGate.ts` (`runReadinessGate` on `window.__STAKING_RUNTIME_TORTURE__`).
 */
import { notifyStakingRefresh, registerStakingRefreshOrchestratorStressTickProbe } from "@/staking/refresh"
import {
  buildRuntimeTransitionCoordinatorSnapshot,
  summarizeCoordinatorSnapshotForTelemetry,
} from "@/staking/orchestration"
import { deriveRuntimeExecutionIdentity, runtimeExecutionIdentityEquals } from "@/staking/core/runtimeExecutionGuard"
import { getStakingDeploymentRegistry } from "@/staking/core/getStakingDeploymentRegistry"
import { deriveProviderRuntimeKey } from "@/staking/core/providerRuntime"
import type { RuntimeSwapRequest, RuntimeSwapResult } from "@/staking/orchestration"
import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import { setRuntimeSwapStressTxModalSurfaceOverride } from "@/staking/orchestration"
import type { RuntimeTransitionControllerState } from "@/staking/core/runtimeTransitionController"
import {
  assignRuntimeSwapStressTelemetry,
  traceRuntimeInvariantViolation,
  traceRuntimeStressLeak,
} from "@/staking/core/runtimeTransitionTelemetry"
import {
  buildAlternateOrSameSwapRequest,
  buildSameDeploymentSwapRequest,
  buildStressBlockingTxModalSurface,
  evaluatePolicyForStressInconsistentRefresh,
  evaluatePolicyForStressNonQuiescent,
  type RuntimeSwapStressScenarioId,
  RUNTIME_SWAP_STRESS_SCENARIO_METAS,
} from "@/staking/dev/runtimeSwapScenarios"

export type RuntimeStressHarnessBundle = Readonly<{
  selection: ActiveRuntimeSelection
  transitionController: RuntimeTransitionControllerState
}>

export type InstallRuntimeSwapStressHarnessInput = Readonly<{
  swap: (req: RuntimeSwapRequest) => RuntimeSwapResult
  getBundle: () => RuntimeStressHarnessBundle
}>

let swapSeq = 0
const scheduledHandles: number[] = []

function nextSwapId(): string {
  swapSeq += 1
  return `stress-${swapSeq}`
}

function scenarioLabel(id: RuntimeSwapStressScenarioId): string {
  return RUNTIME_SWAP_STRESS_SCENARIO_METAS.find(m => m.id === id)?.summary ?? id
}

function withStressTelemetry(
  bundle: RuntimeStressHarnessBundle,
  scenarioId: RuntimeSwapStressScenarioId,
  swapFn: () => RuntimeSwapResult
): RuntimeSwapResult {
  const sel = bundle.selection
  assignRuntimeSwapStressTelemetry({
    scenarioId,
    scenarioName: scenarioLabel(scenarioId),
    swapId: nextSwapId(),
    startedAtMs: performance.now(),
    runtimeKeyBefore: sel.runtimeKey,
    generationBefore: Number(sel.generation),
  })
  return swapFn()
}

/** Phase 37 — post-swap invariant: passive selection matches coordinator execution identity. */
export function verifyStressSelectionCoordinatorAligned(
  bundle: RuntimeStressHarnessBundle
): boolean {
  const coord = buildRuntimeTransitionCoordinatorSnapshot(
    bundle.selection,
    bundle.transitionController
  )
  const ok = runtimeExecutionIdentityEquals(
    deriveRuntimeExecutionIdentity(bundle.selection),
    coord.activeExecutionIdentity
  )
  if (!ok) {
    traceRuntimeInvariantViolation("stress_selection_coordinator_mismatch", {
      selection: deriveRuntimeExecutionIdentity(bundle.selection),
      coordinator: coord.activeExecutionIdentity,
      lifecycle: coord.lifecycle,
      sequenceStage: coord.sequenceStage,
    })
  }
  return ok
}

function auditRegistryRuntimeKeys(): void {
  const reg = getStakingDeploymentRegistry()
  const keys = new Map<string, string>()
  for (const d of reg.deployments) {
    const k = deriveProviderRuntimeKey(d)
    const prev = keys.get(k)
    if (prev != null) {
      traceRuntimeStressLeak("registry_duplicate_runtime_key", {
        runtimeKey: k,
        deploymentIds: [prev, d.id.trim()],
      })
    } else {
      keys.set(k, d.id.trim())
    }
  }
}

export function installRuntimeSwapStressHarness(
  input: InstallRuntimeSwapStressHarnessInput
): () => void {
  if (!(process.env.NODE_ENV !== 'production')) {
    return () => {}
  }

  const { swap, getBundle } = input

  registerStakingRefreshOrchestratorStressTickProbe(info => {
    const latest = info.latestCoordinator
    if (latest == null) return
    if (!info.refreshAllowed) return
    if (!info.sessionExecutionIdentity) return
    if (
      runtimeExecutionIdentityEquals(
        info.sessionExecutionIdentity,
        latest.activeExecutionIdentity
      )
    ) {
      return
    }
    traceRuntimeStressLeak("orchestrator_tick_identity_skew_while_refresh_allowed", {
      session: {
        runtimeKey: info.sessionExecutionIdentity.runtimeKey,
        generation: Number(info.sessionExecutionIdentity.generation),
      },
      latest: summarizeCoordinatorSnapshotForTelemetry(latest),
    })
  })

  const api = {
    runScenario(id: RuntimeSwapStressScenarioId): RuntimeSwapResult | boolean | void {
      const bundle = getBundle()
      switch (id) {
        case "swap_during_balance_refresh": {
          notifyStakingRefresh("stress-balance-refresh")
          queueMicrotask(() => {
            const b = getBundle()
            const r = withStressTelemetry(b, id, () =>
              swap(buildSameDeploymentSwapRequest(b.selection))
            )
            if (r.ok) verifyStressSelectionCoordinatorAligned(getBundle())
          })
          return
        }
        case "swap_during_gas_estimate_window": {
          return withStressTelemetry(bundle, id, () =>
            swap(buildSameDeploymentSwapRequest(bundle.selection))
          )
        }
        case "swap_during_persisted_hydrate_window": {
          traceRuntimeStressLeak("scenario_skipped_manual_hydrate", {
            scenarioId: id,
            hint: "Requires persisted staking tx session + hydrate path; run with persisted row manually.",
          })
          return
        }
        case "swap_during_tx_confirmation_wait_simulated":
        case "swap_while_modal_open_must_deny": {
          setRuntimeSwapStressTxModalSurfaceOverride(
            buildStressBlockingTxModalSurface(bundle.selection)
          )
          try {
            const r = withStressTelemetry(bundle, id, () =>
              swap(buildSameDeploymentSwapRequest(bundle.selection))
            )
            if (
              id === "swap_while_modal_open_must_deny" &&
              !(!r.ok && r.reason === "policy_tx_modal_active_non_terminal")
            ) {
              traceRuntimeInvariantViolation("stress_modal_deny_reason_unexpected", {
                result: r,
              })
            }
            return r
          } finally {
            setRuntimeSwapStressTxModalSurfaceOverride(null)
          }
        }
        case "rapid_double_swap_same_deployment": {
          const r1 = withStressTelemetry(bundle, id, () =>
            swap(buildSameDeploymentSwapRequest(bundle.selection))
          )
          if (!r1.ok) return r1
          const b2 = getBundle()
          const r2 = withStressTelemetry(b2, id, () =>
            swap(buildSameDeploymentSwapRequest(b2.selection))
          )
          if (r2.ok) verifyStressSelectionCoordinatorAligned(getBundle())
          return r2
        }
        case "swap_cancel_recover_after_policy_denial": {
          const genBefore = Number(bundle.selection.generation)
          setRuntimeSwapStressTxModalSurfaceOverride(
            buildStressBlockingTxModalSurface(bundle.selection)
          )
          try {
            const r = withStressTelemetry(bundle, id, () =>
              swap(buildSameDeploymentSwapRequest(bundle.selection))
            )
            if (r.ok) {
              traceRuntimeInvariantViolation("stress_policy_deny_expected_fail", {
                scenarioId: id,
              })
            }
            const after = getBundle()
            if (Number(after.selection.generation) !== genBefore) {
              traceRuntimeInvariantViolation("stress_selection_mutated_on_policy_deny", {
                before: genBefore,
                after: Number(after.selection.generation),
              })
            }
            return r
          } finally {
            setRuntimeSwapStressTxModalSurfaceOverride(null)
          }
        }
        case "policy_denies_non_quiescent_controller": {
          const p = evaluatePolicyForStressNonQuiescent(
            bundle.selection,
            bundle.selection.deployment
          )
          if (p.allowed || p.reason !== "policy_transition_not_quiescent") {
            traceRuntimeInvariantViolation("stress_policy_non_quiescent_unexpected", {
              result: p,
            })
            return false
          }
          return true
        }
        case "policy_denies_refresh_paused_inconsistent": {
          const p = evaluatePolicyForStressInconsistentRefresh(
            bundle.selection,
            bundle.selection.deployment
          )
          if (p.allowed || p.reason !== "policy_refresh_state_inconsistent") {
            traceRuntimeInvariantViolation("stress_policy_refresh_inconsistent_unexpected", {
              result: p,
            })
            return false
          }
          return true
        }
        case "registry_runtime_key_uniqueness_audit": {
          auditRegistryRuntimeKeys()
          return
        }
        default: {
          const _exhaustive: never = id
          void _exhaustive
        }
      }
    },

    async runScenarioAsync(
      id: RuntimeSwapStressScenarioId,
      waitMs = 0
    ): Promise<RuntimeSwapResult | boolean | void> {
      if (waitMs > 0) await new Promise(r => setTimeout(r, waitMs))
      return api.runScenario(id)
    },

    async runRefreshThenSwapScript(
      waitBetweenMs: number
    ): Promise<RuntimeSwapResult | void> {
      notifyStakingRefresh("stress-scripted-refresh")
      if (waitBetweenMs > 0) await new Promise(r => setTimeout(r, waitBetweenMs))
      const b = getBundle()
      const r = withStressTelemetry(b, "swap_during_balance_refresh", () =>
        swap(buildSameDeploymentSwapRequest(b.selection))
      )
      if (r.ok) verifyStressSelectionCoordinatorAligned(getBundle())
      return r
    },

    scheduleRepeatedSwaps(intervalMs: number, iterations: number): void {
      let n = 0
      const h = window.setInterval(() => {
        n += 1
        const b = getBundle()
        withStressTelemetry(b, "rapid_double_swap_same_deployment", () =>
          swap(buildAlternateOrSameSwapRequest(b.selection))
        )
        if (n >= iterations) {
          window.clearInterval(h)
          const i = scheduledHandles.indexOf(h)
          if (i !== -1) scheduledHandles.splice(i, 1)
        }
      }, intervalMs)
      scheduledHandles.push(h)
    },

    cancelScheduled(): void {
      for (const h of scheduledHandles) {
        window.clearInterval(h)
      }
      scheduledHandles.length = 0
    },

    verifySelectionCoordinatorAligned: () =>
      verifyStressSelectionCoordinatorAligned(getBundle()),

    auditRegistryRuntimeKeys,

    forceSwapNextMicrotask(): void {
      queueMicrotask(() => {
        const b = getBundle()
        withStressTelemetry(b, "swap_during_balance_refresh", () =>
          swap(buildSameDeploymentSwapRequest(b.selection))
        )
      })
    },

    listScenarios: () => RUNTIME_SWAP_STRESS_SCENARIO_METAS,
  }

  const w = typeof globalThis !== "undefined" ? (globalThis as unknown as Window) : undefined
  if (w != null) {
    Object.defineProperty(w, "__STAKING_RUNTIME_SWAP_STRESS__", {
      value: api,
      configurable: true,
      enumerable: false,
    })
  }

  return () => {
    registerStakingRefreshOrchestratorStressTickProbe(null)
    api.cancelScheduled()
    setRuntimeSwapStressTxModalSurfaceOverride(null)
    if (w != null) {
      Reflect.deleteProperty(w, "__STAKING_RUNTIME_SWAP_STRESS__")
    }
  }
}
