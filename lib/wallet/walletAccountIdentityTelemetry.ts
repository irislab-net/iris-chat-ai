import { walletDeepLinkTelemetry } from "@/lib/wallet/walletDeepLinkTelemetry"
import { isMobileStakingLanLogEnabled } from "@/config/mobileStakingLogEnv"
import { traceMobileStakingFlow } from "@/staking/diagnostics/mobileStakingLanLog"

export type WalletAccountIdentityTelemetryEvent =
  | "wallet_manual_disconnect_requested"
  | "wallet_manual_disconnect_guard_set"
  | "wallet_manual_disconnect_guard_cleared"
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

export function traceWalletAccountIdentity(
  event: WalletAccountIdentityTelemetryEvent,
  detail: Readonly<Record<string, string | boolean | number | null>> = {}
): void {
  walletDeepLinkTelemetry("wallet_reconnect_completed", {
    identity_event: event,
    ...detail,
  })
  if (isMobileStakingLanLogEnabled()) {
    traceMobileStakingFlow(event, detail)
  }
}
