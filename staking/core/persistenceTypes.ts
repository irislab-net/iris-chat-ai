import type { RuntimeExecutionIdentity } from "@/staking/core/runtimeExecutionGuard"
import type { RuntimeGeneration } from "@/staking/core/runtimeGeneration"
import type { RuntimeExecutionTarget } from "@/staking/core/runtimeExecutionTarget"
import type {
  ChainFamily,
  DeploymentProviderRuntimeKey,
} from "@/staking/core/types"

/**
 * Phase 29 — **frozen staking tx runtime**: identity of the passive / selected runtime row at the
 * moment a transaction flow started (approve / deposit / withdraw). Reconcile, explorer URLs, and
 * receipt completion must prefer this over “whatever runtime is active now” when the snapshot carries it.
 *
 * **Phase 30:** includes optional **`executionTarget`** (canonical); older JSON / in-memory rows may omit
 * it — use **`resolveFrozenExecutionTarget`**.
 *
 * Persisted session JSON may omit this field (no storage version bump); absent → legacy reconcile paths.
 */
export type TransactionRuntimeSnapshot = Readonly<{
  runtimeKey: DeploymentProviderRuntimeKey
  generation: RuntimeGeneration
  deploymentId: string
  chainFamily: ChainFamily
  caip2: string
  executionIdentity: RuntimeExecutionIdentity
  executionTarget?: RuntimeExecutionTarget
}>

export function resolveFrozenExecutionTarget(
  tx: TransactionRuntimeSnapshot
): RuntimeExecutionTarget {
  if (tx.executionTarget != null) return tx.executionTarget
  return {
    runtimeKey: tx.runtimeKey,
    deploymentId: tx.deploymentId.trim(),
    chainFamily: tx.chainFamily,
    caip2: tx.caip2.trim(),
    executionIdentity: tx.executionIdentity,
  }
}

export function transactionRuntimeToReconcileContext(
  txRuntime: TransactionRuntimeSnapshot
): PersistedTxReconcileContext {
  const t = resolveFrozenExecutionTarget(txRuntime)
  return {
    deploymentId: t.deploymentId.trim(),
    caip2: t.caip2.trim(),
    chainFamily: t.chainFamily,
  }
}

/**
 * Deployment-scoped context for persisted-tx reconcile (foundation only).
 * FUTURE: select receipt resolver + explorer from registry using these fields.
 */
export type PersistedTxReconcileContext = {
  deploymentId: string
  caip2: string
  chainFamily: ChainFamily
}

/** Normalized receipt outcome for reconcile (EVM + passive Tron Phase 21). */
export type TxReceiptSummary = {
  status: "pending" | "success" | "failure"
  rawStatus?: unknown
}

/**
 * Chain-scoped receipt read (foundation seam).
 * EVM today; Tron uses `buildTronChainReceiptResolver` (Phase 21) — same reconcile surface, different wire codec.
 */
export interface ChainReceiptResolver {
  readonly family: ChainFamily

  getReceiptSummary(
    txHash: string,
    signal?: AbortSignal
  ): Promise<TxReceiptSummary | null>
}
