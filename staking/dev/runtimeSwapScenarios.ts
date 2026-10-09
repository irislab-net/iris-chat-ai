import type { TransactionRuntimeSnapshot } from "@/staking/core/persistenceTypes"
import { deriveRuntimeExecutionIdentity } from "@/staking/core/runtimeExecutionGuard"
import {
  createActiveRuntimeSelection,
  type ActiveRuntimeSelection,
} from "@/staking/core/runtimeSelection"
import type { RuntimeSwapRequest } from "@/staking/orchestration"
import { evaluateRuntimeSwapPolicy } from "@/staking/orchestration"
import type { RuntimeSwapTxModalSurface } from "@/staking/orchestration"
import { getStakingDeploymentRegistry } from "@/staking/core/getStakingDeploymentRegistry"
import { deriveProviderRuntimeKey } from "@/staking/core/providerRuntime"
import type { StakingDeploymentConfig } from "@/staking/core/types"
import {
  beginRuntimeTransition,
  createInitialRuntimeTransitionControllerState,
} from "@/staking/core/runtimeTransitionController"

/**
 * Phase 37 — named stress scenarios (documentation + programmatic ids).
 * Integration scenarios assume `installRuntimeSwapStressHarness` is active.
 */
export const RUNTIME_SWAP_STRESS_SCENARIO_IDS = [
  "swap_during_balance_refresh",
  "swap_during_gas_estimate_window",
  "swap_during_persisted_hydrate_window",
  "swap_during_tx_confirmation_wait_simulated",
  "rapid_double_swap_same_deployment",
  "swap_cancel_recover_after_policy_denial",
  "swap_while_modal_open_must_deny",
  "policy_denies_non_quiescent_controller",
  "policy_denies_refresh_paused_inconsistent",
  "registry_runtime_key_uniqueness_audit",
] as const

export type RuntimeSwapStressScenarioId = (typeof RUNTIME_SWAP_STRESS_SCENARIO_IDS)[number]

export type RuntimeSwapStressScenarioMeta = Readonly<{
  id: RuntimeSwapStressScenarioId
  summary: string
}>

export const RUNTIME_SWAP_STRESS_SCENARIO_METAS: RuntimeSwapStressScenarioMeta[] = [
  {
    id: "swap_during_balance_refresh",
    summary:
      "Notify balance refresh then swap on the next microtask — exercises orchestrator overlap with swap sequencing.",
  },
  {
    id: "swap_during_gas_estimate_window",
    summary:
      "Swap while gas estimate depth telemetry is active — pair with gas hook `devRuntimeStressGasEstimateBegin`.",
  },
  {
    id: "swap_during_persisted_hydrate_window",
    summary:
      "Timing placeholder: real hydrate requires persisted tx session; use manual flow or extend with test persistence.",
  },
  {
    id: "swap_during_tx_confirmation_wait_simulated",
    summary:
      "Same path as `swap_while_modal_open_must_deny` (stress tx-modal override) but does not assert denial reason — use for timing experiments.",
  },
  {
    id: "rapid_double_swap_same_deployment",
    summary: "Two same-deployment swaps back-to-back — generation must bump twice; controller ends idle.",
  },
  {
    id: "swap_cancel_recover_after_policy_denial",
    summary: "Policy denial leaves selection unchanged; controller recovers via `cancelRuntimeTransition` path.",
  },
  {
    id: "swap_while_modal_open_must_deny",
    summary: "Override modal to open + frozen runtime + non-terminal phase — expect `policy_tx_modal_active_non_terminal`.",
  },
  {
    id: "policy_denies_non_quiescent_controller",
    summary: "Pure policy probe: `begin_requested` controller row must be denied as `policy_transition_not_quiescent`.",
  },
  {
    id: "policy_denies_refresh_paused_inconsistent",
    summary: "Pure policy probe: stable lifecycle + refreshPaused + idle sequence is `policy_refresh_state_inconsistent`.",
  },
  {
    id: "registry_runtime_key_uniqueness_audit",
    summary: "Walk staking deployment registry keys — DEV warn if duplicate runtime keys appear in normalized rows.",
  },
]

/** Same chain deployment, new passive row — bumps `generation` through the swap engine. */
export function buildSameDeploymentSwapRequest(
  current: ActiveRuntimeSelection
): RuntimeSwapRequest {
  return { nextRuntime: createActiveRuntimeSelection(current.deployment) }
}

/** First optional deployment with a different provider runtime key than `current`, if any. */
export function pickAlternateDeploymentForStressSwap(
  current: ActiveRuntimeSelection
): StakingDeploymentConfig | null {
  const reg = getStakingDeploymentRegistry()
  const curKey = deriveProviderRuntimeKey(current.deployment)
  return reg.deployments.find(d => deriveProviderRuntimeKey(d) !== curKey) ?? null
}

export function buildAlternateRuntimeSelectionOrSame(
  current: ActiveRuntimeSelection
): ActiveRuntimeSelection {
  const alt = pickAlternateDeploymentForStressSwap(current)
  return alt != null ? createActiveRuntimeSelection(alt) : current
}

export function buildAlternateOrSameSwapRequest(
  current: ActiveRuntimeSelection
): RuntimeSwapRequest {
  const next = buildAlternateRuntimeSelectionOrSame(current)
  return { nextRuntime: next }
}

/** Synthetic modal surface: dialog open, frozen runtime present, non-terminal UI phase. */
export function buildStressBlockingTxModalSurface(
  current: ActiveRuntimeSelection
): RuntimeSwapTxModalSurface {
  const transactionRuntime: TransactionRuntimeSnapshot = {
    runtimeKey: current.runtimeKey,
    generation: current.generation,
    deploymentId: current.deployment.id.trim(),
    chainFamily: current.deployment.chainFamily,
    caip2: current.deployment.caip2,
    executionIdentity: deriveRuntimeExecutionIdentity(current),
  }
  return {
    dialogOpen: true,
    transactionRuntime,
    uiPhase: "awaiting_signature",
  }
}

/** Policy-only: controller mid `begin_requested` (non-quiescent). */
export function buildNonQuiescentControllerForPolicyProbe() {
  return beginRuntimeTransition(createInitialRuntimeTransitionControllerState())
}

/** Policy-only: inconsistent refresh pause while stable + idle. */
export function buildInconsistentRefreshPausedControllerForPolicyProbe() {
  return {
    ...createInitialRuntimeTransitionControllerState(),
    refreshPaused: true,
  }
}

export function evaluatePolicyForStressNonQuiescent(
  current: ActiveRuntimeSelection,
  next: StakingDeploymentConfig
) {
  return evaluateRuntimeSwapPolicy({
    currentSelection: current,
    currentController: buildNonQuiescentControllerForPolicyProbe(),
    nextDeployment: next,
    txModalSurface: {
      dialogOpen: false,
      transactionRuntime: null,
      uiPhase: null,
    },
  })
}

export function evaluatePolicyForStressInconsistentRefresh(
  current: ActiveRuntimeSelection,
  next: StakingDeploymentConfig
) {
  return evaluateRuntimeSwapPolicy({
    currentSelection: current,
    currentController: buildInconsistentRefreshPausedControllerForPolicyProbe(),
    nextDeployment: next,
    txModalSurface: {
      dialogOpen: false,
      transactionRuntime: null,
      uiPhase: null,
    },
  })
}
