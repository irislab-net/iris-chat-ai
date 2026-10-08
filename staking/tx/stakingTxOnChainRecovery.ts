/**
 * Best-effort on-chain checks to reconcile persisted tx modal state after reload.
 *
 * ## Reconcile flow (audit)
 *
 * - **Tx hash:** `deriveCurrentTxHashFromSnapshot(snap)` (approve vs deposit vs withdraw).
 * - **Deployment row:** `resolveStakingDeploymentForReconcile(getStakingDeploymentRegistry(), context.deploymentId)`.
 * - **Context selection (Phase 29):** when **`snap.transactionRuntime`** is set, **`context`** is derived
 *   only from that frozen snapshot (`transactionRuntimeToReconcileContext`); otherwise use the explicit
 *   override (hydrate passes active runtime for legacy rows) or **`getDefaultPersistedTxReconcileContext`**.
 * - **Receipt read:** `getReceiptResolverForDeployment(deployment)` (`runtimeFamilyDispatch.ts`) → EVM uses the same registry-backed resolver as before; Tron is explicit unsupported (no EVM fallback).
 * - **Explorer URLs:** `createDeploymentExplorerResolver(deployment).transactionUrl(hash)` (EVM `/tx/`, Tron `/#/transaction/`).
 */
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { deriveCurrentTxHashFromSnapshot } from "@/staking/tx/transactionStatusSnapshotHelpers"
import { createDeploymentExplorerResolver } from "@/staking/core/createExplorerResolver"
import { getReceiptResolverForDeployment } from "@/staking/core/runtimeFamilyDispatch"
import { getDefaultPersistedTxReconcileContext } from "@/staking/core/defaultPersistedTxReconcileContext"
import {
  transactionRuntimeToReconcileContext,
  type PersistedTxReconcileContext,
} from "@/staking/core/persistenceTypes"
import {
  getStakingDeploymentRegistry,
  resolveStakingDeploymentForReconcile,
} from "@/staking/core/getStakingDeploymentRegistry"
import { resolveSuccessFeeDisplayLine } from "@/staking/tx"
import { stakingLifecycleTrace } from "@/staking/diagnostics"

export async function reconcilePersistedTxSnapshot(
  snap: TransactionStatusSnapshot,
  contextOverride?: PersistedTxReconcileContext
): Promise<TransactionStatusSnapshot> {
  const context =
    snap.transactionRuntime != null
      ? transactionRuntimeToReconcileContext(snap.transactionRuntime)
      : (contextOverride ?? getDefaultPersistedTxReconcileContext())
  const hash = deriveCurrentTxHashFromSnapshot(snap)?.trim()
  if (!hash) return snap

  const phase = snap.uiPhase
  if (
    phase !== "submitted" &&
    phase !== "confirming" &&
    phase !== "pending" &&
    !(hash && phase === "awaiting_signature")
  ) {
    return snap
  }

  const registry = getStakingDeploymentRegistry()
  const deployment = resolveStakingDeploymentForReconcile(registry, context.deploymentId)
  const explorerResolver = createDeploymentExplorerResolver(deployment)
  const receiptResolver = getReceiptResolverForDeployment(deployment)

  try {
    const summary = await receiptResolver.getReceiptSummary(hash)
    if (summary === null) {
      return snap
    }
    if (summary.status === "pending") {
      stakingLifecycleTrace("persistence", "reconcile_pending", { hash })
      return snap
    }
    if (summary.status === "success") {
      stakingLifecycleTrace("persistence", "reconcile_confirmed", { hash })
      const explorerUrl = explorerResolver.transactionUrl(hash)
      const successFee = resolveSuccessFeeDisplayLine({
        committed: snap.feeCanonical,
        fallbackLine:
          snap.successFeeLine.trim() !== ""
            ? snap.successFeeLine
            : snap.feeLine,
      })
      return {
        ...snap,
        uiPhase: "confirmed",
        dialogOpen: snap.dialogOpen,
        successAmountLabel: snap.successAmountLabel || snap.amountLabel,
        successFeeLine: successFee,
        successExplorerUrl: snap.successExplorerUrl ?? explorerUrl,
        feeCanonical: snap.feeCanonical,
        approveWirePhase: "done",
        depositWirePhase: "done",
        withdrawWirePhase: "done",
        errorMessage: "",
      }
    }
    stakingLifecycleTrace("persistence", "reconcile_failed_receipt", {
      hash,
      status: String(summary.rawStatus ?? ""),
    })
    return {
      ...snap,
      uiPhase: "failed",
      dialogOpen: snap.dialogOpen,
      errorMessage: "On-chain receipt indicates this transaction failed.",
    }
  } catch (e) {
    stakingLifecycleTrace("persistence", "reconcile_rpc_error", {
      message: e instanceof Error ? e.message : String(e),
    })
    return snap
  }
}
