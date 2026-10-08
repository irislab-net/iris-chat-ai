import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import {
  useActiveRuntimeSelection,
  useRuntimeTransitionControllerState,
} from "@/staking/core/runtimeSelectionContext"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { RuntimeExecutionIdentity } from "@/staking/core/runtimeExecutionGuard"
import type { RuntimeGeneration } from "@/staking/core/runtimeGeneration"
import {
  buildRuntimeTransitionCoordinatorSnapshot,
  type RuntimeTransitionCoordinatorSnapshot,
} from "@/staking/orchestration"
import {
  buildRuntimeTransitionSnapshot,
  type RuntimeTransitionSnapshot,
} from "@/staking/core/runtimeTransition"
import type { DeploymentProviderRuntimeKey } from "@/staking/core/types"
import type { RuntimeTransitionSequenceStage } from "@/staking/orchestration"
import { useMemo, useRef, type MutableRefObject } from "react"

/**
 * Phase 28–35 — **single source** for staking runtime transition + coordinator snapshot in React.
 *
 * Prefer **`latestCoordinatorSnapshotRef`** with **`canRuntimeOperationCommit`** / **`canRuntimeOperationRefresh`**
 * (`runtimeTransitionCoordinator.ts`) over ad-hoc **`runtimeExecutionIdentityEquals`** (Phase 31–35).
 */
export type RuntimeTransitionSnapshotApi = Readonly<{
  snapshot: RuntimeTransitionSnapshot
  coordinatorSnapshot: RuntimeTransitionCoordinatorSnapshot
  runtimeKey: DeploymentProviderRuntimeKey
  generation: RuntimeGeneration
  executionIdentity: RuntimeExecutionIdentity
  transitionState: RuntimeTransitionSnapshot["transitionState"]
  sequenceStage: RuntimeTransitionSequenceStage
  /** Always `.current === snapshot.executionIdentity` fields for the latest committed render. */
  latestExecutionIdentityRef: MutableRefObject<RuntimeExecutionIdentity>
  /** Latest coordinator snapshot for async commit / refresh gates (Phase 31–33). */
  latestCoordinatorSnapshotRef: MutableRefObject<RuntimeTransitionCoordinatorSnapshot>
  /** Full `ActiveRuntimeSelection` for gas / read factory / reconcile APIs. */
  operationContext: ActiveRuntimeSelection
}>

export function useRuntimeTransitionSnapshot(): RuntimeTransitionSnapshotApi {
  const operationContext = useActiveRuntimeSelection()
  const transitionController = useRuntimeTransitionControllerState()
  const snapshot = useMemo(
    () => buildRuntimeTransitionSnapshot(operationContext, transitionController),
    [operationContext, transitionController]
  )
  const coordinatorSnapshot = useMemo(
    () =>
      buildRuntimeTransitionCoordinatorSnapshot(
        operationContext,
        transitionController
      ),
    [operationContext, transitionController]
  )
  const latestExecutionIdentityRef = useRef(snapshot.executionIdentity)
  latestExecutionIdentityRef.current = snapshot.executionIdentity
  const latestCoordinatorSnapshotRef = useRef(coordinatorSnapshot)
  latestCoordinatorSnapshotRef.current = coordinatorSnapshot
  return useMemo(
    () => ({
      snapshot,
      coordinatorSnapshot,
      runtimeKey: operationContext.runtimeKey,
      generation: operationContext.generation,
      executionIdentity: snapshot.executionIdentity,
      transitionState: snapshot.transitionState,
      sequenceStage: snapshot.sequenceStage,
      latestExecutionIdentityRef,
      latestCoordinatorSnapshotRef,
      operationContext,
    }),
    [snapshot, coordinatorSnapshot, operationContext]
  )
}

/** Phase 25–27 — full staking runtime row; use **`useRuntimeTransitionSnapshot`** when you also need execution identity / ref. */
export function useRuntimeOperationContext(): RuntimeOperationContext {
  return useActiveRuntimeSelection()
}
