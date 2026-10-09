import { initializeAppKit } from "@/lib/appKitBootstrap"
import {
  isWithinAppKitHydrationGrace,
  observeAppKitSessionSnapshot,
  recordAppLayerWalletReset,
} from "@/lib/wallet/appKitSessionHydrationObserve"
import { isStakingTxModalActivityActive } from "@/staking/tx/stakingTxSessionRecoveryPolicy"
import { markWalletConnectHandoffAttempt } from "@/lib/wallet/walletConnectHandoffTiming"
import { walletDeepLinkTelemetry } from "@/lib/wallet/walletDeepLinkTelemetry"
import type { AppKit } from "@reown/appkit/react"

const RESET_COOLDOWN_MS = 2_000

/** Global mutex — concurrent callers share one reset; cleared in `finally`. */
let activeWalletConnectResetPromise: Promise<void> | null = null
let lastResetAtMs = 0

const STALE_SESSION_PATTERNS: readonly RegExp[] = [
  /no matching key/i,
  /session topic doesn't exist/i,
  /session topic does not exist/i,
  /pairing topic doesn't exist/i,
  /pairing topic does not exist/i,
  /invalid_session/i,
  /session not found/i,
  /proposal expired/i,
  /expired pairing/i,
  /walletconnect.*disconnected/i,
  /session disconnected/i,
  /connection (?:was )?closed/i,
  /relay (?:is )?not connected/i,
  /websocket (?:is )?closed/i,
]

const TX_DISPATCH_UNREACHABLE_PATTERNS: readonly RegExp[] = [
  /could not coalesce error/i,
  /\b-32603\b/,
  /please, try again/i,
  /eth_sendtransaction/i,
  /eth_sendTransaction/i,
]

export function summarizeStakingWalletError(error: unknown): {
  errorCode: string | number | null
  errorMessage: string
  staleSessionDetected: boolean
} {
  const cause =
    error && typeof error === "object" && "cause" in error
      ? (error as { cause?: unknown }).cause
      : undefined
  const parts: string[] = []
  for (const candidate of [error, cause]) {
    if (candidate instanceof Error) {
      parts.push(candidate.message, candidate.name)
    } else if (typeof candidate === "string") {
      parts.push(candidate)
    } else if (candidate && typeof candidate === "object") {
      const row = candidate as { message?: unknown; reason?: unknown; code?: unknown }
      if (typeof row.message === "string") parts.push(row.message)
      if (typeof row.reason === "string") parts.push(row.reason)
      if (row.code != null) parts.push(String(row.code))
    }
  }
  const errorMessage = parts.filter(Boolean).join(" ").trim() || "unknown"
  let errorCode: string | number | null = null
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string | number }).code
    if (code != null) errorCode = code
  }
  return {
    errorCode,
    errorMessage: errorMessage.slice(0, 240),
    staleSessionDetected:
      isWalletConnectStaleSessionError(error) ||
      isWalletConnectStaleSessionError(cause),
  }
}

export function isWalletConnectTxDispatchUnreachableError(error: unknown): boolean {
  const summary = summarizeStakingWalletError(error)
  if (summary.errorCode === -32603 || summary.errorCode === "-32603") {
    return true
  }
  return TX_DISPATCH_UNREACHABLE_PATTERNS.some(re => re.test(summary.errorMessage))
}

function walletResetDevLog(message: string, detail?: unknown): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  if (detail !== undefined) {
    console.debug(`[wallet-reset] ${message}`, detail)
  } else {
    console.debug(`[wallet-reset] ${message}`)
  }
}

