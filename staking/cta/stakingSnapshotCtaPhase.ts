import type { TransactionStatusScenario } from "@/staking/tx/types/transactionStatusScenario"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { deriveDepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import type { StakingCtaTxPhase } from "@/types/stakingCtaTxPhase"

/**
 * Single derived phase for staking primary CTA + spinners from the authoritative
 * `TransactionStatusProvider` snapshot (plus form scenario).
 */
export function deriveStakingCtaTxPhaseFromSnapshot(
  scenario: TransactionStatusScenario,
  snap: TransactionStatusSnapshot
): StakingCtaTxPhase {
  if (snap.scenario !== scenario) {
    return "idle"
  }

  if (!snap.dialogOpen) {
    if (snap.uiPhase === "submitted") return "submitted"
    if (snap.uiPhase === "confirming") return "confirming"
    return "idle"
  }

  if (snap.preparingTransaction) {
    return "preparing_transaction"
  }

  const ui = snap.uiPhase
  if (ui === "preview") {
    return "preview"
  }
  if (ui === "submitted") {
    return "submitted"
  }
  if (ui === "confirming") {
    return "confirming"
  }
  if (ui === "confirmed" || ui === "success") {
    return "confirmed"
  }
  if (ui === "failed" || ui === "error") {
    return "failed"
  }
  if (ui === "cancelled") {
    return "cancelled"
  }

  if (ui === "awaiting_signature" || ui === "pending") {
    if (scenario === "withdraw") {
      return "withdrawing"
    }
    const execution = deriveDepositApprovalExecution({
      needsApproval: snap.needsApproval,
      depositApprovalKind: snap.depositApprovalKind,
      approvalMode: snap.approvalMode,
    })
    if (
      execution !== "skip" &&
      !snap.approveComplete &&
      snap.approveWirePhase === "awaiting_signature"
    ) {
      return "approving"
    }
    if (snap.approveComplete && snap.depositWirePhase === "awaiting_signature") {
      return "depositAfterApproval"
    }
    return "depositing"
  }

  return "idle"
}
