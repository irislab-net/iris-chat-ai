import { initializeAppKit, isAppKitInitCompleted } from "@/lib/appKitBootstrap"
import { walletDeepLinkTelemetry } from "@/lib/wallet/walletDeepLinkTelemetry"
import type { AppKit } from "@reown/appkit/react"

/** AppKit restores WC sessions asynchronously — no resets during this window. */
const HYDRATION_GRACE_MS = 12_000

let hydrationGraceUntilMs = 0
let appLayerResetCount = 0
let lastAppLayerResetReason: string | null = null

export function beginAppKitHydrationGracePeriod(): void {
  hydrationGraceUntilMs = Date.now() + HYDRATION_GRACE_MS
}

export function isWithinAppKitHydrationGrace(): boolean {
  return Date.now() < hydrationGraceUntilMs
}

export function recordAppLayerWalletReset(reason: string): void {
  appLayerResetCount += 1
  lastAppLayerResetReason = reason
}

export function readAppLayerResetDiagnostics(): Readonly<{
  resetCount: number
  lastReason: string | null
}> {
  return {
    resetCount: appLayerResetCount,
    lastReason: lastAppLayerResetReason,
  }
}

function wcStorageKeyMatches(key: string): boolean {
  return (
    /^wc@2:/i.test(key) ||
    /^walletconnect/i.test(key) ||
    /^wcm_/i.test(key) ||
    /^@w3m\//i.test(key) ||
    /^@appkit\//i.test(key) ||
    /^reown/i.test(key)
  )
}

export function snapshotWalletConnectStorageKeyCounts(): Readonly<{
  local: number
  session: number
}> {
  let local = 0
  let session = 0
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i)
        if (key && wcStorageKeyMatches(key)) local += 1
      }
    }
    if (typeof window !== "undefined" && window.sessionStorage) {
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i)
        if (key && wcStorageKeyMatches(key)) session += 1
      }
    }
  } catch {
    /* private mode */
  }
  return { local, session }
}

async function getAppKitForObservation(): Promise<AppKit | undefined> {
  if (!isAppKitInitCompleted()) {
    await initializeAppKit()
  }
  const { getReownAppKitModal } = await import("@/reownKit")
  return getReownAppKitModal()
}

/** Read-only — never disconnects or mutates storage. */
export async function observeAppKitSessionSnapshot(): Promise<
  Record<string, string | boolean | number | null>
> {
  const storage = snapshotWalletConnectStorageKeyCounts()
  const appKit = await getAppKitForObservation()
  if (!appKit) {
    return {
      appkit_available: false,
      storage_local_wc_keys: storage.local,
      storage_session_wc_keys: storage.session,
    }
  }

  try {
    await appKit.ready()
  } catch {
    return {
      appkit_available: true,
      appkit_ready: false,
      storage_local_wc_keys: storage.local,
      storage_session_wc_keys: storage.session,
    }
  }

  const eip155 = appKit.getAccount("eip155")
  const tron = appKit.getAccount("tron")
  let sessionTopic: string | null = null
  try {
    const provider = await appKit.getUniversalProvider()
    sessionTopic = provider?.session?.topic?.trim() ?? null
  } catch {
    sessionTopic = null
  }

  return {
    appkit_available: true,
    appkit_ready: true,
    eip155_connected: Boolean(eip155?.isConnected),
    eip155_status: eip155?.status ?? null,
    eip155_address_present: Boolean(eip155?.address?.trim()),
    tron_connected: Boolean(tron?.isConnected),
    tron_status: tron?.status ?? null,
    session_topic_present: Boolean(sessionTopic),
    storage_local_wc_keys: storage.local,
    storage_session_wc_keys: storage.session,
  }
}

function logRefreshDisconnectInvariant(input: Readonly<{
  initial: Record<string, string | boolean | number | null>
  settled: Record<string, string | boolean | number | null>
  storageAtBoot: Readonly<{ local: number; session: number }>
  storageSettled: Readonly<{ local: number; session: number }>
}>): void {
  const wasConnected = Boolean(input.initial.eip155_connected)
  const nowConnected = Boolean(input.settled.eip155_connected)
  if (!wasConnected || nowConnected) return

  const resets = readAppLayerResetDiagnostics()
  const payload: Record<string, string | boolean | number | null> = {
    phase: "refresh_disconnect_invariant",
    appkit_restored_eip155_initial: wasConnected,
    appkit_eip155_settled: nowConnected,
    app_layer_reset_count: resets.resetCount,
    app_layer_reset_after_restore: resets.resetCount > 0,
    app_layer_last_reset_reason: resets.lastReason,
    storage_local_at_boot: input.storageAtBoot.local,
    storage_session_at_boot: input.storageAtBoot.session,
    storage_local_settled: input.storageSettled.local,
    storage_session_settled: input.storageSettled.session,
    storage_mutated:
      input.storageAtBoot.local !== input.storageSettled.local ||
      input.storageAtBoot.session !== input.storageSettled.session,
  }

  if ((process.env.NODE_ENV !== 'production')) {
    console.warn("[appkit-hydration] disconnect after refresh", payload)
  }
  walletDeepLinkTelemetry("wallet_session_invalid", payload)
}

/**
 * Observational only — AppKit owns session restore; we never reset on boot.
 */
export async function observeAppKitSessionHydrationOnStartup(): Promise<void> {
  beginAppKitHydrationGracePeriod()
  const storageAtBoot = snapshotWalletConnectStorageKeyCounts()
  walletDeepLinkTelemetry("wallet_reconnect_started", {
    phase: "hydration_observe",
    storage_local_wc_keys: storageAtBoot.local,
    storage_session_wc_keys: storageAtBoot.session,
  })

  try {
    const initial = await observeAppKitSessionSnapshot()
    walletDeepLinkTelemetry("wallet_reconnect_completed", {
      phase: "hydration_initial",
      ...initial,
    })

    window.setTimeout(() => {
      void (async () => {
        const settled = await observeAppKitSessionSnapshot()
        const storageSettled = snapshotWalletConnectStorageKeyCounts()
        const resets = readAppLayerResetDiagnostics()
        walletDeepLinkTelemetry("wallet_reconnect_completed", {
          phase: "hydration_settled",
          ...settled,
          app_layer_reset_count: resets.resetCount,
          app_layer_last_reset_reason: resets.lastReason,
        })
        logRefreshDisconnectInvariant({
          initial,
          settled,
          storageAtBoot,
          storageSettled,
        })
      })()
    }, 3_000)
  } catch (err) {
    walletDeepLinkTelemetry("wallet_session_invalid", {
      phase: "hydration_observe_failed",
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
