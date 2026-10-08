import {
  getAppKitInitState,
  isAppKitInitCompleted,
} from "@/lib/appKitBootstrap"
import { appKitInitTelemetry } from "@/lib/wallet/appKitInitTelemetry"

/**
 * DEV-only: prove hook render ordering when init has not completed.
 * Telemetry only — callers must gate render, not rely on this.
 */
export function assertAppKitSingletonForHook(hookName: string): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  if (isAppKitInitCompleted()) return

  const initState = getAppKitInitState()
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "unknown"
  const onStakingRoute =
    pathname === "/staking" ||
    pathname === "/app" ||
    /\/(staking|app)$/.test(pathname)
  const lazyRoute = onStakingRoute ? "StakingApp" : "other"

  const diagnostics: Record<string, string | boolean | number | null> = {
    hook: hookName,
    pathname,
    lazyRoute,
    init_completed: initState.completed,
    init_failed: initState.failed,
    init_in_flight: initState.inFlight,
    init_started: initState.started,
    stack: new Error("appkit_hook_before_singleton").stack ?? null,
  }

  // Defer so Next.js/React do not treat a render-time console.error as a hard crash.
  queueMicrotask(() => {
    console.warn("[appkit-dev-invariant] hook before singleton commit", diagnostics)
    appKitInitTelemetry("appkit_hook_render_before_ready", diagnostics)
  })
}
