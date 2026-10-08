/**
 * Phase 34–42 — **PRODUCTION-FROZEN** (Phase 42): change only for bugfixes / regressions to the swap protocol.
 * See `docs/staking-runtime-phase42-stabilization.md` for invariants and rollout policy.
 */
import {
  cloneActiveRuntimeSelectionForSwap,
  type ActiveRuntimeSelection,
} from "@/staking/core/runtimeSelection"
import {
  evaluateRuntimeSwapPolicy,
  type RuntimeSwapPolicyDenialReason,
  type RuntimeSwapTxModalSurface,
  getRuntimeSwapTxModalSurfaceForPolicy,
} from "@/staking/orchestration/runtimeSwapPolicy"
import {
  beginRuntimeTransition,
  cancelRuntimeTransition,
  markRuntimeRefreshPaused,
  markRuntimeResumeRequested,
  markRuntimeSettled,
  markRuntimeSwapped,
  type RuntimeTransitionControllerState,
} from "@/staking/core/runtimeTransitionController"
import {
  assertRuntimeSelectionMutationPhase,
  sequenceStageAllowsRuntimeSelectionSwap,
} from "@/staking/orchestration/runtimeTransitionSequence"
import {
  buildRuntimeSwapStressTraceFieldsForSelection,
  traceRuntimeSwapDenied,
  traceRuntimeSwapPolicyDenied,
  traceRuntimeInvariantViolation,
  traceRuntimeTransition,
  type RuntimeSwapStressTelemetryAttachment,
} from "@/staking/core/runtimeTransitionTelemetry"
import { deriveRuntimeExecutionIdentity } from "@/staking/core/runtimeExecutionGuard"
import { reportStakingInvariantViolation } from "@/lib/stakingSentry"

export { isRuntimeSwapEntryAllowed } from "@/staking/orchestration/runtimeSwapPolicy"
export type { RuntimeSwapTxModalSurface } from "@/staking/orchestration/runtimeSwapPolicy"

function traceSwapStage(
  event: string,
  selection: Pick<ActiveRuntimeSelection, "runtimeKey" | "generation">,
  controller: RuntimeTransitionControllerState,
  stress: RuntimeSwapStressTelemetryAttachment | null | undefined
): void {
  const id = deriveRuntimeExecutionIdentity(selection)
  const stressFields =
    (process.env.NODE_ENV !== 'production') && stress
      ? buildRuntimeSwapStressTraceFieldsForSelection(stress, selection)
      : undefined
  traceRuntimeTransition({
    event,
    lifecycle: controller.lifecycle,
    sequenceStage: controller.sequenceStage,
    transitionGeneration: Number(controller.transitionGeneration),
    runtimeGeneration: Number(selection.generation),
    runtimeKey: selection.runtimeKey,
    executionIdentity: {
      runtimeKey: id.runtimeKey,
      generation: Number(id.generation),
    },
    ...(stressFields ? { stress: stressFields } : {}),
  })
}

/**
 * Phase 34 — internal swap request: caller supplies the **target** passive row; the engine bumps
 * **`generation`** from the **current** row and re-derives read context + capabilities from
 * **`nextRuntime.deployment`** (no React / providers inside this module).
 */
export type RuntimeSwapRequest = Readonly<{
  nextRuntime: ActiveRuntimeSelection
}>

export type RuntimeSwapFailureReason =
  | RuntimeSwapPolicyDenialReason
  | "swap_disabled_outside_dev"
  | "runtime_switch_rollout_disabled"
  | "swap_protocol_entry_denied"
  | "begin_rejected"
  | "refresh_paused_rejected"
  | "mutation_phase_invalid"
  | "swapped_rejected"
  | "resume_rejected"
  | "first_settle_rejected"
  | "second_settle_rejected"
  | "final_invariant_failed"

export type RuntimeSwapResult =
  | {
      ok: true
      nextSelection: ActiveRuntimeSelection
      nextController: RuntimeTransitionControllerState
    }
  | {
      ok: false
      reason: RuntimeSwapFailureReason
      recoverController: RuntimeTransitionControllerState
    }

/**
 * Phase 34–36 — canonical in-memory swap protocol (pure):
 *
 * **`evaluateRuntimeSwapPolicy`** (no partial controller transitions on deny) →
 * **`beginRuntimeTransition`** → **`markRuntimeRefreshPaused`** → **atomic selection replacement**
 * (DEV: **`assertRuntimeSelectionMutationPhase`**) → **`markRuntimeSwapped`** → **`markRuntimeResumeRequested`**
 * → **`markRuntimeSettled`** → **`markRuntimeSettled`**.
 *
 * **Phase 36–37:** DEV **`console.debug`** traces policy denials, protocol failures, and per-stage transition rows;
 * optional **`stressTelemetry`** enriches traces with scenario id/name, swap id, elapsed timing, and runtime before/after.
 *
 * On any failure: **`recoverController`** is **`cancelRuntimeTransition(...)`** from the failing
 * controller snapshot — stable + idle + **`refreshPaused: false`**; selection is unchanged by the caller
 * when **`ok: false`**.
 */
