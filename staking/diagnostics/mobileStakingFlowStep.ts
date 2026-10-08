import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { deriveDepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"

/** Canonical step labels for mobile staking LAN NDJSON traces. */
export type MobileStakingFlowStep =
  | "review"
  | "approval_dispatch"
  | "approval_wait_wallet"
  | "approval_submitted"
  | "approval_confirming"
  | "approval_confirmed"
  | "stake_dispatch"
  | "stake_wait_wallet"
  | "stake_submitted"
  | "stake_confirming"
  | "stake_confirmed"
  | "withdraw_dispatch"
  | "withdraw_wait_wallet"
  | "withdraw_submitted"
  | "withdraw_confirming"
  | "withdraw_confirmed"
  | "failed"

export function deriveMobileStakingFlowStep(
  snap: Pick<
    TransactionStatusSnapshot,
    | "scenario"
    | "uiPhase"
    | "needsApproval"
    | "depositApprovalKind"
    | "approvalMode"
    | "approveComplete"
    | "approveTxHash"
    | "depositTxHash"
    | "approveWirePhase"
    | "depositWirePhase"
    | "withdrawWirePhase"
    | "withdrawTxHash"
    | "errorMessage"
  > | null
): MobileStakingFlowStep | null {
  if (!snap?.scenario) return null
  if (snap.uiPhase === "failed" || snap.uiPhase === "error") return "failed"
  if (snap.uiPhase === "confirmed" || snap.uiPhase === "success") {
    return snap.scenario === "withdraw" ? "withdraw_confirmed" : "stake_confirmed"
  }
  if (snap.uiPhase === "preview") return "review"

  if (snap.scenario === "withdraw") {
    if (snap.withdrawWirePhase === "awaiting_signature") return "withdraw_wait_wallet"
    if (snap.withdrawWirePhase === "submitted") return "withdraw_submitted"
    if (snap.withdrawWirePhase === "confirming") return "withdraw_confirming"
    if (snap.uiPhase === "confirming") return "withdraw_confirming"
    if (snap.uiPhase === "awaiting_signature") return "withdraw_dispatch"
    if (snap.uiPhase === "submitted") return "withdraw_submitted"
    return null
  }

  const execution =
    snap.scenario === "deposit"
      ? deriveDepositApprovalExecution({
          needsApproval: snap.needsApproval,
          depositApprovalKind: snap.depositApprovalKind,
          approvalMode: snap.approvalMode,
        })
      : "skip"

  const approvalTrack =
    execution !== "skip" &&
    !snap.approveComplete &&
    Boolean(snap.approveTxHash?.trim() || snap.approveWirePhase !== "idle")

  if (approvalTrack || (execution !== "skip" && !snap.approveComplete)) {
    if (snap.approveWirePhase === "awaiting_signature") return "approval_wait_wallet"
    if (snap.approveWirePhase === "submitted") return "approval_submitted"
    if (snap.approveWirePhase === "confirming" || snap.uiPhase === "confirming") {
      return "approval_confirming"
    }
    if (snap.approveComplete) return "approval_confirmed"
    if (snap.uiPhase === "awaiting_signature" && !snap.approveTxHash) {
      return "approval_dispatch"
    }
    return "approval_wait_wallet"
  }

  if (snap.depositWirePhase === "awaiting_signature") return "stake_wait_wallet"
  if (snap.depositWirePhase === "submitted") return "stake_submitted"
  if (snap.depositWirePhase === "confirming") return "stake_confirming"
  if (snap.depositTxHash && snap.uiPhase === "confirming") return "stake_confirming"
  if (snap.uiPhase === "awaiting_signature") return "stake_dispatch"
  if (snap.uiPhase === "submitted") return "stake_submitted"

  return null
}

export function buildMobileStakingSnapshotId(
  snap: Pick<
    TransactionStatusSnapshot,
    | "submissionId"
    | "scenario"
    | "uiPhase"
    | "approveWirePhase"
    | "depositWirePhase"
    | "withdrawWirePhase"
    | "approveTxHash"
    | "depositTxHash"
    | "withdrawTxHash"
  > | null
): string | null {
  if (!snap) return null
  const sub = snap.submissionId ?? "none"
  return [
    sub,
    snap.scenario ?? "none",
    snap.uiPhase ?? "none",
    snap.approveWirePhase,
    snap.depositWirePhase,
    snap.withdrawWirePhase,
    snap.approveTxHash?.slice(0, 10) ?? "",
    snap.depositTxHash?.slice(0, 10) ?? "",
    snap.withdrawTxHash?.slice(0, 10) ?? "",
  ].join(":")
}
