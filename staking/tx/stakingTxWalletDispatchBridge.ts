/**
 * Signals that vault execution reached `wallet_sendTransaction_start`.
 * Used to align mobile signature stall timers with actual WC dispatch, not gas prepare.
 */
import { isMobileStakingLanLogEnabled } from "@/config/mobileStakingLogEnv"
import { markMobileStakingWalletHandoffStarted } from "@/staking/diagnostics/mobileStakingLanLog"

type WalletDispatchListener = () => void

const listeners = new Set<WalletDispatchListener>()
let walletDispatchInFlight = false

export function isStakingTxWalletDispatchInFlight(): boolean {
  return walletDispatchInFlight
}

export function registerStakingTxWalletDispatchListener(
  fn: WalletDispatchListener | null,
): () => void {
  if (fn == null) return () => {}
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function notifyStakingTxWalletDispatchStarted(op = "unknown"): void {
  walletDispatchInFlight = true
  if (isMobileStakingLanLogEnabled()) {
    markMobileStakingWalletHandoffStarted(op)
  }
  for (const fn of listeners) {
    try {
      fn()
    } catch {
      /* listener must not break dispatch */
    }
  }
}

export function notifyStakingTxWalletDispatchEnded(): void {
  walletDispatchInFlight = false
}