export function executeRuntimeSwap(params: {
  currentSelection: ActiveRuntimeSelection
  currentController: RuntimeTransitionControllerState
  request: RuntimeSwapRequest
  /** When set, overrides the registered tx-modal surface for this evaluation only. */
  txModalSurface?: RuntimeSwapTxModalSurface | null
  walletChainId?: number | null
  /** Phase 37 — DEV stress harness: merged into transition / denial telemetry. */
  stressTelemetry?: RuntimeSwapStressTelemetryAttachment | null
}): RuntimeSwapResult {
  const { currentSelection, currentController, request } = params
  const stress = params.stressTelemetry ?? null
  const stressFieldsForSelection = () =>
    (process.env.NODE_ENV !== 'production') && stress
      ? buildRuntimeSwapStressTraceFieldsForSelection(stress, currentSelection)
      : undefined

  const fail = (
    reason: RuntimeSwapFailureReason,
    at: RuntimeTransitionControllerState
  ): RuntimeSwapResult => {
    if (
      !(process.env.NODE_ENV !== 'production') &&
      typeof reason === "string" &&
      !reason.startsWith("policy_")
    ) {
      reportStakingInvariantViolation(
        `runtime_swap_${reason}`,
        {
          lifecycle: at.lifecycle,
          sequence_stage: at.sequenceStage,
          refresh_paused: at.refreshPaused,
          target_runtime_key: request.nextRuntime.runtimeKey,
        },
        {
          runtimeKey: currentSelection.runtimeKey,
          deploymentId: currentSelection.deployment.id,
          chainFamily: currentSelection.deployment.chainFamily,
          fatal: reason === "final_invariant_failed",
        }
      )
    }
    if (
      (process.env.NODE_ENV !== 'production') &&
      typeof reason === "string" &&
      !reason.startsWith("policy_")
    ) {
      const sf = stressFieldsForSelection()
      traceRuntimeSwapDenied({
        reason,
        currentRuntimeKey: currentSelection.runtimeKey,
        targetRuntimeKey: request.nextRuntime.runtimeKey,
        controller: {
          lifecycle: at.lifecycle,
          sequenceStage: at.sequenceStage,
          transitionGeneration: Number(at.transitionGeneration),
          refreshPaused: at.refreshPaused,
        },
        ...(sf ? { stress: sf } : {}),
      })
    }
    return {
      ok: false,
      reason,
      recoverController: cancelRuntimeTransition(at),
    }
  }

  const policy = evaluateRuntimeSwapPolicy({
    currentSelection,
    currentController,
    nextDeployment: request.nextRuntime.deployment,
    txModalSurface: params.txModalSurface ?? null,
    walletChainId: params.walletChainId,
  })
  if (!policy.allowed) {
    if ((process.env.NODE_ENV !== 'production')) {
      const sf = stressFieldsForSelection()
      traceRuntimeSwapPolicyDenied({
        reason: policy.reason,
        current: currentSelection,
        target: request.nextRuntime,
        controller: {
          lifecycle: currentController.lifecycle,
          sequenceStage: currentController.sequenceStage,
          transitionGeneration: Number(currentController.transitionGeneration),
          refreshPaused: currentController.refreshPaused,
        },
        txModal: params.txModalSurface ?? getRuntimeSwapTxModalSurfaceForPolicy(),
        ...(sf ? { stress: sf } : {}),
      })
    }
    return fail(policy.reason, currentController)
  }

  let c = beginRuntimeTransition(currentController)
  if (c.sequenceStage !== "begin_requested") {
    return fail("begin_rejected", c)
  }
  traceSwapStage("swap_after_begin", currentSelection, c, stress)

  c = markRuntimeRefreshPaused(c)
  if (c.sequenceStage !== "refresh_paused") {
    return fail("refresh_paused_rejected", c)
  }
  traceSwapStage("swap_after_refresh_paused", currentSelection, c, stress)

  if (!sequenceStageAllowsRuntimeSelectionSwap(c.sequenceStage)) {
    return fail("mutation_phase_invalid", c)
  }

  try {
    assertRuntimeSelectionMutationPhase(c.sequenceStage)
  } catch {
    if ((process.env.NODE_ENV !== 'production')) {
      traceRuntimeInvariantViolation("mutation_phase_assert_failed", {
        sequenceStage: c.sequenceStage,
        lifecycle: c.lifecycle,
        transitionGeneration: Number(c.transitionGeneration),
      })
    }
    return fail("mutation_phase_invalid", c)
  }

  const nextSelection = cloneActiveRuntimeSelectionForSwap(
    currentSelection,
    request.nextRuntime
  )

  c = markRuntimeSwapped(c)
  if (c.sequenceStage !== "runtime_swapped") {
    return fail("swapped_rejected", c)
  }
  traceSwapStage("swap_after_runtime_swapped", nextSelection, c, stress)

  c = markRuntimeResumeRequested(c)
  if (c.sequenceStage !== "resume_requested") {
    return fail("resume_rejected", c)
  }
  traceSwapStage("swap_after_resume_requested", nextSelection, c, stress)

  c = markRuntimeSettled(c)
  if (c.sequenceStage !== "settled") {
    return fail("first_settle_rejected", c)
  }
  traceSwapStage("swap_after_first_settled", nextSelection, c, stress)

  c = markRuntimeSettled(c)
  if (
    c.sequenceStage !== "idle" ||
    c.lifecycle !== "stable" ||
    c.refreshPaused
  ) {
    return fail("final_invariant_failed", c)
  }
  traceSwapStage("swap_complete", nextSelection, c, stress)

  return { ok: true, nextSelection, nextController: c }
}
