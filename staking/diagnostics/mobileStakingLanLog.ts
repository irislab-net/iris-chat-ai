/**
 * DEV-only mobile LAN NDJSON logger (Vite middleware → `.local-debug/mobile-staking.ndjson`).
 * Observability only — must not change transaction or wallet session behavior.
 */
import { isMobileStakingLanLogEnabled } from "@/config/mobileStakingLogEnv"
import {
  buildMobileStakingSnapshotId,
  deriveMobileStakingFlowStep,
  type MobileStakingFlowStep,
} from "@/staking/diagnostics/mobileStakingFlowStep"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"

export type MobileStakingFlowEvent =
  | "stake_flow_started"
  | "allowance_preflight_start"
  | "allowance_preflight_result"
  | "approval_required"
  | "preview_confirm_tapped"
  | "approval_dispatch_requested"
  | "approval_dispatch_unreachable_deferred_after_return"
  | "approval_wallet_send_start"
  | "approval_wallet_send_resolved"
  | "approval_wallet_send_rejected"
  | "approval_tx_hash_received"
  | "approval_receipt_wait_start"
  | "approval_receipt_wait_resolved"
  | "approval_receipt_wait_rejected"
  | "allowance_after_approval_read_start"
  | "allowance_after_approval_read_result"
  | "stake_dispatch_requested"
  | "stake_wallet_send_start"
  | "stake_wallet_send_resolved"
  | "stake_wallet_send_rejected"
  | "stake_user_rejected_in_wallet"
  | "stake_insufficient_gas_detected"
  | "stake_wallet_wait_cancelled_pre_hash"
  | "stake_wallet_wait_failed_insufficient_gas"
  | "stake_retry_deposit_only_after_approval"
  | "stake_awaiting_signature_hydrated_with_terminal_error"
  | "stake_wallet_wait_stale_after_refresh_recovered"
  | "stake_tx_hash_received"
  | "stake_receipt_wait_start"
  | "stake_receipt_wait_resolved"
  | "stake_receipt_wait_rejected"
  | "withdraw_dispatch_requested"
  | "withdraw_wallet_send_start"
  | "withdraw_wallet_send_resolved"
  | "withdraw_wallet_send_rejected"
  | "withdraw_user_rejected"
  | "withdraw_tx_hash_received"
  | "withdraw_receipt_wait_start"
  | "withdraw_receipt_wait_resolved"
  | "withdraw_receipt_wait_rejected"
  | "withdraw_confirmed"
  | "withdraw_failed"
  | "withdraw_success_terminal_applied"
  | "withdraw_terminal_snapshot_persisted"
  | "withdraw_terminal_hydrated"
  | "withdraw_wallet_wait_not_recovered_hash_exists"
  | "withdraw_wallet_wait_not_recovered_terminal_exists"
  | "withdraw_stale_wallet_wait_cleared_after_success"
  | "withdraw_flowstep_mismatch_detected"
  | "wallet_manual_disconnect_requested"
  | "wallet_manual_disconnect_guard_set"
  | "appkit_disconnect_called"
  | "appkit_disconnect_resolved"
  | "appkit_account_hydration_started"
  | "appkit_account_hydration_settled"
  | "appkit_account_restored"
  | "account_restore_mismatch_detected"
  | "stale_account_restore_suppressed_by_disconnect_guard"
  | "account_source_of_truth_applied"
  | "account_changed_detected"
  | "account_switch_reset_address_bound_state"
  | "active_tx_account_mismatch_detected"
  | "local_wallet_address_cleared_mismatch"
  | "local_wallet_address_ignored_until_appkit_ready"
  | "appkit_account_source_of_truth_applied"
  | "walletconnect_session_delete_received"
  | "walletconnect_session_update_received"
  | "walletconnect_session_event_accounts_changed"
  | "wallet_handoff_started"
  | "wallet_return_detected"
  | "page_visibility_hidden"
  | "page_visibility_visible"
  | "app_focus_restored"
  | "appkit_account_snapshot"
  | "walletconnect_session_snapshot"
  | "walletconnect_session_delete_detected"
  | "walletconnect_session_expire_detected"
  | "walletconnect_request_expire_detected"
  | "manual_reconnect_detected"
  | "queued_request_detected"
  | "retry_clicked"
  | "retry_blocked_due_to_pending_chain_check"
  | "retry_allowed"
  | "ui_marked_approval_failed"
  | "ui_marked_user_cancelled"
  | "ui_marked_wallet_disconnected"
  | "ui_marked_unknown_wallet_error"
  | "signature_stall_deferred_after_wallet_return"
  | "signature_stall_recovery_fired"
  | "signature_stall_suppressed_premature"
  | "wallet_disconnect_reset_deferred"
  | "approval_recovered_on_chain_after_wallet_return"
  | "approval_recovered_on_chain_before_stall_fail"
  | "deposit_continuation_retry_signaled"
  | "deposit_continuation_started"
  | "deposit_continuation_resumed"
  | "approval_dispatch_blocked_allowance_sufficient"
  | "duplicate_approval_gas_risk"
  | "approval_success_deposit_never_started"
  | "stale_provider_update_blocked"
  | "recovered_wallet_wait_detected"
  | "recovered_wallet_wait_requires_prompt"
  | "wallet_open_prompt_requested"
  | "wallet_open_prompt_opened_inferred"
  | "wallet_open_prompt_not_accepted_or_cancelled"
  | "wallet_open_prompt_suppressed_duplicate"
  | "wallet_open_prompt_failed"
  | "recovered_wallet_wait_cancelled_pre_hash"
  | "recovered_wallet_wait_cancel_blocked_on_chain_recovered"
  | "recovered_wallet_wait_cancel_blocked_hash_exists"
  | "recovered_wallet_wait_prompt_rearmed_by_user_action"
  | "recovered_wallet_wait_prompt_not_shown_reason"
  | "wallet_handoff_hidden_detected"
  | "wallet_handoff_visible_timeout"
  | "wallet_handoff_account_modal_opened_wrongly"
  | "wallet_handoff_not_available_connected_account_modal_suppressed"
  | "recovered_wallet_wait_manual_open_hint_shown"
  | "tx_lifecycle_reset"
  | "tx_modal_closed"

