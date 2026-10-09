import {
  STAKING_TX_UX_STAKE_CANCELLED_IN_WALLET,
  STAKING_TX_UX_STAKE_INSUFFICIENT_GAS,
} from "@/constants/stakingTransactionUxCopy"
import {
  classifyStakeWalletError,
  type StakeWalletErrorKind,
} from "@/lib/stakingTransactionMessages"
import { traceMobileStakingFlow } from "@/staking/diagnostics/mobileStakingLanLog"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import type { TransactionWireStepPhase } from "@/staking/tx/types/transactionStatusWirePhase"

export type StakeWalletWaitTerminalKind = "user_rejected" | "insufficient_gas"

export const STAKING_TX_STAKE_TERMINAL_STORAGE_KEY =
  "waddle_staking_tx_stake_terminal_v1"

export type PersistedStakingTxStakeTerminalV1 = {
  v: 1
  updatedAt: number
  walletAddress: string | null
  chainId: number | null
  submissionId: number
  runId: string
  terminal: true
  terminalKind: StakeWalletWaitTerminalKind
  uiPhase: "cancelled" | "failed"
  errorMessage: string
  amountLabel: string
  feeLine: string
  approveComplete: boolean
  approveTxHash: string | null
  depositTxHash: string | null
  needsApproval: boolean
  depositApprovalKind: TransactionStatusSnapshot["depositApprovalKind"]
  approvalMode: TransactionStatusSnapshot["approvalMode"]
  approveWirePhase: TransactionWireStepPhase
  depositWirePhase: TransactionWireStepPhase
  rejectedStage: "depositAfterApproval"
  rejectedAt: number | null
}

export function isPostApprovalStakeWalletWait(
  snapshot: TransactionStatusSnapshot
): boolean {
  if (snapshot.scenario !== "deposit") return false
  if (snapshot.uiPhase !== "awaiting_signature" && snapshot.uiPhase !== "pending") {
    return false
  }
  if (snapshot.terminal) return false
  if (!snapshot.approveComplete && !snapshot.approveTxHash?.trim()) return false
  if (snapshot.depositTxHash?.trim()) return false
  return snapshot.depositWirePhase === "awaiting_signature"
}

export function stakeWalletWaitTerminalMessage(
  kind: StakeWalletWaitTerminalKind
): string {
  return kind === "insufficient_gas"
    ? STAKING_TX_UX_STAKE_INSUFFICIENT_GAS
    : STAKING_TX_UX_STAKE_CANCELLED_IN_WALLET
}

export function classifyStakeWalletWaitTerminalKind(
  error: unknown
): StakeWalletWaitTerminalKind {
  const classified = classifyStakeWalletError(error)
  return classified.kind === "insufficient_gas" ? "insufficient_gas" : "user_rejected"
}

export function readPersistedStakingTxStakeTerminal(): PersistedStakingTxStakeTerminalV1 | null {
  if (typeof sessionStorage === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STAKING_TX_STAKE_TERMINAL_STORAGE_KEY)
    if (!raw?.trim()) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null
    const row = parsed as PersistedStakingTxStakeTerminalV1
    if (row.v !== 1 || typeof row.submissionId !== "number") return null
    if (row.terminalKind !== "user_rejected" && row.terminalKind !== "insufficient_gas") {
      return null
    }
    return row
  } catch {
    return null
  }
}

