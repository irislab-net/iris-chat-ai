import type { StakingTransactionStage } from "@/lib/stakingTransactionMessages"
import type { TransactionStatusScenario } from "@/staking/tx/types/transactionStatusScenario"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import {
  isTransactionStatusTerminalUiPhase,
  type TransactionStatusUiPhase,
} from "@/staking/tx/types/transactionStatusUiPhase"

export type StakingTxTerminalReason = "user_rejected" | null

export const STAKING_TX_USER_REJECTION_STORAGE_KEY =
  "waddle_staking_tx_user_rejection_v1"

export type PersistedStakingTxUserRejectionV1 = {
  v: 1
  updatedAt: number
  walletAddress: string | null
  chainId: number | null
  scenario: TransactionStatusScenario
  submissionId: number
  runId: string
  terminal: true
  terminalReason: "user_rejected"
  rejectedAt: number
  rejectedStage: StakingTransactionStage
  amountLabel: string
  approveComplete: boolean
  approveTxHash: string | null
  depositTxHash: string | null
}

const IN_FLIGHT_UI_PHASES: ReadonlySet<TransactionStatusUiPhase> = new Set([
  "preview",
  "pending",
  "awaiting_signature",
  "submitted",
  "confirming",
])

export function createActiveSubmissionTerminalFields(
  submissionId: number | null
): Pick<
  TransactionStatusSnapshot,
  | "submissionId"
  | "runId"
  | "terminal"
  | "terminalReason"
  | "rejectedAt"
  | "rejectedStage"
  | "canAutoResume"
  | "canAutoDispatch"
> {
  return {
    submissionId,
    runId: submissionId != null ? String(submissionId) : null,
    terminal: false,
    terminalReason: null,
    rejectedAt: null,
    rejectedStage: null,
    canAutoResume: true,
    canAutoDispatch: true,
  }
}

export function normalizeSubmissionTerminalFields(
  snapshot: TransactionStatusSnapshot
): TransactionStatusSnapshot {
  const submissionId =
    typeof snapshot.submissionId === "number" ? snapshot.submissionId : null
  return {
    ...snapshot,
    submissionId,
    runId:
      typeof snapshot.runId === "string" && snapshot.runId.trim()
        ? snapshot.runId
        : submissionId != null
          ? String(submissionId)
          : null,
    terminal: snapshot.terminal === true,
    terminalReason:
      snapshot.terminalReason === "user_rejected" ? "user_rejected" : null,
    rejectedAt:
      typeof snapshot.rejectedAt === "number" ? snapshot.rejectedAt : null,
    rejectedStage: snapshot.rejectedStage ?? null,
    canAutoResume: snapshot.canAutoResume !== false,
    canAutoDispatch: snapshot.canAutoDispatch !== false,
  }
}

export function isPersistedUserRejectionSnapshot(
  snapshot: TransactionStatusSnapshot
): boolean {
  const s = normalizeSubmissionTerminalFields(snapshot)
  return (
    s.terminalReason === "user_rejected" ||
    (s.terminal && s.canAutoDispatch === false && s.uiPhase === "cancelled")
  )
}

export function isSubmissionTerminalFrozen(
  snapshot: TransactionStatusSnapshot
): boolean {
  const s = normalizeSubmissionTerminalFields(snapshot)
  if (s.terminalReason === "user_rejected") return true
  if (s.terminal && !s.canAutoDispatch) return true
  if (s.uiPhase !== null && isTransactionStatusTerminalUiPhase(s.uiPhase)) {
    return true
  }
  return false
}

export function isFreshSubmissionSnapshot(
  snapshot: TransactionStatusSnapshot
): boolean {
  const s = normalizeSubmissionTerminalFields(snapshot)
  return s.terminal === false && s.canAutoDispatch === true && !s.terminalReason
}

function isRegressiveInFlightUiTransition(
  nextPhase: TransactionStatusUiPhase | null
): boolean {
  return nextPhase !== null && IN_FLIGHT_UI_PHASES.has(nextPhase)
}

/** Blocks async handlers from resurrecting a terminal submission into in-flight UI. */
export function applyTerminalSnapshotBarrier(
  prev: TransactionStatusSnapshot,
  next: TransactionStatusSnapshot
): TransactionStatusSnapshot {
  const prevN = normalizeSubmissionTerminalFields(prev)
  const nextN = normalizeSubmissionTerminalFields(next)

  if (!isSubmissionTerminalFrozen(prevN)) {
    return nextN
  }
  if (isFreshSubmissionSnapshot(nextN)) {
    return nextN
  }
  if (
    nextN.submissionId !== null &&
    prevN.submissionId !== null &&
    nextN.submissionId !== prevN.submissionId &&
    nextN.terminal === false &&
    nextN.canAutoDispatch !== false
  ) {
    return nextN
  }
  if (!isRegressiveInFlightUiTransition(nextN.uiPhase)) {
    return nextN
  }
  if (prevN.uiPhase === nextN.uiPhase) {
    return nextN
  }
  return prevN
}

export function readPersistedStakingTxUserRejection(): PersistedStakingTxUserRejectionV1 | null {
  if (typeof sessionStorage === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STAKING_TX_USER_REJECTION_STORAGE_KEY)
    if (!raw?.trim()) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null
    const row = parsed as PersistedStakingTxUserRejectionV1
    if (row.v !== 1 || row.terminalReason !== "user_rejected") return null
    if (typeof row.submissionId !== "number") return null
    return row
  } catch {
    return null
  }
}

export function writePersistedStakingTxUserRejection(
  row: PersistedStakingTxUserRejectionV1
): void {
  if (typeof sessionStorage === "undefined") return
  try {
    sessionStorage.setItem(STAKING_TX_USER_REJECTION_STORAGE_KEY, JSON.stringify(row))
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedStakingTxUserRejection(reason: string): void {
  if (typeof sessionStorage === "undefined") return
  try {
    sessionStorage.removeItem(STAKING_TX_USER_REJECTION_STORAGE_KEY)
    if ((process.env.NODE_ENV !== 'production')) {
      console.debug("[staking-tx-rejection] clear", reason)
    }
  } catch {
    /* ignore */
  }
}

export function buildPersistedUserRejectionRow(input: {
  walletAddress: string | null
  chainId: number | null
  snapshot: TransactionStatusSnapshot
  submissionId: number
  rejectedStage: StakingTransactionStage
}): PersistedStakingTxUserRejectionV1 {
  const s = normalizeSubmissionTerminalFields(input.snapshot)
  const rejectedAt = Date.now()
  return {
    v: 1,
    updatedAt: rejectedAt,
    walletAddress: input.walletAddress,
    chainId: input.chainId,
    scenario: s.scenario ?? "deposit",
    submissionId: input.submissionId,
    runId: String(input.submissionId),
    terminal: true,
    terminalReason: "user_rejected",
    rejectedAt,
    rejectedStage: input.rejectedStage,
    amountLabel: s.amountLabel,
    approveComplete: s.approveComplete,
    approveTxHash: s.approveTxHash,
    depositTxHash: s.depositTxHash,
  }
}

export function snapshotAllowsAutoDispatch(
  snapshot: TransactionStatusSnapshot
): boolean {
  const s = normalizeSubmissionTerminalFields(snapshot)
  if (s.terminalReason === "user_rejected") return false
  if (s.terminal && !s.canAutoDispatch) return false
  return s.canAutoDispatch !== false
}
