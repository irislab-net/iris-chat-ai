export type {
  TransactionStatusScenario,
  TransactionWireStepPhase,
  TransactionStatusUiPhase,
  TransactionStatusSnapshot,
} from "@/staking/tx/types"
export {
  TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP,
  isTransactionStatusInFlightPhase,
  isTransactionStatusTerminalUiPhase,
} from "@/staking/tx/types"

export type {
  PersistedStakingTxSessionV1,
  PersistedStakingTxSessionV2,
} from "@/staking/tx/stakingTxSessionPersistence"
export {
  STAKING_TX_SESSION_STORAGE_KEY,
  ENABLE_STAKING_TX_SESSION_V2_WRITE,
  STAKING_TX_SESSION_TTL_MS,
  persistedTxSessionV2ToV1Compatible,
  upgradeV1ToV2InMemory,
  readPersistedStakingTxSession,
  writePersistedStakingTxSession,
  clearPersistedStakingTxSession,
  isPersistableTxSnapshot,
  snapshotLooksIdle,
  normalizePersistAddress,
  sessionMatchesWallet,
  sessionMatchesAccount,
  reviveSnapshotFromPersistence,
  isHydratablePersistedTxSession,
} from "@/staking/tx/stakingTxSessionPersistence"

export { reconcilePersistedTxSnapshot } from "@/staking/tx/stakingTxOnChainRecovery"

export {
  applyRecoveredWithdrawHashToSnapshot,
  snapshotNeedsWithdrawHashRecovery,
  tryRecoverWithdrawTxHashFromOnChain,
} from "@/staking/tx/stakingWithdrawRecoveryFromSnapshot"

export {
  applyTerminalSnapshotBarrier,
  buildPersistedUserRejectionRow,
  clearPersistedStakingTxUserRejection,
  createActiveSubmissionTerminalFields,
  isPersistedUserRejectionSnapshot,
  isSubmissionTerminalFrozen,
  normalizeSubmissionTerminalFields,
  readPersistedStakingTxUserRejection,
  snapshotAllowsAutoDispatch,
  writePersistedStakingTxUserRejection,
} from "@/staking/tx/stakingTxSubmissionTerminal"

export {
  buildPersistedStakeTerminalRow,
  clearPersistedStakingTxStakeTerminal,
  classifyStakeWalletWaitTerminalKind,
  isPostApprovalStakeWalletWait,
  readPersistedStakingTxStakeTerminal,
  reviveSnapshotFromStakeTerminalRow,
  stakeWalletWaitTerminalMessage,
  traceStakeWalletWaitTerminal,
  writePersistedStakingTxStakeTerminal,
  type PersistedStakingTxStakeTerminalV1,
  type StakeWalletWaitTerminalKind,
} from "@/staking/tx/stakingStakeWalletWaitTerminal"

export {
  createIdleTransactionStatusSnapshot,
  deriveCurrentTxHashFromSnapshot,
  deriveReceiptErrorStageFromSnapshot,
  hasActiveStakingTxContinuity,
  isDetachedTerminalTxSnapshot,
  isDetachedTxAwaitingReceipt,
  isDetachedTxAwaitingWalletSignature,
  isDetachedTxWithProgressSurface,
  snapshotMatchesReceiptHash,
} from "@/staking/tx/transactionStatusSnapshotHelpers"

export { createPolledReceiptWait } from "@/staking/tx/stakingPostBroadcastReceiptPoll"

export {
  auditStakingTxContinuitySnapshot,
  stakingTxContinuityIdleSnapshot,
  type StakingTxContinuityAudit,
  type StakingTxContinuityHealAction,
  type StakingTxContinuityViolation,
} from "@/staking/tx/stakingTxContinuityGuards"

export {
  claimStakingTxErrorAck,
  claimStakingTxSuccessAck,
  hasStakingTxErrorAck,
  hasStakingTxSuccessAck,
  normalizeStakingTxAckHash,
} from "@/staking/tx/stakingTxTerminalAck"

export {
  deriveStakingActiveTransactionAwareness,
  shortenStakingTxHash,
  stakingActiveTxAmbientCountLabel,
  stakingActiveTxAmbientPillLabel,
  stakingActiveTxHistoryHeadline,
  stakingActiveTxLingerFailedLabel,
  stakingActiveTxLingerSuccessLabel,
  stakingActiveTxRowLabel,
  type StakingActiveTransactionAwareness,
  type StakingActiveTransactionItem,
  type StakingActiveTransactionStep,
} from "@/staking/tx/stakingActiveTransactionAwareness"

import { devRegisterStakingPackageOwner } from "@/staking/diagnostics/stakingBoundaryRules"
devRegisterStakingPackageOwner("tx")

export type { StakingFeeCanonicalPair } from "@/staking/tx/stakingFeeCanonical"
export {
  emptyStakingFeeCanonicalPair,
  mergeStakingFeeCanonicalPair,
  resolveSuccessFeeDisplayLine,
} from "@/staking/tx/stakingFeeCanonical"
