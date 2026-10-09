import { deriveDepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import { STAKING_TX_UX_AWAITING_WALLET_SIGNATURE } from "@/constants/stakingTransactionUxCopy"
import type { TransactionStatusScenario } from "@/staking/tx/types/transactionStatusScenario"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"

export type StakingTxLifecycleToastPhase =
  | "wallet_wait"
  | "submitted"
  | "confirming"
  | "success"
  | "failed"

export type StakingTxLifecycleToastPresentation = {
  scenario: TransactionStatusScenario
  txHash: string
  phase: StakingTxLifecycleToastPhase
  title: string
  amountLabel: string
  statusLabel: string
  showView: boolean
  /** Stable Sonner id owner — one detached toast per submission. */
  submissionId?: number | null
}

export function stakingTxLifecycleToastTitle(
  scenario: TransactionStatusScenario
): string {
  return scenario === "deposit" ? "Deposit" : "Withdrawal"
}

export function deriveDetachedWalletWaitToastTitle(
  snapshot: TransactionStatusSnapshot
): string {
  if (snapshot.scenario === "withdraw") return "Withdrawing"
  if (snapshot.scenario !== "deposit") return stakingTxLifecycleToastTitle("deposit")
  const execution = deriveDepositApprovalExecution({
    needsApproval: snapshot.needsApproval,
    depositApprovalKind: snapshot.depositApprovalKind,
    approvalMode: snapshot.approvalMode,
  })
  const approvalTrackActive =
    execution !== "skip" &&
    !snapshot.approveComplete &&
    snapshot.approveWirePhase === "awaiting_signature"
  if (approvalTrackActive) return "Approving"
  return "Staking"
}

export function stakingTxLifecycleToastStatusLabel(
  phase: StakingTxLifecycleToastPhase
): string {
  switch (phase) {
    case "wallet_wait":
      return STAKING_TX_UX_AWAITING_WALLET_SIGNATURE
    case "submitted":
      return "Submitted"
    case "confirming":
      return "Confirming"
    case "success":
      return "Confirmed"
    case "failed":
      return "Failed"
  }
}

export function buildStakingTxLifecycleToastPresentation(input: {
  scenario: TransactionStatusScenario
  txHash: string
  phase: StakingTxLifecycleToastPhase
  amountLabel?: string
  showView?: boolean
  title?: string
  submissionId?: number | null
}): StakingTxLifecycleToastPresentation {
  const showView = input.showView === true
  const phase = input.phase
  return {
    scenario: input.scenario,
    txHash: input.txHash.trim(),
    phase,
    title: input.title?.trim() || stakingTxLifecycleToastTitle(input.scenario),
    amountLabel: input.amountLabel?.trim() ?? "",
    statusLabel: stakingTxLifecycleToastStatusLabel(phase),
    showView,
    submissionId: input.submissionId ?? null,
  }
}
