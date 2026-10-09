import * as Sentry from "@sentry/nextjs"
import { isDevConsoleLoggingEnabled } from "@/lib/logger"
import { isSentryEnabled } from "@/lib/sentry"

export type AppKitInitTelemetryEvent =
  | "appkit_init_started"
  | "appkit_init_completed"
  | "appkit_init_failed"
  | "appkit_hook_render_before_ready"

export function appKitInitTelemetry(
  event: AppKitInitTelemetryEvent,
  data?: Readonly<Record<string, string | boolean | number | null>>
): void {
  if (isDevConsoleLoggingEnabled()) {
    console.info(`[appkit][${event}]`, data ?? {})
  }
  if (!isSentryEnabled()) return
  Sentry.addBreadcrumb({
    category: "appkit",
    message: event,
    level: event === "appkit_init_failed" || event === "appkit_hook_render_before_ready"
      ? "warning"
      : "info",
    data: data ?? undefined,
  })
}
