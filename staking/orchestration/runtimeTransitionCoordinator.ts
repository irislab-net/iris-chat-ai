import {
  runtimeExecutionIdentityEquals,
  type RuntimeExecutionIdentity,
} from "@/staking/core/runtimeExecutionGuard"
import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import {
  STAKING_TRANSITION_GENERATION_INITIAL,
  type RuntimeTransitionControllerState,
  type RuntimeTransitionLifecycle,
  type TransitionGeneration,
} from "@/staking/core/runtimeTransitionController"
import type { RuntimeTransitionState } from "@/staking/core/runtimeTransition"
import {
  sequenceStageAllowsAsyncCommit,
  sequenceStageAllowsBalanceRefresh,
  type RuntimeTransitionSequenceStage,
} from "@/staking/orchestration/runtimeTransitionSequence"
import {
  recordRuntimeTortureStaleAsyncCommitDenied,
  traceRuntimeAsyncCommitRejected,
} from "@/staking/core/runtimeTransitionTelemetry"
import {
  buildRuntimeTelemetryEvent,
  emitRuntimeTelemetry,
  isRuntimeTelemetryEmitEnabled,
} from "@/lib/runtimeTelemetry/runtimeTelemetry"

/**
 * Phase 31–36 — pure coordinator snapshot: derived from **`RuntimeTransitionControllerState`** +
 * passive runtime identity — compare-only; no wallet/RPC.
 *
 * **Phase 42 — PRODUCTION-FROZEN:** treat as stable API for async gates; change only for correctness bugs.
 * See `docs/staking-runtime-phase42-stabilization.md`.
 */
export type RuntimeTransitionCoordinatorSnapshot = Readonly<{
  activeExecutionIdentity: RuntimeExecutionIdentity
  lifecycle: RuntimeTransitionLifecycle
  /** Phase 33 — internal ordering stage (not the same as **`lifecycle`**). */
  sequenceStage: RuntimeTransitionSequenceStage
  /** Phase 28 row — derived from **`lifecycle`** + **`refreshPaused`** for legacy readers. */
  transitionState: RuntimeTransitionState
  transitionGeneration: TransitionGeneration
  refreshPaused: boolean
}>

function deriveCoordinatorTransitionState(
  lifecycle: RuntimeTransitionLifecycle,
  refreshPaused: boolean
): RuntimeTransitionState {
  return lifecycle === "stable" && !refreshPaused ? "stable" : "transitioning"
}

export function buildRuntimeTransitionCoordinatorSnapshot(
  runtime: Pick<ActiveRuntimeSelection, "runtimeKey" | "generation">,
  controller: RuntimeTransitionControllerState
): RuntimeTransitionCoordinatorSnapshot {
  const activeExecutionIdentity = {
    runtimeKey: runtime.runtimeKey,
    generation: runtime.generation,
  } satisfies RuntimeExecutionIdentity
  return {
    activeExecutionIdentity,
    lifecycle: controller.lifecycle,
    sequenceStage: controller.sequenceStage,
    transitionState: deriveCoordinatorTransitionState(
      controller.lifecycle,
      controller.refreshPaused
    ),
    transitionGeneration: controller.transitionGeneration,
    refreshPaused: controller.refreshPaused,
  }
}

/** Identity-only coordinator row (prefer full **`buildRuntimeTransitionCoordinatorSnapshot`** when controller is known). */
export function coordinatorSnapshotFromExecutionIdentity(
  executionIdentity: RuntimeExecutionIdentity,
  transitionGeneration: TransitionGeneration = STAKING_TRANSITION_GENERATION_INITIAL
): RuntimeTransitionCoordinatorSnapshot {
  return {
    activeExecutionIdentity: executionIdentity,
    lifecycle: "stable",
    sequenceStage: "idle",
    transitionState: "stable",
    transitionGeneration,
    refreshPaused: false,
  }
}

/** Re-export for call sites that only need the generation constant. */
export type { TransitionGeneration } from "@/staking/core/runtimeTransitionController"
export { STAKING_TRANSITION_GENERATION_INITIAL } from "@/staking/core/runtimeTransitionController"
export type { RuntimeTransitionSequenceStage } from "@/staking/orchestration/runtimeTransitionSequence"

/**
 * Balance / orchestrator refresh — Phase 33: blocked for sequence stages before **`resume_requested`**
 * (see **`sequenceStageAllowsBalanceRefresh`**); also requires **`!refreshPaused`** and **`stable`** or
 * **`resuming`** lifecycle (not **`pausing`** / **`switching`**).
 */
export function canRuntimeOperationRefresh(
  latest: RuntimeTransitionCoordinatorSnapshot
): boolean {
  if (latest.refreshPaused) return false
  if (!sequenceStageAllowsBalanceRefresh(latest.sequenceStage)) return false
  if (latest.lifecycle === "pausing" || latest.lifecycle === "switching") return false
  return latest.lifecycle === "stable" || latest.lifecycle === "resuming"
}

