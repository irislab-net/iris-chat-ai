/**
 * DEV-only visual ownership audit tracing (LAN NDJSON).
 * Observability only — must not change transaction or modal behavior.
 */
import { isMobileStakingLanLogEnabled } from "@/config/mobileStakingLogEnv"
import {
  deriveCurrentTxHashFromSnapshot,
  hasActiveStakingTxContinuity,
  isDetachedTxWithProgressSurface,
} from "@/staking/tx/transactionStatusSnapshotHelpers"
import {
  isTransactionStatusInFlightPhase,
  isTransactionStatusTerminalUiPhase,
} from "@/staking/tx/types/transactionStatusUiPhase"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { traceMobileStakingFlow } from "@/staking/diagnostics/mobileStakingLanLog"

export type TxVisualOwner = "modal" | "toast" | "none"

export type TxVisualOwnershipTraceEvent =
  | "tx_visual_owner_changed"
  | "tx_modal_opened"
  | "tx_modal_closed"
  | "tx_modal_close_clicked"
  | "tx_modal_close_ui_only"
  | "tx_modal_close_blocked_reset_active_tx"
  | "tx_progress_toast_shown"
  | "tx_progress_toast_updated"
  | "tx_progress_toast_dismissed"
  | "tx_progress_toast_clicked"
  | "tx_progress_toast_reopen_modal"
  | "tx_terminal_toast_shown"
  | "tx_terminal_toast_suppressed_modal_visible"
  | "tx_terminal_toast_suppressed_deduped"
  | "tx_snapshot_hydrated"
  | "tx_snapshot_persisted"
  | "tx_snapshot_cleared"
  | "tx_snapshot_clear_blocked_active_tx"
  | "tx_lifecycle_reset_blocked_active_tx"
  | "tx_modal_ownership_active"
  | "tx_toast_ownership_active"
  | "tx_no_visual_owner_detected"

/** Derives which surface should own the transaction UX for audit purposes. */
export function deriveTxVisualOwner(s: TransactionStatusSnapshot): TxVisualOwner {
  if (s.uiPhase === null) return "none"
  const modalVisible = s.dialogOpen && s.uiPhase !== null
  if (modalVisible) return "modal"
  if (isDetachedTxWithProgressSurface(s)) return "toast"
  return "none"
}

function buildVisualOwnershipPayload(
  s: TransactionStatusSnapshot,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const hash = deriveCurrentTxHashFromSnapshot(s)
  return {
    uiPhase: s.uiPhase,
    modalVisible: s.dialogOpen,
    toastVisible: isDetachedTxWithProgressSurface(s),
    visualOwner: deriveTxVisualOwner(s),
    submissionId: s.submissionId,
    flowRunId: s.submissionId != null ? String(s.submissionId) : null,
    approvalTxHash: s.approveTxHash?.trim() || null,
    depositTxHash: s.depositTxHash?.trim() || null,
    withdrawTxHash: s.withdrawTxHash?.trim() || null,
    txHash: hash?.trim() || null,
    terminal: s.terminal,
    terminalReason: s.terminalReason,
    hasActiveContinuity: hasActiveStakingTxContinuity(s),
    inFlightWalletOp: null,
    ...extra,
  }
}

export function traceTxVisualOwnership(
  event: TxVisualOwnershipTraceEvent,
  s: TransactionStatusSnapshot,
  detail: Record<string, unknown> = {}
): void {
  if (!isMobileStakingLanLogEnabled()) return
  traceMobileStakingFlow(event, buildVisualOwnershipPayload(s, detail))
}

let lastVisualOwner: TxVisualOwner | null = null

export function traceTxVisualOwnerTransition(
  s: TransactionStatusSnapshot,
  reason: string
): void {
  if (!isMobileStakingLanLogEnabled()) return
  const next = deriveTxVisualOwner(s)
  if (lastVisualOwner === next) return
  const from = lastVisualOwner ?? "none"
  lastVisualOwner = next
  traceMobileStakingFlow(
    "tx_visual_owner_changed",
    buildVisualOwnershipPayload(s, { reason, from, to: next })
  )
  if (next === "modal") {
    traceMobileStakingFlow("tx_modal_ownership_active", buildVisualOwnershipPayload(s, { reason }))
  } else if (next === "toast") {
    traceMobileStakingFlow("tx_toast_ownership_active", buildVisualOwnershipPayload(s, { reason }))
  }
}

/** Detect active in-flight tx with no modal and no detached toast (audit invariant violation). */
export function traceTxNoVisualOwnerIfNeeded(
  s: TransactionStatusSnapshot,
  reason: string
): void {
  if (!isMobileStakingLanLogEnabled()) return
  if (s.uiPhase === null) return
  if (isTransactionStatusTerminalUiPhase(s.uiPhase)) return
  if (deriveTxVisualOwner(s) !== "none") return

  const inFlight =
    isTransactionStatusInFlightPhase(s.uiPhase) ||
    s.uiPhase === "pending" ||
    s.uiPhase === "preview"

  if (!inFlight && !hasActiveStakingTxContinuity(s)) return

  traceMobileStakingFlow(
    "tx_no_visual_owner_detected",
    buildVisualOwnershipPayload(s, { reason })
  )
}

export function traceTxModalCloseClicked(
  s: TransactionStatusSnapshot,
  source: string
): void {
  traceTxVisualOwnership("tx_modal_close_clicked", s, { source })
}

export function traceTxModalCloseUiOnly(
  s: TransactionStatusSnapshot,
  source: string
): void {
  traceTxVisualOwnership("tx_modal_close_ui_only", s, { source })
  traceTxVisualOwnerTransition(s, `close_ui_only:${source}`)
}

export function traceTxLifecycleResetBlocked(
  s: TransactionStatusSnapshot,
  source: string
): void {
  traceTxVisualOwnership("tx_lifecycle_reset_blocked_active_tx", s, { source })
}

export function traceTxSnapshotPersisted(
  s: TransactionStatusSnapshot,
  reason: string
): void {
  traceTxVisualOwnership("tx_snapshot_persisted", s, { reason })
}

export function traceTxSnapshotHydrated(
  s: TransactionStatusSnapshot,
  reason: string
): void {
  traceTxVisualOwnership("tx_snapshot_hydrated", s, { reason })
  traceTxVisualOwnerTransition(s, `hydrate:${reason}`)
}

export function traceTxSnapshotCleared(
  s: TransactionStatusSnapshot,
  reason: string
): void {
  traceTxVisualOwnership("tx_snapshot_cleared", s, { reason })
}
