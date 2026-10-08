import type {
  DepositApprovalKind,
  StakingApprovalMode,
} from "@/lib/stakingDepositApprovalExecution"
import type { StakingFeeCanonicalPair } from "@/staking/tx"
import type { StakingTransactionStage } from "@/lib/stakingTransactionMessages"
import type { TransactionStatusScenario } from "@/staking/tx/types/transactionStatusScenario"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"

export type { TransactionStatusScenario } from "@/staking/tx/types/transactionStatusScenario"
export type { TransactionWireStepPhase } from "@/staking/tx/types/transactionStatusWirePhase"
export type { TransactionStatusUiPhase } from "@/staking/tx/types/transactionStatusUiPhase"
export type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
export {
  isTransactionStatusInFlightPhase,
  TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP,
} from "@/staking/tx/types/transactionStatusUiPhase"

export type {
  DepositApprovalKind,
  StakingApprovalMode,
} from "@/lib/stakingDepositApprovalExecution"

export type MarkPostApprovalStakeWalletTerminalInput = {
  submissionId: number
  kind: "user_rejected" | "insufficient_gas"
  source: string
  flowRunId?: string
  error?: unknown
}

export type MarkUserRejectedInput = {
  submissionId: number
  rejectedStage: StakingTransactionStage
  message?: string
  flowRunId?: string
  source?: string
}

export type SetFailedOptions = {
  submissionId?: number
  flowRunId?: string
  source?: string
}

export type OpenPendingInput = {
  scenario: TransactionStatusScenario
  needsApproval: boolean
  amountLabel: string
  feeLine: string
  /** Form-owned submission id; required for durable rejection guards. */
  submissionId?: number
  /** Optional wei hex for the modal primary fee row at open (seed for `feeCanonical`). */
  feeCanonicalMaxWeiHex?: string | null
  /**
   * Preview only: fee row + Confirm gated until true. Deposit split-gas: may be set when the
   * approval-leg fee is ready (second leg can follow via `syncPreviewGasEstimate`).
   */
  previewGasEstimateReady?: boolean
  /** Set when `scenario === "deposit"` and `needsApproval` */
  depositApprovalKind?: DepositApprovalKind | null
  approvalMode?: StakingApprovalMode
}

export type SyncPreviewGasEstimateInput = {
  feeLine: string
  previewGasEstimateReady: boolean
  /** When set, merged into the canonical modal fee snapshot (max wei wins). */
  feeCanonicalMaxWeiHex?: string | null
}

export type SetSuccessInput = {
  amountLabel: string
  feeLine: string
  explorerUrl: string | null
}

export type SetSubmittedInput = {
  step: "approve" | "deposit" | "withdraw"
  hash: string
}

/** Final stake / withdraw tx: receipt monitored in background; toast on completion. */
export type RegisterReceiptCompletionInput = {
  receiptWait: Promise<unknown>
  scenario: TransactionStatusScenario
  /** Shown in Sonner, e.g. "24.60 USDC" */
  amountLabel: string
  feeLine: string
  /** Optional wei for fee line (vault token or ETH) — merged with canonical so success ≥ preview. */
  feeMaxWeiHex?: string | null
  txHash: string
  errorStage: StakingTransactionStage
}

export type TransactionStatusRetryRequest = {
  nonce: number
  scenario: TransactionStatusScenario | null
  /** Skip approval re-dispatch; resume deposit on existing submission. */
  depositOnly?: boolean
}

/**
 * In-memory staking tx modal state (also nested under session persistence v1/v2).
 *
 * **Phase 29 — runtime leak audit (non-exhaustive):**
 * - **Modal ownership:** `registerReceiptCompletion` / hydrate reconcile must not assume “current”
 *   passive runtime when `transactionRuntime` is set — prefer the frozen row for explorer + RPC identity.
 * - **Stale explorer:** legacy rows without `transactionRuntime` still resolve explorers from the wallet
 *   chain at receipt time; frozen rows use CAIP-2 from the snapshot.
 * - **Toast vs modal (Phase 1 ownership):** receipt success uses `shouldEmitReceiptSuccessSonnerToast`:
 *   modal path → no duplicate Sonner success; dialog closed / idle at receipt → `stakingToastSuccess`
 *   continuation (same per-hash dedupe id as the former modal toast).
 * - **Toast vs modal (Phase 2 ownership):** receipt errors use `shouldEmitReceiptErrorSonnerToast` + per-hash
 *   `receiptErrorToastShownRef`: modal surfaces failure → no duplicate Sonner error; dialog closed at receipt →
 *   `stakingToastError` continuation with `tx_modal:receipt_error` dedupe id.
 * - **Phase 30 — execution target:** vault txs + gas + receipt terminal commits require passive runtime to
 *   **`executionTargetEquals`** the frozen modal target when `transactionRuntime` is present.
 * - **Persistence/runtime mismatch:** old session JSON lacks `transactionRuntime` → reconcile falls back
 *   to the hydrate-time active runtime envelope (legacy).
 * - **Runtime switch during receipt wait:** terminal commit allows identity **or** frozen-at-register
 *   match so a passive runtime bump does not strand a completed EVM receipt.
 */

