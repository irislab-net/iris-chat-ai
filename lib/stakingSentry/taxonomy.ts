/**
 * Canonical staking Sentry event taxonomy — stable names for search, alerts, and dedupe.
 * Every production signal MUST use one of these dotted namespaces.
 */

export const STAKING_SENTRY_EVENT = {
  runtime: {
    connect_stalled: "staking.runtime.connect_stalled",
    vault_tx_loading_stalled: "staking.runtime.vault_tx_loading_stalled",
    runtime_swap_stalled: "staking.runtime.runtime_swap_stalled",
    runtime_ready: "staking.runtime.runtime_ready",
    deadlock_detected: "staking.runtime.deadlock_detected",
  },
  wallet: {
    connect_failed: "staking.wallet.connect_failed",
    signer_hydration_stalled: "staking.wallet.signer_hydration_stalled",
    malformed_eth_accounts: "staking.wallet.malformed_eth_accounts",
    provider_resume_corruption: "staking.wallet.provider_resume_corruption",
    deep_link_never_triggered: "staking.wallet.deep_link_never_triggered",
    wallet_return_unresolved: "staking.wallet.wallet_return_unresolved",
    trust_webview_incompatible: "staking.wallet.trust_webview_incompatible",
    walletconnect_partial_hydration: "staking.wallet.walletconnect_partial_hydration",
  },
  tx: {
    lifecycle_failed: "staking.tx.lifecycle_failed",
    awaiting_signature_stalled: "staking.tx.awaiting_signature_stalled",
    orphaned_lifecycle: "staking.tx.orphaned_lifecycle",
    receipt_failed: "staking.tx.receipt_failed",
  },
  hydration: {
    signer_hydration_stalled: "staking.hydration.signer_hydration_stalled",
    reconcile_failure: "staking.hydration.reconcile_failure",
    persisted_restore_skew: "staking.hydration.persisted_restore_skew",
    abandoned: "staking.hydration.abandoned",
  },
  refresh: {
    refresh_plane_deadlock: "staking.refresh.refresh_plane_deadlock",
    orchestrator_starvation: "staking.refresh.orchestrator_starvation",
    balance_wall_stall: "staking.refresh.balance_wall_stall",
  },
  network: {
    wrong_network_stuck: "staking.network.wrong_network_stuck",
    switch_stalled: "staking.network.switch_stalled",
    rpc_degradation: "staking.network.rpc_degradation",
    rpc_failure: "staking.network.rpc_failure",
    indexer_failure: "staking.network.indexer_failure",
    api_failure: "staking.network.api_failure",
    websocket_failure: "staking.network.websocket_failure",
    wallet_session_failure: "staking.network.wallet_session_failure",
  },
  runtime_selection: {
    desync: "staking.runtime_selection.desync",
    invalid_selection: "staking.runtime_selection.invalid_selection",
  },
  provider: {
    hierarchy_corruption: "staking.provider.hierarchy_corruption",
    reconnect_loop: "staking.provider.reconnect_loop",
  },
  mobile: {
    visibility_resume_stall: "staking.mobile.visibility_resume_stall",
    bfcache_restore_failed: "staking.mobile.bfcache_restore_failed",
    deep_link_handoff_stall: "staking.mobile.deep_link_handoff_stall",
  },
  visibility: {
    hidden_during_tx: "staking.visibility.hidden_during_tx",
    resume_after_hidden_stall: "staking.visibility.resume_after_hidden_stall",
  },
  firebase: {
    init_failed: "staking.firebase.init_failed",
    stats_read_failed: "staking.firebase.stats_read_failed",
  },
  appcheck: {
    token_failed: "staking.appcheck.token_failed",
  },
  orchestrator: {
    commit_denied_loop: "staking.orchestrator.commit_denied_loop",
    refresh_skipped_wall: "staking.orchestrator.refresh_skipped_wall",
  },
  invariant: {
    runtime_family_mismatch: "staking.invariant.runtime_family_mismatch",
    disabled_family_participating: "staking.invariant.disabled_family_participating",
    stale_generation_collision: "staking.invariant.stale_generation_collision",
    impossible_execution_state: "staking.invariant.impossible_execution_state",
    provider_tree_corruption: "staking.invariant.provider_tree_corruption",
    hook_order: "staking.invariant.hook_order",
    runtime_swap_final_failed: "staking.invariant.runtime_swap_final_failed",
    sequence_ordering: "staking.invariant.sequence_ordering",
  },
  async: {
    commit_denied: "staking.async.commit_denied",
    stale_operation: "staking.async.stale_operation",
    unresolved_promise: "staking.async.unresolved_promise",
    aborted_runtime_swap: "staking.async.aborted_runtime_swap",
  },
  performance: {
    gas_estimate_depth: "staking.performance.gas_estimate_depth",
    modal_phase_stall: "staking.performance.modal_phase_stall",
  },
} as const

