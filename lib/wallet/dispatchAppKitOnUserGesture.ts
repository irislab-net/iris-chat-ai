import { isMobileWalletUserAgent } from "@/lib/wallet/evmSignerHydration"

/**
 * iOS Safari / in-app browsers require wallet modal + deep-link dispatch on the
 * user-gesture stack. Desktop defers with a microtask to avoid Lit nested-update warnings.
 */
export function dispatchAppKitOnUserGesture(fn: () => void): void {
  if (isMobileWalletUserAgent()) {
    fn()
    return
  }
  queueMicrotask(fn)
}
