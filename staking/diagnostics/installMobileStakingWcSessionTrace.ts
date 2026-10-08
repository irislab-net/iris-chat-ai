import { isMobileStakingLanLogEnabled } from "@/config/mobileStakingLogEnv"
import { observeAppKitSessionSnapshot } from "@/lib/wallet/appKitSessionHydrationObserve"
import { traceWalletAccountIdentity } from "@/lib/wallet/walletAccountIdentityTelemetry"
import {
  traceMobileStakingFlow,
  updateMobileStakingLanContext,
} from "@/staking/diagnostics/mobileStakingLanLog"

type WcProviderLike = {
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  off?: (event: string, listener: (...args: unknown[]) => void) => void
  session?: { topic?: string; expiry?: number; acknowledged?: boolean }
}

let uninstall: (() => void) | null = null

async function readWcSessionFields(): Promise<void> {
  const snap = await observeAppKitSessionSnapshot()
  updateMobileStakingLanContext({
    appKitAccountStatus:
      typeof snap.eip155_status === "string" ? snap.eip155_status : null,
    wcSessionTopic: snap.session_topic_present ? "present" : null,
    wcPairingStatus: null,
    wcSessionStatus:
      snap.eip155_connected === true
        ? "connected"
        : snap.eip155_connected === false
          ? "disconnected"
          : null,
  })
  traceMobileStakingFlow("walletconnect_session_snapshot", snap)
  traceMobileStakingFlow("appkit_account_snapshot", snap)
}

function attachProviderListeners(provider: WcProviderLike): () => void {
  const onSessionDelete = (...args: unknown[]) => {
    traceMobileStakingFlow("walletconnect_session_delete_detected", {
      argsSummary: args.length,
    })
    traceWalletAccountIdentity("walletconnect_session_delete_received", {
      argsSummary: args.length,
    })
    void readWcSessionFields()
  }
  const onSessionUpdate = (...args: unknown[]) => {
    traceWalletAccountIdentity("walletconnect_session_update_received", {
      argsSummary: args.length,
    })
    void readWcSessionFields()
  }
  const onSessionEvent = (...args: unknown[]) => {
    traceWalletAccountIdentity("walletconnect_session_event_accounts_changed", {
      argsSummary: args.length,
    })
    void readWcSessionFields()
  }
  const onSessionExpire = (...args: unknown[]) => {
    traceMobileStakingFlow("walletconnect_session_expire_detected", {
      argsSummary: args.length,
    })
    void readWcSessionFields()
  }
  const onRequestExpire = (...args: unknown[]) => {
    traceMobileStakingFlow("walletconnect_request_expire_detected", {
      argsSummary: args.length,
    })
  }

  provider.on?.("session_delete", onSessionDelete)
  provider.on?.("session_expire", onSessionExpire)
  provider.on?.("session_update", onSessionUpdate)
  provider.on?.("session_event", onSessionEvent)
  provider.on?.("expire", onRequestExpire)

  return () => {
    provider.off?.("session_delete", onSessionDelete)
    provider.off?.("session_expire", onSessionExpire)
    provider.off?.("session_update", onSessionUpdate)
    provider.off?.("session_event", onSessionEvent)
    provider.off?.("expire", onRequestExpire)
  }
}

/** Read-only WC/AppKit observers for mobile LAN traces. Never mutates sessions. */
export function installMobileStakingWcSessionTrace(): () => void {
  if (!isMobileStakingLanLogEnabled()) return () => {}
  if (uninstall) return uninstall

  let providerDetach: (() => void) | null = null

  void (async () => {
    try {
      const { initializeAppKit, isAppKitInitCompleted } = await import(
        "@/lib/appKitBootstrap"
      )
      if (!isAppKitInitCompleted()) {
        await initializeAppKit()
      }
      const { getReownAppKitModal } = await import("@/reownKit")
      const appKit = getReownAppKitModal()
      if (!appKit) return
      await appKit.ready()
      const provider = (await appKit.getUniversalProvider()) as WcProviderLike | null
      if (provider) {
        const topic = provider.session?.topic?.trim()
        if (topic) {
          updateMobileStakingLanContext({ wcSessionTopic: topic.slice(0, 24) })
        }
        providerDetach = attachProviderListeners(provider)
      }
      await readWcSessionFields()
    } catch {
      /* AppKit not ready */
    }
  })()

  const onVis = () => {
    if (document.visibilityState === "visible") {
      void readWcSessionFields()
    }
  }
  document.addEventListener("visibilitychange", onVis)

  uninstall = () => {
    document.removeEventListener("visibilitychange", onVis)
    providerDetach?.()
    providerDetach = null
    uninstall = null
  }
  return uninstall
}
