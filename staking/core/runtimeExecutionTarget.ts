import {
  deriveRuntimeExecutionIdentity,
  runtimeExecutionIdentityEquals,
  type RuntimeExecutionIdentity,
} from "@/staking/core/runtimeExecutionGuard"
import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import type {
  ChainFamily,
  DeploymentProviderRuntimeKey,
} from "@/staking/core/types"

/**
 * Phase 30 — **immutable execution target**: the passive runtime row under which staking execution
 * (gas, approve, deposit, withdraw) is intended. No providers or signers — compare-only surface.
 *
 * **Phase 42 — PRODUCTION-FROZEN:** execution target comparisons gate modal/gas drift; change only for bugs.
 * See `docs/staking-runtime-phase42-stabilization.md`.
 */
export type RuntimeExecutionTarget = Readonly<{
  runtimeKey: DeploymentProviderRuntimeKey
  deploymentId: string
  chainFamily: ChainFamily
  caip2: string
  executionIdentity: RuntimeExecutionIdentity
}>

export function deriveRuntimeExecutionTarget(
  runtime: ActiveRuntimeSelection
): RuntimeExecutionTarget {
  const d = runtime.deployment
  return {
    runtimeKey: runtime.runtimeKey,
    deploymentId: d.id.trim(),
    chainFamily: d.chainFamily,
    caip2: d.caip2.trim(),
    executionIdentity: deriveRuntimeExecutionIdentity(runtime),
  }
}

export function executionTargetEquals(
  a: RuntimeExecutionTarget | null | undefined,
  b: RuntimeExecutionTarget | null | undefined
): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return (
    a.runtimeKey === b.runtimeKey &&
    a.deploymentId === b.deploymentId &&
    a.chainFamily === b.chainFamily &&
    a.caip2 === b.caip2 &&
    runtimeExecutionIdentityEquals(a.executionIdentity, b.executionIdentity)
  )
}

/** Fail closed when modal / caller supplied a frozen target that no longer matches passive runtime. */
export function assertExecutionTargetMatchesActive(
  expected: RuntimeExecutionTarget,
  active: RuntimeExecutionTarget
): void {
  if (executionTargetEquals(expected, active)) return
  throw new Error(
    `[staking] Execution target mismatch (Phase 30): frozen session targets deploymentId=${expected.deploymentId} ` +
      `caip2=${expected.caip2} but active runtime is deploymentId=${active.deploymentId} caip2=${active.caip2}. ` +
      "Close the dialog and try again."
  )
}