export function isWalletConnectStaleSessionError(error: unknown): boolean {
  const parts: string[] = []
  if (error instanceof Error) {
    parts.push(error.message, error.name)
    if (error.cause != null) parts.push(String(error.cause))
  } else if (typeof error === "string") {
    parts.push(error)
  } else if (error && typeof error === "object") {
    const row = error as { message?: unknown; code?: unknown; reason?: unknown }
    if (typeof row.message === "string") parts.push(row.message)
    if (typeof row.reason === "string") parts.push(row.reason)
    if (row.code != null) parts.push(String(row.code))
  }
  const text = parts.join(" ")
  if (!text.trim()) return false
  return STALE_SESSION_PATTERNS.some(re => re.test(text))
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true
  if (error instanceof Error && error.name === "AbortError") return true
  const text = error instanceof Error ? error.message : String(error ?? "")
  return /\babort(ed)?\b/i.test(text)
}

async function getAppKitInstance(): Promise<AppKit | undefined> {
  try {
    await initializeAppKit()
    const { getReownAppKitModal } = await import("@/reownKit")
    return getReownAppKitModal()
  } catch (err) {
    walletResetDevLog("getAppKitInstance_failed", err)
    return undefined
  }
}

/** Removes WalletConnect / Reown persisted browser state (pairings, sessions, keychain). */
export function clearWalletConnectBrowserStorage(): void {
  if (typeof window === "undefined") return

  let local: Storage | null = null
  let session: Storage | null = null
  try {
    local = window.localStorage
    session = window.sessionStorage
  } catch (err) {
    walletResetDevLog("clearWalletConnectBrowserStorage_storage_unavailable", err)
    return
  }

  const storages = [local, session].filter((s): s is Storage => s != null)

  const keyMatches = (key: string): boolean =>
    /^wc@2:/i.test(key) ||
    /^walletconnect/i.test(key) ||
    /^wcm_/i.test(key) ||
    /^@w3m\//i.test(key) ||
    /^@appkit\//i.test(key) ||
    /^reown/i.test(key)

  for (const storage of storages) {
    let keys: string[] = []
    try {
      keys = []
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i)
        if (key && keyMatches(key)) keys.push(key)
      }
    } catch (err) {
      walletResetDevLog("clearWalletConnectBrowserStorage_enumerate_failed", err)
      continue
    }
    for (const key of keys) {
      try {
        storage.removeItem(key)
      } catch (err) {
        walletResetDevLog("clearWalletConnectBrowserStorage_remove_failed", {
          key,
          err,
        })
      }
    }
  }
}

async function disconnectNamespace(appKit: AppKit, ns: "eip155" | "tron"): Promise<void> {
  try {
    await appKit.disconnect(ns)
  } catch (err) {
    walletResetDevLog(`disconnect_${ns}_failed`, err)
  }
}

async function disconnectAllNamespaces(appKit: AppKit): Promise<void> {
  await disconnectNamespace(appKit, "eip155")
  await disconnectNamespace(appKit, "tron")
  try {
    await appKit.disconnect()
  } catch (err) {
    walletResetDevLog("disconnect_all_failed", err)
  }
  try {
    const provider = await appKit.getUniversalProvider()
    await provider?.disconnect?.()
  } catch (err) {
    walletResetDevLog("universal_provider_disconnect_failed", err)
  }
}

async function runHardResetBody(reason: string): Promise<void> {
  recordAppLayerWalletReset(reason)
  walletDeepLinkTelemetry("wallet_session_reset", { reason })
  walletDeepLinkTelemetry("wallet_reconnect_started", { reason })

  try {
    const appKit = await getAppKitInstance()
    if (appKit) {
      await disconnectAllNamespaces(appKit)
    }
  } catch (err) {
    walletResetDevLog("runHardResetBody_disconnect_failed", err)
  }

  try {
    clearWalletConnectBrowserStorage()
  } catch (err) {
    walletResetDevLog("runHardResetBody_clear_storage_failed", err)
  }

  lastResetAtMs = Date.now()
  walletDeepLinkTelemetry("wallet_reconnect_completed", { reason })
}

/**
 * Full WalletConnect reset after a **confirmed** runtime failure only.
 * Never called from startup / hydration / passive validation.
 */
