import {
  createIdleTransactionStatusSnapshot,
  deriveCurrentTxHashFromSnapshot,
  isDetachedTerminalTxSnapshot,
  isDetachedTxAwaitingReceipt,
} from "@/staking/tx/transactionStatusSnapshotHelpers"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"

export type StakingTxContinuityViolation =
  | "modal_open_without_phase"
  | "detached_inflight_without_hash"
  | "detached_terminal_stuck"
  | "tx_hash_without_scenario"
  | "duplicate_tx_hash_ownership"

export type StakingTxContinuityHealAction =
  | "reset_idle_modal_open"
  | "reset_orphan_detached_inflight"
  | "finalize_detached_terminal"

export type StakingTxContinuityAudit = {
  violations: StakingTxContinuityViolation[]
  heals: StakingTxContinuityHealAction[]
}

/**
 * Pure audit for impossible / stale staking tx snapshot combinations.
 * Heal actions are suggestions for the provider (DEV self-heal + prod-safe no-ops).
 */
export function auditStakingTxContinuitySnapshot(
  s: TransactionStatusSnapshot
): StakingTxContinuityAudit {
  const violations: StakingTxContinuityViolation[] = []
  const heals: StakingTxContinuityHealAction[] = []

  if (s.dialogOpen && s.uiPhase === null) {
    violations.push("modal_open_without_phase")
    heals.push("reset_idle_modal_open")
  }

  if (
    isDetachedTxAwaitingReceipt(s) &&
    !deriveCurrentTxHashFromSnapshot(s)?.trim()
  ) {
    violations.push("detached_inflight_without_hash")
    heals.push("reset_orphan_detached_inflight")
  }

  if (isDetachedTerminalTxSnapshot(s)) {
    violations.push("detached_terminal_stuck")
    heals.push("finalize_detached_terminal")
  }

  const hashes = [
    s.txHash?.trim(),
    s.approveTxHash?.trim(),
    s.depositTxHash?.trim(),
    s.withdrawTxHash?.trim(),
  ].filter((h): h is string => Boolean(h))

  if (hashes.length > 0 && s.scenario == null) {
    violations.push("tx_hash_without_scenario")
  }

  const currentHash = deriveCurrentTxHashFromSnapshot(s)?.trim().toLowerCase() ?? ""
  const genericHash = s.txHash?.trim().toLowerCase() ?? ""
  if (
    genericHash !== "" &&
    currentHash !== "" &&
    genericHash !== currentHash &&
    (s.uiPhase === "submitted" || s.uiPhase === "confirming")
  ) {
    violations.push("duplicate_tx_hash_ownership")
  }

  return { violations, heals }
}

/** Idempotent idle snapshot used by heal paths. */
export function stakingTxContinuityIdleSnapshot(): TransactionStatusSnapshot {
  return createIdleTransactionStatusSnapshot()
}
