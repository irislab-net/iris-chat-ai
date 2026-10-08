/**
 * Phase 43 — transport-agnostic runtime / staking health telemetry (types only).
 * No React; safe for production when gated by rollout stage + sampling.
 */

export type RuntimeTelemetrySeverity = "info" | "warning" | "error" | "critical"

/** Aggregate event names only — no PII payloads. */
export type RuntimeTelemetryEventName =
  | "runtime_transition_stuck"
  | "orchestrator_starvation"
  | "staking_balance_refresh_wall_stall"
  | "staking_history_refresh_starvation"
  | "tron_passive_read_repeated_failure"
  | "repeated_async_commit_denied"
  | "hydrate_reconcile_failure"
  | "modal_non_terminal_timeout"
  | "modal_phase_stall"
  | "tx_retry_loop_excessive"
  | "rpc_degradation_detected"
  | "rpc_degradation_recovered"
  | "runtime_selection_desync"
  | "registry_growth_abnormal"
  | "excessive_gas_estimate_depth"
  | "provider_reconnect_loop"

/** Allowed production breadcrumbs — never wallet address, balances, tx values, or raw RPC. */
export type RuntimeTelemetryBreadcrumb = Readonly<{
  runtimeKey?: string
  deploymentId?: string
  chainFamily?: string
  lifecycle?: string
  sequenceStage?: string
  uiPhase?: string | null
  transitionGeneration?: number
  chainId?: number | null
  /** Opaque short reason token, e.g. policy / gate code — not stack traces. */
  reasonToken?: string
}>

export type RuntimeTelemetryEvent = Readonly<{
  name: RuntimeTelemetryEventName
  severity: RuntimeTelemetrySeverity
  /** Monotonic client clock ms. */
  ts: number
  breadcrumbs?: RuntimeTelemetryBreadcrumb
  /** Optional coarse counter for aggregated signals. */
  count?: number
}>

export type RuntimeTelemetrySink = (event: RuntimeTelemetryEvent) => void
