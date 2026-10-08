import {
  captureStakingStructuredEvent,
  stakingSentryBreadcrumb,
  STAKING_SENTRY_EVENT,
} from "@/lib/stakingSentry"

/**
 * Vault deposit/withdraw loading ownership — single active lease, generation-safe release.
 *
 * `txState.loading` must reflect an in-flight vault contract call only. Modal / form /
 * wallet resets abandon the lease so loading cannot outlive an idle tx snapshot.
 */

export type StakingVaultTxExecutionOp = "deposit" | "withdraw"

export type StakingVaultTxExecutionLease = Readonly<{
  id: number
  op: StakingVaultTxExecutionOp
  startedAtMs: number
}>

export type StakingVaultTxExecutionOwnershipSnapshot = Readonly<{
  activeLeaseId: number | null
  activeOp: StakingVaultTxExecutionOp | null
  invalidationGeneration: number
  lastAbandonReason: string | null
}>

export type StakingVaultTxExecutionOwnership = Readonly<{
  acquire: (op: StakingVaultTxExecutionOp) => StakingVaultTxExecutionLease
  release: (lease: StakingVaultTxExecutionLease) => boolean
  abandon: (reason: string) => void
  isActive: () => boolean
  getSnapshot: () => StakingVaultTxExecutionOwnershipSnapshot
}>

export function createStakingVaultTxExecutionOwnership(): StakingVaultTxExecutionOwnership {
  let activeLeaseId: number | null = null
  let activeOp: StakingVaultTxExecutionOp | null = null
  let nextLeaseId = 1
  let invalidationGeneration = 0
  let lastAbandonReason: string | null = null

  return {
    acquire(op: StakingVaultTxExecutionOp): StakingVaultTxExecutionLease {
      if (activeLeaseId != null) {
        invalidationGeneration += 1
        activeLeaseId = null
        activeOp = null
      }
      const id = nextLeaseId++
      activeLeaseId = id
      activeOp = op
      return { id, op, startedAtMs: Date.now() }
    },

    release(lease: StakingVaultTxExecutionLease): boolean {
      if (activeLeaseId !== lease.id) return false
      activeLeaseId = null
      activeOp = null
      return true
    },

    abandon(reason: string): void {
      if (activeLeaseId == null && lastAbandonReason === reason) return
      lastAbandonReason = reason.trim() || "abandon"
      invalidationGeneration += 1
      activeLeaseId = null
      activeOp = null
    },

    isActive(): boolean {
      return activeLeaseId != null
    },

    getSnapshot(): StakingVaultTxExecutionOwnershipSnapshot {
      return {
        activeLeaseId,
        activeOp,
        invalidationGeneration,
        lastAbandonReason,
      }
    },
  }
}

/** DEV / diagnostics — last abandon reason from the ownership store (module-local). */
let lastPublishedAbandonReason: string | null = null

/** Intentional lifecycle / modal cleanup — observable, not warning-level defects. */
const EXPECTED_VAULT_TX_ABANDON_REASONS: ReadonlySet<string> = new Set([
  "close_idle",
  "reset_transaction_lifecycle",
  "begin_in_flight_dismissal",
  "terminal_flow_retry",
  "deposit_form_idle_unlock",
  "withdraw_form_idle_unlock",
  "runtime_execution_invalidated",
  "wallet_disconnected_during_execution",
])

function isExpectedVaultTxAbandonReason(reason: string): boolean {
  return EXPECTED_VAULT_TX_ABANDON_REASONS.has(reason)
}

export function publishStakingVaultTxExecutionAbandonReason(reason: string): void {
  const trimmed = reason.trim() || null
  lastPublishedAbandonReason = trimmed
  if (!trimmed) return

  if (isExpectedVaultTxAbandonReason(trimmed)) {
    stakingSentryBreadcrumb("vault_tx_execution_abandoned", {
      abandon_reason: trimmed,
      expected: true,
    })
    return
  }

  captureStakingStructuredEvent({
    event: STAKING_SENTRY_EVENT.async.stale_operation,
    level: "warning",
    message: `${STAKING_SENTRY_EVENT.async.stale_operation}:${trimmed}`,
    dedupeKey: `vault_tx_abandon:${trimmed}`,
    tags: { blocking_gate: "vault_tx_loading" },
    contexts: {
      staking_async: { abandon_reason: trimmed },
      staking_tx: { vault_tx_loading_abandoned: true },
    },
    cooldownMs: 60_000,
    oncePerSession: false,
  })
}

export function getLastStakingVaultTxExecutionAbandonReason(): string | null {
  return lastPublishedAbandonReason
}