type MobileStakingLanContext = {
  walletAddress: string | null
  chainId: number | null
  connectorName: string | null
  appKitAccountStatus: string | null
  wcSessionTopic: string | null
  wcPairingStatus: string | null
  wcSessionStatus: string | null
  submissionId: number | null
  flowRunId: string | null
  allowanceBefore: string | null
  allowanceAfter: string | null
  approvalTxHash: string | null
  stakeTxHash: string | null
  snapshot: TransactionStatusSnapshot | null
  inFlightWalletOp: string | null
  queuedWalletOps: string[]
}

const ctx: MobileStakingLanContext = {
  walletAddress: null,
  chainId: null,
  connectorName: null,
  appKitAccountStatus: null,
  wcSessionTopic: null,
  wcPairingStatus: null,
  wcSessionStatus: null,
  submissionId: null,
  flowRunId: null,
  allowanceBefore: null,
  allowanceAfter: null,
  approvalTxHash: null,
  stakeTxHash: null,
  snapshot: null,
  inFlightWalletOp: null,
  queuedWalletOps: [],
}

let handoffActive = false
let lastPageHiddenAt = 0
let lastPageVisibleAt = 0

export function noteMobileStakingPageHidden(): void {
  lastPageHiddenAt = Date.now()
}

export function noteMobileStakingPageVisible(): void {
  lastPageVisibleAt = Date.now()
}

/** True when Safari became visible after a recent background/hidden period. */
export function wasMobileWalletReturnWithinMs(windowMs: number): boolean {
  if (lastPageVisibleAt <= 0 || lastPageHiddenAt <= 0) return false
  if (lastPageVisibleAt <= lastPageHiddenAt) return false
  return Date.now() - lastPageVisibleAt < windowMs
}

export function updateMobileStakingLanContext(
  patch: Partial<MobileStakingLanContext>
): void {
  if (!isMobileStakingLanLogEnabled()) return
  Object.assign(ctx, patch)
  if (patch.snapshot) {
    ctx.approvalTxHash =
      patch.snapshot.approveTxHash?.trim() || ctx.approvalTxHash
    ctx.stakeTxHash =
      patch.snapshot.depositTxHash?.trim() ||
      patch.snapshot.withdrawTxHash?.trim() ||
      ctx.stakeTxHash
  }
  if (patch.approvalTxHash !== undefined) ctx.approvalTxHash = patch.approvalTxHash
  if (patch.stakeTxHash !== undefined) ctx.stakeTxHash = patch.stakeTxHash
}