export type StakingSentryEventName =
  | (typeof STAKING_SENTRY_EVENT.runtime)[keyof typeof STAKING_SENTRY_EVENT.runtime]
  | (typeof STAKING_SENTRY_EVENT.wallet)[keyof typeof STAKING_SENTRY_EVENT.wallet]
  | (typeof STAKING_SENTRY_EVENT.tx)[keyof typeof STAKING_SENTRY_EVENT.tx]
  | (typeof STAKING_SENTRY_EVENT.hydration)[keyof typeof STAKING_SENTRY_EVENT.hydration]
  | (typeof STAKING_SENTRY_EVENT.refresh)[keyof typeof STAKING_SENTRY_EVENT.refresh]
  | (typeof STAKING_SENTRY_EVENT.network)[keyof typeof STAKING_SENTRY_EVENT.network]
  | (typeof STAKING_SENTRY_EVENT.runtime_selection)[keyof typeof STAKING_SENTRY_EVENT.runtime_selection]
  | (typeof STAKING_SENTRY_EVENT.provider)[keyof typeof STAKING_SENTRY_EVENT.provider]
  | (typeof STAKING_SENTRY_EVENT.mobile)[keyof typeof STAKING_SENTRY_EVENT.mobile]
  | (typeof STAKING_SENTRY_EVENT.visibility)[keyof typeof STAKING_SENTRY_EVENT.visibility]
  | (typeof STAKING_SENTRY_EVENT.firebase)[keyof typeof STAKING_SENTRY_EVENT.firebase]
  | (typeof STAKING_SENTRY_EVENT.appcheck)[keyof typeof STAKING_SENTRY_EVENT.appcheck]
  | (typeof STAKING_SENTRY_EVENT.orchestrator)[keyof typeof STAKING_SENTRY_EVENT.orchestrator]
  | (typeof STAKING_SENTRY_EVENT.invariant)[keyof typeof STAKING_SENTRY_EVENT.invariant]
  | (typeof STAKING_SENTRY_EVENT.async)[keyof typeof STAKING_SENTRY_EVENT.async]
  | (typeof STAKING_SENTRY_EVENT.performance)[keyof typeof STAKING_SENTRY_EVENT.performance]

/** Maps Phase-43 runtimeTelemetry aggregate names → canonical Sentry events. */
export const RUNTIME_TELEMETRY_TO_SENTRY: Readonly<
  Record<string, StakingSentryEventName>
> = {
  runtime_transition_stuck: STAKING_SENTRY_EVENT.runtime.runtime_swap_stalled,
  orchestrator_starvation: STAKING_SENTRY_EVENT.refresh.orchestrator_starvation,
  staking_balance_refresh_wall_stall: STAKING_SENTRY_EVENT.refresh.balance_wall_stall,
  staking_history_refresh_starvation: STAKING_SENTRY_EVENT.refresh.refresh_plane_deadlock,
  tron_passive_read_repeated_failure: STAKING_SENTRY_EVENT.network.rpc_degradation,
  repeated_async_commit_denied: STAKING_SENTRY_EVENT.async.commit_denied,
  hydrate_reconcile_failure: STAKING_SENTRY_EVENT.hydration.reconcile_failure,
  modal_non_terminal_timeout: STAKING_SENTRY_EVENT.performance.modal_phase_stall,
  modal_phase_stall: STAKING_SENTRY_EVENT.performance.modal_phase_stall,
  tx_retry_loop_excessive: STAKING_SENTRY_EVENT.tx.orphaned_lifecycle,
  rpc_degradation_detected: STAKING_SENTRY_EVENT.network.rpc_degradation,
  rpc_degradation_recovered: STAKING_SENTRY_EVENT.network.rpc_degradation,
  runtime_selection_desync: STAKING_SENTRY_EVENT.runtime_selection.desync,
  registry_growth_abnormal: STAKING_SENTRY_EVENT.invariant.impossible_execution_state,
  excessive_gas_estimate_depth: STAKING_SENTRY_EVENT.performance.gas_estimate_depth,
  provider_reconnect_loop: STAKING_SENTRY_EVENT.provider.reconnect_loop,
}
