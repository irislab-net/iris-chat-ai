import { initializeAppKit } from "@/lib/appKitBootstrap"
import { isMobileWalletUserAgent } from "@/lib/wallet/evmSignerHydration"
import { traceMobileStakingFlow } from "@/staking/diagnostics/mobileStakingLanLog"
import type { AppKit } from "@reown/appkit/react"

export type StakingTxWalletHandoffOutcome =
  | Readonly<{ kind: "external_attempted" }>
  | Readonly<{ kind: "manual_hint_required"; reason: string }>

const ACCOUNT_MODAL_GUARD_MS = 2_500

function isAppKitShellVisible(): boolean {
  if (typeof document === "undefined") return false
  return Boolean(
    document.querySelector("w3m-modal, appkit-modal, w3m-modal-backdrop")
  )
}

/** Close AppKit account/connect shell if it opened — never treat as wallet handoff. */
function scheduleAppKitAccountModalGuard(appKit: AppKit, source: string): void {
  const started = Date.now()
  const tick = (): void => {
    if (Date.now() - started > ACCOUNT_MODAL_GUARD_MS) return
    if (isAppKitShellVisible()) {
      traceMobileStakingFlow("wallet_handoff_account_modal_opened_wrongly", {
        source,
      })
      void appKit.close().catch(() => {})
      return
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

/**
 * Recovered pre-hash wallet-wait handoff.
 * Does NOT call `appKit.open()` when connected — that opens the Account modal
 * (Activity / Disconnect), not Trust Wallet deep-link handoff.
 * Real WC signing handoff only occurs when `sendTransaction` is dispatched.
 */
export async function attemptStakingTxWalletHandoff(
  source: string
): Promise<StakingTxWalletHandoffOutcome> {
  if (!isMobileWalletUserAgent()) {
    return { kind: "manual_hint_required", reason: "not_mobile" }
  }

  try {
    await initializeAppKit()
    const { getReownAppKitModal } = await import("@/reownKit")
    const appKit = getReownAppKitModal()
    await appKit.ready()

    const account = appKit.getAccount("eip155")
    const connected =
      account?.status === "connected" ||
      (account as { isConnected?: boolean } | undefined)?.isConnected === true

    scheduleAppKitAccountModalGuard(appKit, source)

    if (connected) {
      traceMobileStakingFlow(
        "wallet_handoff_not_available_connected_account_modal_suppressed",
        { source, reason: "connected_no_verified_external_handoff" }
      )
      return {
        kind: "manual_hint_required",
        reason: "connected_no_verified_external_handoff",
      }
    }

    traceMobileStakingFlow(
      "wallet_handoff_not_available_connected_account_modal_suppressed",
      { source, reason: "not_connected" }
    )
    return { kind: "manual_hint_required", reason: "not_connected" }
  } catch {
    traceMobileStakingFlow(
      "wallet_handoff_not_available_connected_account_modal_suppressed",
      { source, reason: "appkit_unavailable" }
    )
    return { kind: "manual_hint_required", reason: "appkit_unavailable" }
  }
}

/** @deprecated Use `attemptStakingTxWalletHandoff` — never opens AppKit account modal. */
export function openStakingTxWalletHandoff(_source: string): void {
  void attemptStakingTxWalletHandoff(_source)
}
