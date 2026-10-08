import { stakingTransactionExplorerUrlForChain } from "@/lib/stakingExplorer"
import {
  resolveFrozenExecutionTarget,
  type TransactionRuntimeSnapshot,
} from "@/staking/core/persistenceTypes"
import { createDeploymentExplorerResolver } from "@/staking/core/createExplorerResolver"
import {
  getStakingDeploymentRegistry,
  resolveStakingDeploymentForReconcile,
} from "@/staking/core/getStakingDeploymentRegistry"

/**
 * Phase 50 — explorer URL for a tx hash from the frozen staking runtime (deployment registry),
 * never from the live passive row after `transactionRuntime` exists.
 */
export function stakingTxExplorerUrlForFrozenRuntime(
  transactionRuntime: TransactionRuntimeSnapshot | null | undefined,
  txHash: string,
  /** Used only when `transactionRuntime` is absent (legacy modal). */
  legacyWalletChainId: number | null
): string | null {
  const h = txHash.trim()
  if (!h) return null
  if (transactionRuntime != null) {
    const depId = resolveFrozenExecutionTarget(transactionRuntime).deploymentId
    const registry = getStakingDeploymentRegistry()
    const deployment = resolveStakingDeploymentForReconcile(registry, depId)
    return createDeploymentExplorerResolver(deployment).transactionUrl(h)
  }
  if (legacyWalletChainId != null) {
    return stakingTransactionExplorerUrlForChain(legacyWalletChainId, h) ?? null
  }
  return null
}
