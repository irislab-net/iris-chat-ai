/**
 * Phase 33 — **internal transition ordering** (sequence), distinct from public **`RuntimeTransitionLifecycle`**
 * (`runtimeTransitionController.ts`). Stages advance only via pure controller actions in **monotonic**
 * forward order ( **`markRuntimeSettled`** may close **`settled` → `idle`**; **`completeRuntimeTransition`** /
 * **`cancelRuntimeTransition`** reset to **`idle`** from any point). Production stays **`idle`** until a future
 * phase wires **`beginRuntimeTransition`** + marks.
 *
 * ## Runtime mutation boundary
 *
 * **`ActiveRuntimeSelection`** (React-visible runtime row) MUST be mutated **only** while
 * **`sequenceStage === "refresh_paused"`**, and the mutation MUST complete **before**
 * **`markRuntimeSwapped`** — i.e. only in the window after refresh is logically paused for the
 * transition and before the sequence advances to **`runtime_swapped`**. No other stage may change the
 * active selection. Call sites that will perform swaps should **`assertRuntimeSelectionMutationPhase`**
 * (DEV) immediately before mutating. **Phase 34:** the canonical protocol lives in **`executeRuntimeSwap`**
 * (`runtimeSwapEngine.ts`).
 *
 * ## Atomic visibility invariant (React)
 *
 * The passive runtime row exposed to React must **not** show a new **`runtimeKey` / `generation`**
 * while either:
 *
 * 1. balance refresh work is still permitted for the **previous** epoch (orchestrator / coordinator
 *    would still apply results for the old row), or
 * 2. async hooks could still **`canRuntimeOperationCommit`** stale results for the **previous**
 *    **`transitionGeneration`** / execution identity.
 *
 * Enforcing the mutation boundary above, plus **`transitionGeneration`** bumps at **`beginRuntimeTransition`**
 * and sequence gates on **`canRuntimeOperationCommit`**, keeps visibility aligned: readers see the old
 * row until the swap runs inside **`refresh_paused`**, then see the new row only after **`markRuntimeSwapped`**
 * advances the sequence (refresh remains blocked until **`resume_requested`**).
 *
 * **Phase 36:** DEV **`traceRuntimeInvariantViolation`** on failed sequence asserts.
 */

import { traceRuntimeInvariantViolation } from "@/staking/core/runtimeTransitionTelemetry"

export type RuntimeTransitionSequenceStage =
  | "idle"
  | "begin_requested"
  | "refresh_paused"
  | "runtime_swapped"
  | "resume_requested"
  | "settled"

/** Balance / orchestrator RPC refresh — blocked until **`resume_requested`** (Phase 33). */
export function sequenceStageAllowsBalanceRefresh(
  stage: RuntimeTransitionSequenceStage
): boolean {
  return (
    stage === "idle" ||
    stage === "resume_requested" ||
    stage === "settled"
  )
}

/**
 * Async React commits — warm resume: allow **`idle`**, **`resume_requested`**, **`settled`**; reject
 * **`begin_requested`**, **`refresh_paused`**, **`runtime_swapped`**.
 */
export function sequenceStageAllowsAsyncCommit(
  stage: RuntimeTransitionSequenceStage
): boolean {
  return sequenceStageAllowsBalanceRefresh(stage)
}

/** Only this stage may apply a new passive runtime row (before **`markRuntimeSwapped`**). */
export function sequenceStageAllowsRuntimeSelectionSwap(
  stage: RuntimeTransitionSequenceStage
): boolean {
  return stage === "refresh_paused"
}

export function devAssertRuntimeTransitionSequence(
  condition: boolean,
  message: string
): void {
  if ((process.env.NODE_ENV !== 'production') && !condition) {
    traceRuntimeInvariantViolation("sequence_ordering", { message })
    throw new Error(`[staking][runtimeTransitionSequence] ${message}`)
  }
}

/** DEV-only guard before mutating **`ActiveRuntimeSelection`** during a transition. */
export function assertRuntimeSelectionMutationPhase(
  stage: RuntimeTransitionSequenceStage
): void {
  devAssertRuntimeTransitionSequence(
    sequenceStageAllowsRuntimeSelectionSwap(stage),
    `runtime selection swap only allowed in "refresh_paused" (got ${stage})`
  )
}
