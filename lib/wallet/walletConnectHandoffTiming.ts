import * as Sentry from "@sentry/nextjs"
import { isSentryEnabled } from "@/lib/sentry"
import { readDeployCorrelationData } from "@/lib/runtimeDeployCorrelation"

let pendingConnectAtMs: number | null = null
let pendingConnectSource: string | null = null

/** Mark the start of a wallet connect / deep-link handoff (paired with visibility hidden). */
export function markWalletConnectHandoffAttempt(source: string): void {
  pendingConnectAtMs = Date.now()
  pendingConnectSource = source
}

function clearPendingHandoff(): void {
  pendingConnectAtMs = null
  pendingConnectSource = null
}

/**
 * Breadcrumb-only metric: ms from connect attempt to `document.visibilityState === hidden`.
 * Helps distinguish AppKit dispatch failure vs wallet never opened vs user ignored request.
 */
export function installWalletConnectHandoffTiming(): void {
  if (typeof document === "undefined") return

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return
    if (pendingConnectAtMs == null) return

    const ms = Date.now() - pendingConnectAtMs
    const source = pendingConnectSource
    clearPendingHandoff()

    if (!isSentryEnabled()) return
    Sentry.addBreadcrumb({
      category: "wallet",
      message: "wallet_connect_visibility_hidden_ms",
      level: "info",
      data: {
        time_between_connect_attempt_and_visibility_hidden_ms: ms,
        source: source ?? "unknown",
        ...readDeployCorrelationData(),
      },
    })
  })
}