export {
  deriveCurrentTxHashFromSnapshot,
  deriveReceiptErrorStageFromSnapshot,
  hasActiveStakingTxContinuity,
  isDetachedTerminalTxSnapshot,
  isDetachedTxAwaitingReceipt,
  isTransactionStatusTerminalUiPhase,
  snapshotMatchesReceiptHash,
} from "@/staking/tx/transactionStatusSnapshotHelpers"

export type TransactionStatusContextValue = {
  /** Opens modal on preview; wires idle until `confirmPreview` */
  openPreview: (input: OpenPendingInput) => void
  /** Preview confirm — arms execution prep; wallet phase starts at dispatch */
  confirmPreview: () => void
  /**
   * Direct / retry entry — opens preview + `preparingTransaction`; wallet phase starts at dispatch.
   */
  openAwaitingSignature: (input: OpenPendingInput) => void
  /** Enter `awaiting_signature` when a wallet signature request is about to be sent */
  beginAwaitingWalletSignature: () => void
  /** Deposit preview only — chooses ERC20 approval sizing strategy */
  setDepositApprovalMode: (mode: StakingApprovalMode) => void
  /** Preview only — update fee line when gas estimate resolves */
  syncPreviewGasEstimate: (input: SyncPreviewGasEstimateInput) => void
  setSubmitted: (input: SetSubmittedInput) => void
  /** Broadcast hash → `submitted`, then microtask → `confirming` (receipt wait). */
  publishTxBroadcast: (input: SetSubmittedInput) => void
  setConfirming: () => void
  beginPreparingTransaction: () => void
  endPreparingTransaction: () => void
  mergeFeeCanonicalFromPair: (pair: StakingFeeCanonicalPair) => void
  setConfirmed: (input: SetSuccessInput) => void
  setFailed: (message: string, options?: SetFailedOptions) => void
  /** Terminal user rejection — never auto-resume or auto-dispatch this submission. */
  markUserRejected: (input: MarkUserRejectedInput) => void
  /** Post-approval stake wallet-wait terminal (cancelled or insufficient gas). */
  markPostApprovalStakeWalletTerminal: (
    input: MarkPostApprovalStakeWalletTerminalInput
  ) => void
  /** @deprecated Alias of `openAwaitingSignature` */
  openPending: (input: OpenPendingInput) => void
  setApproveTxHash: (hash: string) => void
  /** Approve tx broadcast: wire + hash only; modal stays on awaiting_signature for the deposit step. */
  markApproveBroadcast: (hash: string) => void
  markApproveComplete: () => void
  setDepositTxHash: (hash: string) => void
  setWithdrawTxHash: (hash: string) => void
  /** @deprecated Alias of `setConfirmed` */
  setSuccess: (input: SetSuccessInput) => void
  /** @deprecated Alias of `setFailed` */
  setError: (message: string, options?: SetFailedOptions) => void
  /** Clears modal to idle + clears session persistence (programmatic epilogue uses this too). */
  close: () => void
  /** Same as `close` — prefer in UI codepaths to express user / explicit intent. */
  closeUser: () => void
  /** sessionStorage tx session only (modal may stay open until next persist flush). */
  clearPersistedTransactionState: () => void
  /** Full idle reset: timers, retry signal baseline, persistence, snapshot. */
  resetTransactionLifecycle: () => void
  /** In-flight modal dismiss → `cancelled` epilogue, then auto-close. No-op if not in-flight. */
  beginInFlightDismissal: () => void
  /**
   * Hide modal during wallet wait / gas prep without cancelling lifecycle.
   * Snapshot + runner stay alive; progress Sonner owns the surface.
   */
  dismissInFlightModalUiOnly: () => void
  /**
   * After broadcast (`submitted`): hide modal immediately without cancelling
   * vault receipt tracking / refreshes. Completion surfaces via toast + on-chain hooks.
   */
  dismissSubmittedModal: () => void
  /** Re-show tx modal after post-broadcast dismiss (detached receipt still in flight). */
  reopenDetachedTransactionModal: () => void
  /**
   * Mobile recovered pre-hash wallet wait — AppKit handoff on user gesture only.
   * Does not dispatch approval/deposit.
   */
  requestRecoveredWalletHandoff: (source: string) => void
  /** Await receipt off the UI critical path; one Sonner toast; optional modal → confirmed. */
  registerReceiptCompletion: (input: RegisterReceiptCompletionInput) => void
  /**
   * Terminal cancelled/failed → bump `retryRequest` only (cleanup + signal).
   * Form owns preview/preparing + runner arm via direct launch.
   */
  retryLastTerminalFlow: () => void
  /** Monotonic retry signal consumed by forms (sole retry execution activator). */
  retryRequest: TransactionStatusRetryRequest
  /** After on-chain approval recovery, re-arm deposit-only continuation via retry nonce. */
  signalDepositContinuationRetry: (
    source: string,
    options?: { depositOnly?: boolean }
  ) => void
  /** Clears terminal cancelled/failed and resumes deposit signing after on-chain approval. */
  resumeDepositAfterRecoveredApproval: () => void
  /** True while preview Confirm lock is held (covers confirm tap → wallet handoff). */
  previewConfirmLocked: boolean
  /** Snapshot for the surface (also drives dialog open state via phase). */
  snapshot: TransactionStatusSnapshot
  /** Bumps when recovered wallet-wait switches to manual-open hint (UI re-render). */
  walletWaitManualHintRevision: number
}

export { createIdleTransactionStatusSnapshot } from "@/staking/tx/transactionStatusSnapshotHelpers"