export function hardResetWalletConnectSession(reason: string): Promise<void> {
  if (activeWalletConnectResetPromise) {
    return activeWalletConnectResetPromise
  }

  const now = Date.now()
  if (now - lastResetAtMs < RESET_COOLDOWN_MS) {
    return Promise.resolve()
  }

  activeWalletConnectResetPromise = runHardResetBody(reason).finally(() => {
    activeWalletConnectResetPromise = null
  })

  return activeWalletConnectResetPromise
}

/** Sync only — safe on iOS user-gesture stack before `appKit.open()`. */
export function markWalletConnectDeepLinkAttempt(source: string): void {
  markWalletConnectHandoffAttempt(source)
  walletDeepLinkTelemetry("wallet_deeplink_attempt", { source })
}

/** Observational telemetry after `appKit.open()` — no session validation or reset. */
export async function runWalletConnectPostOpenPrecheck(source: string): Promise<void> {
  try {
    const snapshot = await observeAppKitSessionSnapshot()
    walletDeepLinkTelemetry("wallet_deeplink_dispatched", {
      source,
      phase: "post_open_observe",
      ...snapshot,
    })
  } catch (err) {
    walletResetDevLog("runWalletConnectPostOpenPrecheck_failed", err)
  }
}

/**
 * Telemetry only before a vault `sendTransaction` — does **not** validate WC session.
 * AppKit owns session restore; app gates on `txExecutionReady` (signer + provider + canTransact).
 */
export function markWalletConnectTxDispatchTelemetry(source: string): void {
  markWalletConnectDeepLinkAttempt(source)
  walletDeepLinkTelemetry("wallet_deeplink_dispatched", {
    source,
    phase: "tx_dispatch_telemetry",
  })
}

/** @deprecated Use `markWalletConnectTxDispatchTelemetry` — never implied session validity. */
export async function ensureWalletConnectSessionForRequest(
  source: string
): Promise<boolean> {
  markWalletConnectTxDispatchTelemetry(source)
  return true
}

export async function handleWalletConnectStaleSessionError(
  source: string,
  error: unknown
): Promise<boolean> {
  if (!isWalletConnectStaleSessionError(error)) {
    return false
  }
  if (isWithinAppKitHydrationGrace()) {
    walletDeepLinkTelemetry("wallet_session_invalid", {
      source,
      phase: "hydration_grace_observed_only",
      message: error instanceof Error ? error.message : String(error),
    })
    return false
  }
  if (isStakingTxModalActivityActive()) {
    walletDeepLinkTelemetry("wallet_session_invalid", {
      source,
      phase: "tx_modal_active_observed_only",
      message: error instanceof Error ? error.message : String(error),
    })
    return false
  }
  try {
    walletDeepLinkTelemetry("wallet_session_invalid", { source })
    await hardResetWalletConnectSession(`error:${source}`)
    return true
  } catch (err) {
    walletResetDevLog("handleWalletConnectStaleSessionError_failed", err)
    return true
  }
}

export function installWalletConnectGlobalErrorRecovery(): void {
  if (typeof window === "undefined") return

  window.addEventListener("unhandledrejection", event => {
    if (!isWalletConnectStaleSessionError(event.reason)) return
    event.preventDefault()
    if (isWithinAppKitHydrationGrace()) {
      walletDeepLinkTelemetry("wallet_session_invalid", {
        source: "unhandledrejection",
        phase: "hydration_grace_observed_only",
        message:
          event.reason instanceof Error
            ? event.reason.message
            : String(event.reason ?? ""),
      })
      return
    }
    if (isStakingTxModalActivityActive()) {
      walletDeepLinkTelemetry("wallet_session_invalid", {
        source: "unhandledrejection",
        phase: "tx_modal_active_observed_only",
        message:
          event.reason instanceof Error
            ? event.reason.message
            : String(event.reason ?? ""),
      })
      return
    }
    void handleWalletConnectStaleSessionError("unhandledrejection", event.reason)
  })
}
