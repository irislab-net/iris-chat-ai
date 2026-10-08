import { initializeAppKit, isAppKitInitCompleted } from "@/lib/appKitBootstrap"
import {
  clearWalletManualDisconnectGuard,
  isWalletManualDisconnectGuardActive,
  readWalletManualDisconnectGuard,
  setWalletManualDisconnectGuard,
} from "@/lib/wallet/walletManualDisconnectGuard"
import { traceWalletAccountIdentity } from "@/lib/wallet/walletAccountIdentityTelemetry"

export type EffectiveEvmWalletIdentity = Readonly<{
  effectiveAddress: string | undefined
  effectiveConnected: boolean
  manualDisconnectGuard: boolean
  suppressedByDisconnectGuard: boolean
  hydrationSettled: boolean
}>

let hydrationStarted = false
let hydrationSettled = false
let freshConnectGestureAt = 0

export function noteAppKitAccountHydrationStarted(): void {
  if (hydrationStarted) return
  hydrationStarted = true
  traceWalletAccountIdentity("appkit_account_hydration_started")
}

export function noteAppKitAccountHydrationSettled(): void {
  if (hydrationSettled) return
  hydrationSettled = true
  traceWalletAccountIdentity("appkit_account_hydration_settled")
}

export function isAppKitAccountHydrationSettled(): boolean {
  return hydrationSettled
}

export function noteWalletFreshConnectGesture(source: string): void {
  freshConnectGestureAt = Date.now()
  if (isWalletManualDisconnectGuardActive()) {
    clearWalletManualDisconnectGuard(`fresh_connect:${source}`)
  }
}

export function resolveEffectiveEvmWalletIdentity(input: Readonly<{
  appKitAddress: string | undefined
  appKitConnected: boolean
  appKitStatus: string | undefined
  hydrationSettled?: boolean
}>): EffectiveEvmWalletIdentity {
  const settled = input.hydrationSettled ?? hydrationSettled
  const guardActive = isWalletManualDisconnectGuardActive()
  const guardRow = readWalletManualDisconnectGuard()
  const appKitAddress = input.appKitAddress?.trim() || undefined
  const appKitConnected = Boolean(input.appKitConnected && appKitAddress)

  if (
    guardActive &&
    appKitConnected &&
    appKitAddress &&
    guardRow?.previousAddress &&
    appKitAddress.toLowerCase() !== guardRow.previousAddress
  ) {
    clearWalletManualDisconnectGuard("live_appkit_new_account")
  }

  const guardStillActive = isWalletManualDisconnectGuardActive()
  const activeGuardRow = readWalletManualDisconnectGuard()

  if (
    settled &&
    guardStillActive &&
    appKitConnected &&
    activeGuardRow?.previousAddress &&
    appKitAddress?.toLowerCase() === activeGuardRow.previousAddress
  ) {
    traceWalletAccountIdentity("stale_account_restore_suppressed_by_disconnect_guard", {
      previousAddress: activeGuardRow.previousAddress,
      liveAppKitAddress: appKitAddress ?? null,
      appKitStatus: input.appKitStatus ?? null,
      manualDisconnectGuard: true,
      source: "resolve_effective_identity",
    })
    return {
      effectiveAddress: undefined,
      effectiveConnected: false,
      manualDisconnectGuard: true,
      suppressedByDisconnectGuard: true,
      hydrationSettled: settled,
    }
  }

  if (settled && appKitConnected && appKitAddress) {
    traceWalletAccountIdentity("appkit_account_source_of_truth_applied", {
      liveAppKitAddress: appKitAddress,
      appKitStatus: input.appKitStatus ?? null,
      manualDisconnectGuard: guardStillActive,
    })
  }

  if (!settled && appKitConnected) {
    traceWalletAccountIdentity("local_wallet_address_ignored_until_appkit_ready", {
      liveAppKitAddress: appKitAddress ?? null,
      appKitStatus: input.appKitStatus ?? null,
    })
    return {
      effectiveAddress: undefined,
      effectiveConnected: false,
      manualDisconnectGuard: guardStillActive,
      suppressedByDisconnectGuard: false,
      hydrationSettled: settled,
    }
  }

  return {
    effectiveAddress: guardStillActive ? undefined : appKitAddress,
    effectiveConnected: guardStillActive ? false : appKitConnected,
    manualDisconnectGuard: guardStillActive,
    suppressedByDisconnectGuard: false,
    hydrationSettled: settled,
  }
}

export async function performWalletManualDisconnect(input: Readonly<{
  previousAddress: string | null | undefined
  source: string
  hasActiveTx?: boolean
}>): Promise<void> {
  traceWalletAccountIdentity("wallet_manual_disconnect_requested", {
    previousAddress: input.previousAddress?.trim().toLowerCase() ?? null,
    source: input.source,
    hasActiveTx: Boolean(input.hasActiveTx),
  })

  setWalletManualDisconnectGuard({
    previousAddress: input.previousAddress?.trim().toLowerCase() ?? null,
    reason: input.source,
  })
  traceWalletAccountIdentity("wallet_manual_disconnect_guard_set", {
    previousAddress: input.previousAddress?.trim().toLowerCase() ?? null,
    source: input.source,
    manualDisconnectGuard: true,
  })

  traceWalletAccountIdentity("appkit_disconnect_called", { source: input.source })
  try {
    if (!isAppKitInitCompleted()) {
      await initializeAppKit()
    }
    const { getReownAppKitModal } = await import("@/reownKit")
    const appKit = getReownAppKitModal()
    await appKit.ready()
    await appKit.disconnect("eip155")
    try {
      const provider = await appKit.getUniversalProvider()
      await provider?.disconnect?.()
    } catch {
      /* best effort */
    }
    traceWalletAccountIdentity("appkit_disconnect_resolved", { source: input.source })
  } catch (err) {
    traceWalletAccountIdentity("appkit_disconnect_resolved", {
      source: input.source,
      failed: true,
      message: err instanceof Error ? err.message : String(err),
    })
  }
}

export function traceAccountChangedDetected(input: Readonly<{
  previousAddress: string | null
  liveAppKitAddress: string | null
  hasActiveTx: boolean
  source: string
}>): void {
  traceWalletAccountIdentity("account_changed_detected", {
    previousAddress: input.previousAddress,
    liveAppKitAddress: input.liveAppKitAddress,
    hasActiveTx: input.hasActiveTx,
    source: input.source,
  })
  if (input.hasActiveTx) {
    traceWalletAccountIdentity("active_tx_account_mismatch_detected", {
      previousAddress: input.previousAddress,
      liveAppKitAddress: input.liveAppKitAddress,
      source: input.source,
    })
    return
  }
  traceWalletAccountIdentity("account_switch_reset_address_bound_state", {
    previousAddress: input.previousAddress,
    liveAppKitAddress: input.liveAppKitAddress,
    source: input.source,
  })
}

export function wasRecentFreshConnectGesture(windowMs = 15_000): boolean {
  return freshConnectGestureAt > 0 && Date.now() - freshConnectGestureAt < windowMs
}
