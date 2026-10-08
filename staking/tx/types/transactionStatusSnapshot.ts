import type {
  DepositApprovalKind,
  StakingApprovalMode,
} from "@/lib/stakingDepositApprovalExecution"
import type { StakingTransactionStage } from "@/lib/stakingTransactionMessages"
import type { StakingFeeCanonicalPair } from "@/staking/tx"
import type { TransactionRuntimeSnapshot } from "@/staking/core/persistenceTypes"
import type { TransactionStatusScenario } from "@/staking/tx/types/transactionStatusScenario"
import type { TransactionStatusUiPhase } from "@/staking/tx/types/transactionStatusUiPhase"
import type { TransactionWireStepPhase } from "@/staking/tx/types/transactionStatusWirePhase"
import type { StakingTxTerminalReason } from "@/staking/tx/stakingTxSubmissionTerminal"

/** In-memory staking tx modal snapshot shape (persistence + runtime assertions). */
export type TransactionStatusSnapshot = {
  dialogOpen: boolean
  uiPhase: TransactionStatusUiPhase | null
  scenario: TransactionStatusScenario | null
  /**
   * Phase 29 — runtime row frozen when this flow opened (`openPreview` / `openAwaitingSignature` / retry).
   * `null` when idle or when JSON predates the field.
   */
  transactionRuntime: TransactionRuntimeSnapshot | null
  /**
   * Phase 50 — token symbol captured when the flow opened; keeps preview amount line stable if the
   * passive staking row changes mid-modal.
   */
  frozenVaultTokenSymbol: string | null
  needsApproval: boolean
  depositApprovalKind: DepositApprovalKind | null
  approvalMode: StakingApprovalMode
  amountLabel: string
  feeLine: string
  /**
   * Canonical fee for the modal primary fee row (network ETH line for deposit;
   * protocol withdrawal line for withdraw). Preview / submit / success use max wei merge.
   */
  feeCanonical: StakingFeeCanonicalPair
  /**
   * True while `prepareSubmit` (or equivalent) runs before a wallet signature.
   */
  preparingTransaction: boolean
  /**
   * Preview: fee row + Confirm are usable. Deposit split-gas path may be true when only the
   * approval-leg estimate is ready; the form still sync-updates `feeLine` as the second leg lands.
   */
  previewGasEstimateReady: boolean
  approveComplete: boolean
  approveTxHash: string | null
  depositTxHash: string | null
  withdrawTxHash: string | null
  approveWirePhase: TransactionWireStepPhase
  depositWirePhase: TransactionWireStepPhase
  withdrawWirePhase: TransactionWireStepPhase
  /** Latest broadcast tx hash (convenience; mirrors the step being submitted) */
  txHash: string | null
  submittedAt: number | null
  confirmations: number | null
  successAmountLabel: string
  successFeeLine: string
  successExplorerUrl: string | null
  errorMessage: string
  /** Monotonic form-owned submission id for the active wallet attempt. */
  submissionId: number | null
  /** String companion for logs/persistence (`String(submissionId)` when set). */
  runId: string | null
  /** True when this submission must not be auto-resumed or auto-dispatched. */
  terminal: boolean
  terminalReason: StakingTxTerminalReason
  rejectedAt: number | null
  rejectedStage: StakingTransactionStage | null
  canAutoResume: boolean
  canAutoDispatch: boolean
}
