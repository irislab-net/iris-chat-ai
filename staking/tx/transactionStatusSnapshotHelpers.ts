import { deriveDepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import { createActiveSubmissionTerminalFields } from "@/staking/tx/stakingTxSubmissionTerminal"
import { emptyStakingFeeCanonicalPair } from "@/staking/tx/stakingFeeCanonical"
import { isTransactionStatusTerminalUiPhase } from "@/staking/tx/types/transactionStatusUiPhase"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"

export { isTransactionStatusTerminalUiPhase }

const emptySnapshot: TransactionStatusSnapshot = {
  dialogOpen: false,
  uiPhase: null,
  scenario: null,
  transactionRuntime: null,
  frozenVaultTokenSymbol: null,
  needsApproval: false,
  depositApprovalKind: null,
  approvalMode: "limited",
  amountLabel: "",
  feeLine: "",
  feeCanonical: emptyStakingFeeCanonicalPair(),
  preparingTransaction: false,
  previewGasEstimateReady: true,
  approveComplete: false,
  approveTxHash: null,
  depositTxHash: null,
  withdrawTxHash: null,
  approveWirePhase: "idle",
  depositWirePhase: "idle",
  withdrawWirePhase: "idle",
  txHash: null,
  submittedAt: null,
  confirmations: null,
  successAmountLabel: "",
  successFeeLine: "",
  successExplorerUrl: null,
  errorMessage: "",
  ...createActiveSubmissionTerminalFields(null),
}

export function deriveCurrentTxHashFromSnapshot(
  s: TransactionStatusSnapshot
): string | null {
  if (s.scenario === "withdraw") {
    return s.withdrawTxHash?.trim() || null
  }
  if (s.scenario === "deposit") {
    const execution = deriveDepositApprovalExecution({
      needsApproval: s.needsApproval,
      depositApprovalKind: s.depositApprovalKind,
      approvalMode: s.approvalMode,
    })
    if (execution !== "skip" && !s.approveComplete && s.approveTxHash?.trim()) {
      return s.approveTxHash.trim()
    }
    return s.depositTxHash?.trim() || null
  }
  return (
    s.depositTxHash?.trim() ||
    s.withdrawTxHash?.trim() ||
    s.approveTxHash?.trim() ||
    null
  )
}

export function createIdleTransactionStatusSnapshot(): TransactionStatusSnapshot {
  return { ...emptySnapshot }
}

/** Modal hidden with a terminal outcome still in snapshot (hydrate / reconcile edge). */
export function isDetachedTerminalTxSnapshot(
  s: TransactionStatusSnapshot
): boolean {
  return (
    !s.dialogOpen &&
    s.scenario !== null &&
    isTransactionStatusTerminalUiPhase(s.uiPhase)
  )
}

/** Modal hidden after post-broadcast dismiss; receipt ownership stays in provider snapshot. */
export function isDetachedTxAwaitingReceipt(
  s: TransactionStatusSnapshot
): boolean {
  return (
    !s.dialogOpen &&
    (s.uiPhase === "submitted" || s.uiPhase === "confirming")
  )
}

/** Modal hidden while awaiting wallet signature (pre-broadcast). */
export function isDetachedTxAwaitingWalletSignature(
  s: TransactionStatusSnapshot
): boolean {
  return (
    !s.dialogOpen &&
    (s.uiPhase === "awaiting_signature" || s.uiPhase === "pending")
  )
}

/** Detached modal with an active progress toast surface (wallet wait or receipt wait). */
export function isDetachedTxWithProgressSurface(
  s: TransactionStatusSnapshot
): boolean {
  return (
    isDetachedTxAwaitingReceipt(s) || isDetachedTxAwaitingWalletSignature(s)
  )
}

/** Provider-owned tx continuity (open modal or detached in-flight). */
export function hasActiveStakingTxContinuity(
  s: TransactionStatusSnapshot
): boolean {
  if (s.uiPhase === null) return false
  if (isDetachedTxAwaitingReceipt(s)) return true
  if (isDetachedTxAwaitingWalletSignature(s)) return true
  if (!s.dialogOpen) return false
  return !isTransactionStatusTerminalUiPhase(s.uiPhase)
}

/** Whether `hash` is the authoritative in-flight tx for this snapshot (approve / deposit / withdraw). */
export function snapshotMatchesReceiptHash(
  s: TransactionStatusSnapshot,
  hash: string
): boolean {
  const h = hash.trim().toLowerCase()
  if (!h) return false
  const current = deriveCurrentTxHashFromSnapshot(s)?.trim().toLowerCase()
  if (current === h) return true
  const slots = [s.txHash, s.approveTxHash, s.depositTxHash, s.withdrawTxHash]
  return slots.some(slot => slot?.trim().toLowerCase() === h)
}

export function deriveReceiptErrorStageFromSnapshot(
  s: TransactionStatusSnapshot
): "approval" | "deposit" | "depositAfterApproval" | "withdraw" {
  if (s.scenario === "withdraw") return "withdraw"
  const execution = deriveDepositApprovalExecution({
    needsApproval: s.needsApproval,
    depositApprovalKind: s.depositApprovalKind,
    approvalMode: s.approvalMode,
  })
  if (execution !== "skip" && !s.approveComplete && s.approveTxHash?.trim()) {
    return s.depositTxHash?.trim() ? "depositAfterApproval" : "approval"
  }
  return "deposit"
}
