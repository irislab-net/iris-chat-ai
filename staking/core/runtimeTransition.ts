import type { TransactionRuntimeSnapshot } from "@/staking/core/persistenceTypes"

import {

  deriveRuntimeExecutionIdentity,

  type RuntimeExecutionIdentity,

} from "@/staking/core/runtimeExecutionGuard"

import { deriveRuntimeExecutionTarget } from "@/staking/core/runtimeExecutionTarget"

import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"

import type { RuntimeTransitionControllerState } from "@/staking/core/runtimeTransitionController"

import type { RuntimeTransitionSequenceStage } from "@/staking/orchestration"



/**

 * Phase 28 — **coordinated runtime transition** descriptor (no mutable switching yet).

 *

 * **`transitionState`** mirrors the coordinator row: **`"stable"`** only when lifecycle is stable and

 * refresh is not paused; otherwise **`"transitioning"`** (mid-coordinated transition / pause).

 *

 * **Phase 31–34:** coordinator **`transitionGeneration`** / **`refreshPaused`** / **`lifecycle`** /

 * **`sequenceStage`** and **`canRuntimeOperationCommit`** live in **`runtimeTransitionCoordinator.ts`** —

 * this file keeps the lightweight **`RuntimeTransitionSnapshot`** row for React.

 */

export type RuntimeTransitionState = "stable" | "transitioning"



export type RuntimeTransitionSnapshot = Readonly<{

  executionIdentity: RuntimeExecutionIdentity

  transitionState: RuntimeTransitionState

  /** Phase 33 — internal sequence stage (same as coordinator row). */

  sequenceStage: RuntimeTransitionSequenceStage

}>



function deriveTransitionStateFromController(

  controller: RuntimeTransitionControllerState

): RuntimeTransitionState {

  return controller.lifecycle === "stable" && !controller.refreshPaused

    ? "stable"

    : "transitioning"

}



export function buildRuntimeTransitionSnapshot(

  runtime: Pick<ActiveRuntimeSelection, "runtimeKey" | "generation">,

  controller: RuntimeTransitionControllerState

): RuntimeTransitionSnapshot {

  return {

    executionIdentity: deriveRuntimeExecutionIdentity(runtime),

    transitionState: deriveTransitionStateFromController(controller),

    sequenceStage: controller.sequenceStage,

  }

}



/** Phase 29–30 — bind a staking tx lifecycle to the runtime row active when the flow opened. */

export function buildTransactionRuntimeSnapshot(

  runtime: ActiveRuntimeSelection

): TransactionRuntimeSnapshot {

  const d = runtime.deployment

  return {

    runtimeKey: runtime.runtimeKey,

    generation: runtime.generation,

    deploymentId: d.id.trim(),

    chainFamily: d.chainFamily,

    caip2: d.caip2.trim(),

    executionIdentity: deriveRuntimeExecutionIdentity(runtime),

    executionTarget: deriveRuntimeExecutionTarget(runtime),

  }

}

