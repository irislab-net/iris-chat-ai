import * as Sentry from "@sentry/nextjs"
import { isDevConsoleLoggingEnabled } from "@/lib/logger"
import { readDeployCorrelationData } from "@/lib/runtimeDeployCorrelation"
import { isSentryEnabled } from "@/lib/sentry"

/** Production-safe wallet / WalletConnect deep-link telemetry (breadcrumbs only). */
export type WalletDeepLinkTelemetryEvent =
  | "wallet_deeplink_attempt"
  | "wallet_deeplink_dispatched"
  | "wallet_session_invalid"
  | "wallet_session_reset"
  | "wallet_request_timeout"
  | "wallet_reconnect_started"
  | "wallet_reconnect_completed"
  | "stale_chunk_recovery"

export function walletDeepLinkTelemetry(
  event: WalletDeepLinkTelemetryEvent,
  data?: Readonly<Record<string, string | boolean | number | null>>
): void {
  if (isDevConsoleLoggingEnabled()) {
    console.info(`[wallet][${event}]`, data ?? {})
  }
  if (!isSentryEnabled()) return
  Sentry.addBreadcrumb({
    category: "wallet",
    message: event,
    level:
      event === "wallet_session_invalid" ||
      event === "wallet_request_timeout" ||
      event === "wallet_session_reset" ||
      event === "stale_chunk_recovery"
        ? "warning"
        : "info",
    data: {
      ...readDeployCorrelationData(),
      ...(data ?? {}),
    },
  })
}
