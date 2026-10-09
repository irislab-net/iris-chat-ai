import type { PersistedTxReconcileContext } from "@/staking/core/persistenceTypes"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import { getDefaultRuntimeSelection } from "@/staking/core/runtimeSelectionDefaults"

/** Phase 25 — build reconcile identity from an explicit runtime snapshot (no global read in callers). */
export function persistedTxReconcileContextFromRuntime(
  runtime: RuntimeOperationContext
): PersistedTxReconcileContext {
  const d = runtime.deployment
  return {
    deploymentId: d.id.trim(),
    caip2: d.caip2.trim(),
    chainFamily: d.chainFamily,
  }
}

/** Reconcile context for non-React callers (defaults via passive selection — legacy-primary today). */
export function getDefaultPersistedTxReconcileContext(): PersistedTxReconcileContext {
  return persistedTxReconcileContextFromRuntime(getDefaultRuntimeSelection())
}
