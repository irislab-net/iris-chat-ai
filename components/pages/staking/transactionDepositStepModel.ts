import type { DepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import type { TransactionWireStepPhase } from "@/staking/tx/types/transactionStatusWirePhase"

export type TransactionStepVisualState =
  | "idle"
  | "locked"
  | "active"
  | "done"
  | "failed"

export type DepositFlowStep = "review" | "approve" | "stake"

export type DepositStepRailModel = {
  showReview: boolean
  showApprove: boolean
  review: TransactionStepVisualState
  approve: TransactionStepVisualState
  stake: TransactionStepVisualState
  activeStep: DepositFlowStep | null
  failedStep: "approve" | "stake" | null
}

function isWireInFlight(phase: TransactionWireStepPhase): boolean {
  return (
    phase === "awaiting_signature" ||
    phase === "submitted" ||
    phase === "confirming"
  )
}

function deriveWireVisualState(
  wirePhase: TransactionWireStepPhase,
  locked: boolean,
  cancelPresentation: boolean,
): TransactionStepVisualState {
  if (wirePhase === "done") return "done"
  if (wirePhase === "failed" && !cancelPresentation) return "failed"
  if (isWireInFlight(wirePhase)) return "active"
  if (locked) return "locked"
  return "idle"
}

export function depositShowsApproveStep(
  execution: DepositApprovalExecution,
  tronUxRuntime: boolean,
): boolean {
  return execution !== "skip" && !tronUxRuntime
}

export function deriveDepositPreviewStepRail(input: {
  execution: DepositApprovalExecution
  tronUxRuntime: boolean
}): Pick<
  DepositStepRailModel,
  "showApprove" | "approve" | "stake" | "activeStep"
> {
  const showApprove = depositShowsApproveStep(
    input.execution,
    input.tronUxRuntime,
  )
  if (!showApprove) {
    return {
      showApprove: false,
      approve: "idle",
      stake: "active",
      activeStep: "stake",
    }
  }
  return {
    showApprove: true,
    approve: "active",
    stake: "locked",
    activeStep: "approve",
  }
}

export function deriveDepositProgressStepRail(input: {
  snapshot: TransactionStatusSnapshot
  execution: DepositApprovalExecution
  tronUxRuntime: boolean
  walletFlowCancelled: boolean
  cancelledLike: boolean
}): DepositStepRailModel {
  const { snapshot: s, execution, tronUxRuntime, walletFlowCancelled, cancelledLike } =
    input
  const showApprove = depositShowsApproveStep(execution, tronUxRuntime)
  const approveLocked = showApprove && !s.approveComplete

  const approveCancel = stepCancelPresentation(
    s.approveWirePhase,
    walletFlowCancelled,
    cancelledLike,
  )
  const stakeCancel = stepCancelPresentation(
    s.depositWirePhase,
    walletFlowCancelled,
    cancelledLike,
  )

  const approve = showApprove
    ? deriveWireVisualState(s.approveWirePhase, false, approveCancel)
    : "idle"
  const stake = deriveWireVisualState(
    s.depositWirePhase,
    approveLocked,
    stakeCancel,
  )

  let activeStep: DepositFlowStep | null = null
  if (showApprove && isWireInFlight(s.approveWirePhase)) {
    activeStep = "approve"
  } else if (isWireInFlight(s.depositWirePhase)) {
    activeStep = "stake"
  } else if (showApprove && approve === "active") {
    activeStep = "approve"
  } else if (stake === "active") {
    activeStep = "stake"
  }

  let failedStep: "approve" | "stake" | null = null
  if (approve === "failed") failedStep = "approve"
  else if (stake === "failed") failedStep = "stake"

  return {
    showReview: true,
    showApprove,
    review: "done",
    approve,
    stake,
    activeStep,
    failedStep,
  }
}

function stepCancelPresentation(
  wirePhase: TransactionWireStepPhase,
  walletCancel: boolean,
  dismissedEpilogue: boolean,
): boolean {
  return (
    (dismissedEpilogue && isWireInFlight(wirePhase)) ||
    (walletCancel && wirePhase === "failed")
  )
}

export function depositAwaitingWalletSignature(
  snapshot: TransactionStatusSnapshot,
  execution: DepositApprovalExecution,
): boolean {
  if (snapshot.scenario !== "deposit") return false
  const showApprove = execution !== "skip"
  if (
    showApprove &&
    !snapshot.approveComplete &&
    snapshot.approveWirePhase === "awaiting_signature"
  ) {
    return true
  }
  if (
    snapshot.depositWirePhase === "awaiting_signature" &&
    (!showApprove || snapshot.approveComplete)
  ) {
    return true
  }
  return false
}
