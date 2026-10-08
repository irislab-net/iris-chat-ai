import * as Sentry from "@sentry/nextjs"
import { isSentryEnabled } from "@/lib/sentry"

/** Sparse canonical breadcrumb stream — never render/poll/animation. */
export type StakingSentryBreadcrumbKind =
  | "connect_clicked"
  | "wallet_modal_open"
  | "wallet_connected"
  | "signer_hydration_start"
  | "signer_hydration_success"
  | "signer_hydration_failure"
  | "signer_hydration_resume_nudge"
  | "runtime_reconcile"
  | "runtime_swap"
  | "runtime_ready"
  | "tx_started"
  | "tx_signature_requested"
  | "tx_hash_received"
  | "tx_confirming"
  | "tx_confirmed"
  | "tx_failed"
  | "tx_submitted"
  | "connect_stalled"
  | "visibility_hidden"
  | "visibility_visible"
  | "pageshow"
  | "pagehide"
  | "runtime_deadlock_detected"
  | "vault_tx_execution_abandoned"

const BREADCRUMB_ONCE_PER_SESSION = new Set<StakingSentryBreadcrumbKind>([
  "runtime_ready",
])

const breadcrumbOnceEmitted = new Set<StakingSentryBreadcrumbKind>()

const ERROR_BREADCRUMBS: ReadonlySet<StakingSentryBreadcrumbKind> = new Set([
  "tx_failed",
  "signer_hydration_failure",
  "connect_stalled",
  "runtime_deadlock_detected",
])

export function stakingSentryBreadcrumb(
  kind: StakingSentryBreadcrumbKind,
  data?: Readonly<Record<string, string | boolean | number | null>>
): void {
  if (!isSentryEnabled()) return

  if (
    BREADCRUMB_ONCE_PER_SESSION.has(kind) &&
    breadcrumbOnceEmitted.has(kind)
  ) {
    return
  }
  breadcrumbOnceEmitted.add(kind)

  Sentry.addBreadcrumb({
    category: "staking",
    message: kind,
    level: ERROR_BREADCRUMBS.has(kind) ? "error" : "info",
    data: data ?? undefined,
  })
}

export function stakingSentryRuntimeReadyOnce(
  data?: Readonly<Record<string, string | boolean | number | null>>
): void {
  stakingSentryBreadcrumb("runtime_ready", data)
}