/**
 * Async React commits — Phase 33: rejects **`begin_requested`**, **`refresh_paused`**, **`runtime_swapped`**;
 * allows **`idle`**, **`resume_requested`**, **`settled`**; rejects **`pausing`** / **`switching`** lifecycle; requires matching
 * **`transitionGeneration`** and execution identity vs capture.
 */
export function canRuntimeOperationCommit(
  captured: RuntimeTransitionCoordinatorSnapshot,
  latest: RuntimeTransitionCoordinatorSnapshot
): boolean {
  if (latest.lifecycle === "pausing" || latest.lifecycle === "switching") return false
  if (!sequenceStageAllowsAsyncCommit(latest.sequenceStage)) return false
  if (captured.transitionGeneration !== latest.transitionGeneration) return false
  return runtimeExecutionIdentityEquals(
    captured.activeExecutionIdentity,
    latest.activeExecutionIdentity
  )
}

export function summarizeCoordinatorSnapshotForTelemetry(
  s: RuntimeTransitionCoordinatorSnapshot
): Record<string, unknown> {
  return {
    runtimeKey: s.activeExecutionIdentity.runtimeKey,
    generation: Number(s.activeExecutionIdentity.generation),
    transitionGeneration: Number(s.transitionGeneration),
    lifecycle: s.lifecycle,
    sequenceStage: s.sequenceStage,
    refreshPaused: s.refreshPaused,
  }
}

/** Phase 36 — human-readable first matching commit denial (DEV diagnostics). */
export function explainCanRuntimeOperationCommitDenied(
  captured: RuntimeTransitionCoordinatorSnapshot,
  latest: RuntimeTransitionCoordinatorSnapshot
): string | null {
  if (canRuntimeOperationCommit(captured, latest)) return null
  if (latest.lifecycle === "pausing" || latest.lifecycle === "switching") {
    return `lifecycle_block:${latest.lifecycle}`
  }
  if (!sequenceStageAllowsAsyncCommit(latest.sequenceStage)) {
    return `sequence_block:${latest.sequenceStage}`
  }
  if (captured.transitionGeneration !== latest.transitionGeneration) {
    return `transition_generation:${Number(captured.transitionGeneration)}->${Number(latest.transitionGeneration)}`
  }
  if (
    !runtimeExecutionIdentityEquals(
      captured.activeExecutionIdentity,
      latest.activeExecutionIdentity
    )
  ) {
    return "execution_identity_mismatch"
  }
  return "unknown_commit_denial"
}

/** Phase 36 — human-readable first matching refresh denial (DEV diagnostics). */
export function explainCanRuntimeOperationRefreshDenied(
  latest: RuntimeTransitionCoordinatorSnapshot
): string | null {
  if (canRuntimeOperationRefresh(latest)) return null
  if (latest.refreshPaused) return "refresh_paused"
  if (!sequenceStageAllowsBalanceRefresh(latest.sequenceStage)) {
    return `sequence_refresh_block:${latest.sequenceStage}`
  }
  if (latest.lifecycle === "pausing" || latest.lifecycle === "switching") {
    return `lifecycle_refresh_block:${latest.lifecycle}`
  }
  return "unknown_refresh_denial"
}

/** Phase 36 — DEV-only trace when async commit gates reject (no production spam). */
export function maybeDevTraceRuntimeAsyncCommitRejected(
  surface: string,
  captured: RuntimeTransitionCoordinatorSnapshot | null | undefined,
  latest: RuntimeTransitionCoordinatorSnapshot | null | undefined
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  if (!captured || !latest) return
  if (canRuntimeOperationCommit(captured, latest)) return
  const reason =
    explainCanRuntimeOperationCommitDenied(captured, latest) ?? "unknown"
  traceRuntimeAsyncCommitRejected({
    surface,
    reason,
    captured: summarizeCoordinatorSnapshotForTelemetry(captured),
    latest: summarizeCoordinatorSnapshotForTelemetry(latest),
  })
}

/**
 * Phase 36 — same as **`canRuntimeOperationCommit`** plus DEV-only rejection telemetry.
 */
export function canRuntimeOperationCommitWithDevTrace(
  surface: string,
  captured: RuntimeTransitionCoordinatorSnapshot | null | undefined,
  latest: RuntimeTransitionCoordinatorSnapshot | null | undefined
): boolean {
  if (!captured || !latest) return false
  const ok = canRuntimeOperationCommit(captured, latest)
  if (!ok) {
    maybeDevTraceRuntimeAsyncCommitRejected(surface, captured, latest)
    recordRuntimeTortureStaleAsyncCommitDenied(surface)
    if (isRuntimeTelemetryEmitEnabled()) {
      const token = (
        explainCanRuntimeOperationCommitDenied(captured, latest) ?? "commit_denied"
      ).slice(0, 64)
      emitRuntimeTelemetry(
        buildRuntimeTelemetryEvent(
          "repeated_async_commit_denied",
          "warning",
          {
            runtimeKey: latest.activeExecutionIdentity.runtimeKey,
            lifecycle: latest.lifecycle,
            sequenceStage: latest.sequenceStage,
            transitionGeneration: Number(latest.transitionGeneration),
            reasonToken: token,
          }
        )
      )
    }
  }
  return ok
}