export function markMobileStakingWalletHandoffStarted(source: string): void {
  if (!isMobileStakingLanLogEnabled()) return
  handoffActive = true
  traceMobileStakingFlow("wallet_handoff_started", { source })
}

export function markMobileStakingWalletReturn(source: string): void {
  if (!isMobileStakingLanLogEnabled() || !handoffActive) return
  handoffActive = false
  traceMobileStakingFlow("wallet_return_detected", { source })
}

export function beginMobileStakingWalletOp(op: string): void {
  if (!isMobileStakingLanLogEnabled()) return
  if (ctx.inFlightWalletOp) {
    ctx.queuedWalletOps.push(op)
    traceMobileStakingFlow("queued_request_detected", {
      newOp: op,
      inFlightOp: ctx.inFlightWalletOp,
      queueDepth: ctx.queuedWalletOps.length,
    })
  } else {
    ctx.inFlightWalletOp = op
  }
}

export function endMobileStakingWalletOp(op: string): void {
  if (!isMobileStakingLanLogEnabled()) return
  if (ctx.inFlightWalletOp === op) {
    ctx.inFlightWalletOp = null
    const next = ctx.queuedWalletOps.shift()
    if (next) {
      ctx.inFlightWalletOp = next
    }
  }
}

function resolvePostUrl(): string {
  if (typeof window === "undefined") return "/__mobile-staking-log"
  const host = window.location.hostname
  const port = window.location.port || "5173"
  return `http://${host}:${port}/__mobile-staking-log`
}

function errorFields(
  err: unknown
): { errorCode: string | null; errorMessage: string | null } {
  if (err == null) return { errorCode: null, errorMessage: null }
  const e = err as { code?: unknown; message?: unknown; name?: unknown }
  const code =
    typeof e.code === "string" || typeof e.code === "number"
      ? String(e.code)
      : typeof e.name === "string"
        ? e.name
        : null
  const message =
    typeof e.message === "string"
      ? e.message.slice(0, 500)
      : String(err).slice(0, 500)
  return { errorCode: code, errorMessage: message }
}

export function traceMobileStakingFlow(
  event: MobileStakingFlowEvent | string,
  detail: Record<string, unknown> = {},
  err?: unknown
): void {
  if (!isMobileStakingLanLogEnabled()) return

  const snap = ctx.snapshot
  const uiPhase = snap?.uiPhase ?? null
  const flowStep: MobileStakingFlowStep | null = deriveMobileStakingFlowStep(snap)
  const snapshotId = buildMobileStakingSnapshotId(snap)
  const errFields = err ? errorFields(err) : { errorCode: null, errorMessage: null }

  const payload: Record<string, unknown> = {
    event,
    timestamp: Date.now(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 280) : null,
    href: typeof window !== "undefined" ? window.location.href : null,
    visibilityState:
      typeof document !== "undefined" ? document.visibilityState : null,
    walletAddress: ctx.walletAddress,
    chainId: ctx.chainId,
    connectorName: ctx.connectorName,
    appKitAccountStatus: ctx.appKitAccountStatus,
    wcSessionTopic: ctx.wcSessionTopic,
    wcPairingStatus: ctx.wcPairingStatus,
    wcSessionStatus: ctx.wcSessionStatus,
    snapshotId,
    submissionId: ctx.submissionId,
    flowRunId: ctx.flowRunId ?? (ctx.submissionId != null ? String(ctx.submissionId) : null),
    approvalTxHash: ctx.approvalTxHash,
    stakeTxHash: ctx.stakeTxHash,
    allowanceBefore: ctx.allowanceBefore,
    allowanceAfter: ctx.allowanceAfter,
    uiPhase,
    flowStep,
    inFlightWalletOp: ctx.inFlightWalletOp,
    queuedWalletOps: [...ctx.queuedWalletOps],
    ...errFields,
    ...detail,
  }

  void fetch(resolvePostUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* LAN log sink unavailable */
  })
}

export function installMobileStakingLanLogGlobals(): void {
  if (!isMobileStakingLanLogEnabled() || typeof window === "undefined") return
  const w = window as typeof window & {
    __MOBILE_STAKING_LOG__?: { trace: typeof traceMobileStakingFlow }
  }
  w.__MOBILE_STAKING_LOG__ = { trace: traceMobileStakingFlow }
}