export function writePersistedStakingTxStakeTerminal(
  row: PersistedStakingTxStakeTerminalV1
): void {
  if (typeof sessionStorage === "undefined") return
  try {
    sessionStorage.setItem(STAKING_TX_STAKE_TERMINAL_STORAGE_KEY, JSON.stringify(row))
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedStakingTxStakeTerminal(reason: string): void {
  if (typeof sessionStorage === "undefined") return
  try {
    sessionStorage.removeItem(STAKING_TX_STAKE_TERMINAL_STORAGE_KEY)
    if ((process.env.NODE_ENV !== 'production')) {
      console.debug("[staking-tx-stake-terminal] clear", reason)
    }
  } catch {
    /* ignore */
  }
}

export function buildPersistedStakeTerminalRow(input: {
  walletAddress: string | null
  chainId: number | null
  snapshot: TransactionStatusSnapshot
  submissionId: number
  terminalKind: StakeWalletWaitTerminalKind
}): PersistedStakingTxStakeTerminalV1 {
  const s = input.snapshot
  const rejectedAt = Date.now()
  const message = stakeWalletWaitTerminalMessage(input.terminalKind)
  return {
    v: 1,
    updatedAt: rejectedAt,
    walletAddress: input.walletAddress,
    chainId: input.chainId,
    submissionId: input.submissionId,
    runId: String(input.submissionId),
    terminal: true,
    terminalKind: input.terminalKind,
    uiPhase: input.terminalKind === "insufficient_gas" ? "failed" : "cancelled",
    errorMessage: message,
    amountLabel: s.amountLabel,
    feeLine: s.feeLine,
    approveComplete: true,
    approveTxHash: s.approveTxHash,
    depositTxHash: null,
    needsApproval: s.needsApproval,
    depositApprovalKind: s.depositApprovalKind,
    approvalMode: s.approvalMode,
    approveWirePhase: "done",
    depositWirePhase:
      input.terminalKind === "insufficient_gas" ? "failed" : "idle",
    rejectedStage: "depositAfterApproval",
    rejectedAt:
      input.terminalKind === "user_rejected" ? rejectedAt : null,
  }
}

export function reviveSnapshotFromStakeTerminalRow(
  row: PersistedStakingTxStakeTerminalV1
): TransactionStatusSnapshot {
  const base = {
    dialogOpen: true,
    uiPhase: row.uiPhase,
    scenario: "deposit" as const,
    transactionRuntime: null,
    frozenVaultTokenSymbol: null,
    needsApproval: row.needsApproval,
    depositApprovalKind: row.depositApprovalKind,
    approvalMode: row.approvalMode,
    amountLabel: row.amountLabel,
    feeLine: row.feeLine,
    feeCanonical: {
      maxWeiHex: null,
      displayLine: row.feeLine,
    },
    preparingTransaction: false,
    previewGasEstimateReady: true,
    approveComplete: row.approveComplete,
    approveTxHash: row.approveTxHash,
    depositTxHash: row.depositTxHash,
    withdrawTxHash: null,
    approveWirePhase: row.approveWirePhase,
    depositWirePhase: row.depositWirePhase,
    withdrawWirePhase: "idle" as const,
    txHash: row.approveTxHash,
    submittedAt: null,
    confirmations: null,
    successAmountLabel: "",
    successFeeLine: "",
    successExplorerUrl: null,
    errorMessage: row.errorMessage,
    submissionId: row.submissionId,
    runId: row.runId,
    terminal: true,
    terminalReason:
      row.terminalKind === "insufficient_gas" ? null : ("user_rejected" as const),
    rejectedAt: row.rejectedAt,
    rejectedStage: row.rejectedStage,
    canAutoResume: false,
    canAutoDispatch: false,
  }
  return base
}

export function traceStakeWalletWaitTerminal(input: {
  event:
    | "stake_user_rejected_in_wallet"
    | "stake_insufficient_gas_detected"
    | "stake_wallet_wait_cancelled_pre_hash"
    | "stake_wallet_wait_failed_insufficient_gas"
    | "stake_retry_deposit_only_after_approval"
    | "stake_awaiting_signature_hydrated_with_terminal_error"
    | "stake_wallet_wait_stale_after_refresh_recovered"
  snapshot: TransactionStatusSnapshot
  source?: string
  terminalKind?: StakeWalletWaitTerminalKind
  error?: unknown
}): void {
  const classified = input.error ? classifyStakeWalletError(input.error) : null
  traceMobileStakingFlow(input.event, {
    source: input.source,
    terminalKind: input.terminalKind,
    submissionId: input.snapshot.submissionId,
    flowRunId: input.snapshot.runId,
    approvalTxHash: input.snapshot.approveTxHash,
    stakeTxHash: input.snapshot.depositTxHash,
    uiPhase: input.snapshot.uiPhase,
    errorCode: classified?.errorCode ?? null,
    errorAction: classified?.errorAction ?? null,
    errorMessage: classified?.errorMessage ?? input.snapshot.errorMessage,
  })
}

export function stakeWalletErrorKindToTerminalKind(
  kind: StakeWalletErrorKind
): StakeWalletWaitTerminalKind {
  return kind === "insufficient_gas" ? "insufficient_gas" : "user_rejected"
}
