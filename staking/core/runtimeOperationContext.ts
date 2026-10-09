import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"

/**
 * Phase 25–26 — **immutable runtime execution snapshot** for gas, contract reads, reconcile, and other
 * runtime-sensitive operations. Same shape as `ActiveRuntimeSelection`; separate alias marks the
 * contract “passed explicitly at call time” vs reading globals inside services.
 *
 * **Snapshot identity:** bind async work to **`runtimeKey` + `generation`** (not `runtimeKey` alone) so
 * future runtime switches can reuse a key without inheriting stale inflight results.
 *
 * **Not app mutable state:** no subscriptions, no async loading — derived once by the React tree
 * (`RuntimeSelectionProvider` / `useActiveRuntimeSelection`) and threaded into call sites.
 *
 * **Phase 28:** pair with **`useRuntimeTransitionSnapshot()`** when reads need **`transitionState`** /
 * shared **`latestCoordinatorSnapshotRef`** (Phase 31) / **`latestExecutionIdentityRef`** for coordinated guards.
 *
 * **Phase 29:** staking **transaction** flows copy **`buildTransactionRuntimeSnapshot(operationContext)`**
 * into modal state (`transactionRuntime`) at flow start — async receipt / explorer / persisted reconcile
 * prefer that frozen row over re-reading **`useActiveRuntimeSelection()`** mid-lifecycle.
 *
 * **Phase 30:** compare passive rows via **`deriveRuntimeExecutionTarget`** (`runtimeExecutionTarget.ts`) —
 * execution (gas, vault txs) must **`executionTargetEquals`** the frozen target when the modal supplies one.
 *
 * **Phase 31–35:** pair with **`runtimeTransitionCoordinator`** — prefer **`canRuntimeOperationCommit`** /
 * **`canRuntimeOperationRefresh`** via **`useRuntimeTransitionSnapshot().latestCoordinatorSnapshotRef`** over
 * ad-hoc identity checks; lifecycle + **`sequenceStage`** + **`transitionGeneration`** are controller-owned.
 */
export type RuntimeOperationContext = ActiveRuntimeSelection
