import {
  devAssertRuntimeTransitionSequence,
  type RuntimeTransitionSequenceStage,
} from "@/staking/orchestration"
import { traceControllerStateTransition } from "@/staking/core/runtimeTransitionTelemetry"

declare const stakingTransitionGenerationBrand: unique symbol

/**
 * Phase 32 — **transition epoch** (coordinated UI / refresh invalidation), distinct from
 * **`RuntimeGeneration`** (runtime identity lifecycle). Bumped by **`beginRuntimeTransition`**.
 */
export type TransitionGeneration = number & {
  readonly [stakingTransitionGenerationBrand]: true
}

export const STAKING_TRANSITION_GENERATION_INITIAL: TransitionGeneration =
  1 as TransitionGeneration

function bumpTransitionGeneration(
  g: TransitionGeneration
): TransitionGeneration {
  return (g + 1) as TransitionGeneration
}

/**
 * Phase 32 — canonical coordinated transition lifecycle (public; no picker UI yet).
 */
export type RuntimeTransitionLifecycle =
  | "stable"
  | "pausing"
  | "switching"
  | "resuming"

/**
 * Phase 32–34 — single source of truth: lifecycle, refresh pause, transition generation, and
 * **internal** **`sequenceStage`** (Phase 33). **Phase 34:** coordinated in-memory selection swaps use
 * **`executeRuntimeSwap`** (`runtimeSwapEngine.ts`) — these pure actions remain the only sequencing steps.
 *
 * **Phase 36:** DEV-only **`traceControllerStateTransition`** logs slice transitions (no production noise).
 */
export type RuntimeTransitionControllerState = Readonly<{
  lifecycle: RuntimeTransitionLifecycle
  transitionGeneration: TransitionGeneration
  refreshPaused: boolean
  sequenceStage: RuntimeTransitionSequenceStage
}>

function ctlSlice(c: RuntimeTransitionControllerState) {
  return {
    lifecycle: c.lifecycle,
    sequenceStage: c.sequenceStage,
    transitionGeneration: Number(c.transitionGeneration),
    refreshPaused: c.refreshPaused,
  }
}

function devTraceControllerTransition(
  event: string,
  prev: RuntimeTransitionControllerState,
  next: RuntimeTransitionControllerState
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  traceControllerStateTransition({
    event,
    prev: ctlSlice(prev),
    next: ctlSlice(next),
  })
}

export function createInitialRuntimeTransitionControllerState(): RuntimeTransitionControllerState {
  return {
    lifecycle: "stable",
    transitionGeneration: STAKING_TRANSITION_GENERATION_INITIAL,
    refreshPaused: false,
    sequenceStage: "idle",
  }
}

/** Begin coordinated transition: pause refresh, bump generation, enter sequence **`begin_requested`**. */
export function beginRuntimeTransition(
  state: RuntimeTransitionControllerState
): RuntimeTransitionControllerState {
  if (state.sequenceStage !== "idle") {
    devAssertRuntimeTransitionSequence(
      false,
      `beginRuntimeTransition expected sequenceStage "idle", got ${state.sequenceStage}`
    )
    return state
  }
  const next = {
    lifecycle: "pausing" as const,
    refreshPaused: true,
    transitionGeneration: bumpTransitionGeneration(state.transitionGeneration),
    sequenceStage: "begin_requested" as const,
  }
  devTraceControllerTransition("beginRuntimeTransition", state, next)
  return next
}

/** Complete lifecycle: stable + refresh on; sequence returns to **`idle`**. */
export function completeRuntimeTransition(
  state: RuntimeTransitionControllerState
): RuntimeTransitionControllerState {
  const next = {
    ...state,
    lifecycle: "stable" as const,
    refreshPaused: false,
    sequenceStage: "idle" as const,
  }
  devTraceControllerTransition("completeRuntimeTransition", state, next)
  return next
}

/** Abort: stable + refresh on; sequence **`idle`**. */
export function cancelRuntimeTransition(
  state: RuntimeTransitionControllerState
): RuntimeTransitionControllerState {
  const next = {
    ...state,
    lifecycle: "stable" as const,
    refreshPaused: false,
    sequenceStage: "idle" as const,
  }
  devTraceControllerTransition("cancelRuntimeTransition", state, next)
  return next
}

/** `begin_requested` → `refresh_paused` (refresh pause is already true after **`beginRuntimeTransition`**). */
export function markRuntimeRefreshPaused(
  state: RuntimeTransitionControllerState
): RuntimeTransitionControllerState {
  if (state.sequenceStage !== "begin_requested") {
    devAssertRuntimeTransitionSequence(
      false,
      `markRuntimeRefreshPaused expected "begin_requested", got ${state.sequenceStage}`
    )
    return state
  }
  const next = { ...state, sequenceStage: "refresh_paused" as const }
  devTraceControllerTransition("markRuntimeRefreshPaused", state, next)
  return next
}

/** `refresh_paused` → `runtime_swapped` (call **after** passive runtime row has been updated). */
export function markRuntimeSwapped(
  state: RuntimeTransitionControllerState
): RuntimeTransitionControllerState {
  if (state.sequenceStage !== "refresh_paused") {
    devAssertRuntimeTransitionSequence(
      false,
      `markRuntimeSwapped expected "refresh_paused", got ${state.sequenceStage}`
    )
    return state
  }
  const next = {
    ...state,
    sequenceStage: "runtime_swapped" as const,
    lifecycle: "switching" as const,
  }
  devTraceControllerTransition("markRuntimeSwapped", state, next)
  return next
}

/** `runtime_swapped` → `resume_requested`; clears refresh pause (**`lifecycle` → `resuming`**) for warm resume. */
export function markRuntimeResumeRequested(
  state: RuntimeTransitionControllerState
): RuntimeTransitionControllerState {
  if (state.sequenceStage !== "runtime_swapped") {
    devAssertRuntimeTransitionSequence(
      false,
      `markRuntimeResumeRequested expected "runtime_swapped", got ${state.sequenceStage}`
    )
    return state
  }
  const next = {
    ...state,
    sequenceStage: "resume_requested" as const,
    refreshPaused: false,
    lifecycle: "resuming" as const,
  }
  devTraceControllerTransition("markRuntimeResumeRequested", state, next)
  return next
}

/**
 * `resume_requested` → `settled` → **`idle`** (two legal calls; **`settled` returns to **`idle`**).
 */
export function markRuntimeSettled(
  state: RuntimeTransitionControllerState
): RuntimeTransitionControllerState {
  if (state.sequenceStage === "resume_requested") {
    const next = { ...state, sequenceStage: "settled" as const }
    devTraceControllerTransition("markRuntimeSettled_to_settled", state, next)
    return next
  }
  if (state.sequenceStage === "settled") {
    const next = {
      ...state,
      sequenceStage: "idle" as const,
      lifecycle: "stable" as const,
      refreshPaused: false,
    }
    devTraceControllerTransition("markRuntimeSettled_to_idle", state, next)
    return next
  }
  devAssertRuntimeTransitionSequence(
    false,
    `markRuntimeSettled expected "resume_requested" or "settled", got ${state.sequenceStage}`
  )
  return state
}

export type { RuntimeTransitionSequenceStage } from "@/staking/orchestration"

/** Re-export for call sites that gate swaps (DEV assert). */
export { assertRuntimeSelectionMutationPhase } from "@/staking/orchestration"
