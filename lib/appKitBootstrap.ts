/**
 * Canonical AppKit boot — one promise, one completion flag.
 * `await initializeAppKit()` means `createAppKit()` has committed synchronously.
 */
import { appKitInitTelemetry } from "@/lib/wallet/appKitInitTelemetry"
import { tryRecoverFromStaleChunkError } from "@/lib/wallet/installStaleChunkRecovery"

let initPromise: Promise<void> | null = null
let initCompleted = false
let initFailed = false
let initStarted = false

export type AppKitInitState = Readonly<{
  completed: boolean
  failed: boolean
  inFlight: boolean
  started: boolean
}>

export function getAppKitInitState(): AppKitInitState {
  return {
    completed: initCompleted,
    failed: initFailed,
    inFlight: initPromise != null && !initCompleted && !initFailed,
    started: initStarted,
  }
}

/** `true` iff `await initializeAppKit()` would resolve immediately. */
export function isAppKitInitCompleted(): boolean {
  return initCompleted
}

/**
 * Idempotent. Resolves only after `commitReownAppKit()` runs synchronously.
 * Rejects permanently on non-recoverable failure (same rejected promise).
 */
export function initializeAppKit(): Promise<void> {
  if (initCompleted) {
    return Promise.resolve()
  }
  if (initPromise) {
    return initPromise
  }

  initStarted = true
  appKitInitTelemetry("appkit_init_started")

  initPromise = (async () => {
    const { commitReownAppKit, isReownAppKitCommitted } = await import("@/reownKit")
    commitReownAppKit()
    if (!isReownAppKitCommitted()) {
      throw new Error("appkit_singleton_not_committed_after_create")
    }
    initCompleted = true
    appKitInitTelemetry("appkit_init_completed")
  })().catch(err => {
    initFailed = true
    appKitInitTelemetry("appkit_init_failed", {
      message: err instanceof Error ? err.message : String(err),
    })
    if (tryRecoverFromStaleChunkError(err, "initializeAppKit")) {
      return new Promise<void>(() => {
        /* guarded reload in flight — never resolve */
      })
    }
    throw err
  })

  return initPromise
}
