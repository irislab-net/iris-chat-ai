import type { RuntimeGeneration } from "@/staking/core/runtimeGeneration"
import type { DeploymentProviderRuntimeKey } from "@/staking/core/types"

/**
 * Phase 27 — **React async ownership** for runtime-sensitive work (`runtimeKey` + `generation`).
 *
 * **Not** provider handles, **not** module cache keys — only guards **setState** / UI propagation so
 * stale async completions do not commit after a future runtime transition (when generation bumps
 * or key changes). Compare against a ref updated every render to the latest snapshot identity.
 *
 * **Phase 28:** complements **`RuntimeTransitionSnapshot`** — guards React state; **`transitionState`**
 * lives on the transition snapshot, not here.
 *
 * **Phase 29–35 — tx modal / receipt:** frozen rows use **`executionTargetEquals`** vs active passive target;
 * legacy rows use **`canRuntimeOperationCommit`** with coordinator snapshots (**`latestCoordinatorSnapshotRef`**)
 * for hydrate + receipt terminal paths (includes **`transitionGeneration`** and **`sequenceStage`** gates).
 * **`runtimeExecutionIdentityEquals`** remains the low-level primitive inside **`runtimeTransitionCoordinator`**.
 */
export type RuntimeExecutionIdentity = Readonly<{
  runtimeKey: DeploymentProviderRuntimeKey
  generation: RuntimeGeneration
}>

export type RuntimeExecutionIdentitySource = Readonly<{
  runtimeKey: DeploymentProviderRuntimeKey
  generation: RuntimeGeneration
}>

export function deriveRuntimeExecutionIdentity(
  runtime: RuntimeExecutionIdentitySource
): RuntimeExecutionIdentity {
  return {
    runtimeKey: runtime.runtimeKey,
    generation: runtime.generation,
  }
}

export function runtimeExecutionIdentityEquals(
  a: RuntimeExecutionIdentity | null | undefined,
  b: RuntimeExecutionIdentity | null | undefined
): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return a.runtimeKey === b.runtimeKey && a.generation === b.generation
}
