/**
 * DEV-only structured tracing for staking mobile / tx / bootstrap lifecycles.
 * Kept separate from production console noise; grep `[staking-lifecycle]`.
 */
import { stakingDevConsoleDebug } from "@/staking/diagnostics/stakingDevConsole"

export type StakingCloseOrigin =
  | "radix_synthetic_suppressed"
  | "radix_after_explicit_intent"
  | "explicit_header"
  | "explicit_footer_cancel"
  | "explicit_footer_done_close"
  | "programmatic_epilogue"
  | "programmatic_reset_lifecycle"
  | "programmatic_wallet_identity"
  | "programmatic_persistence_clear"

export function stakingLifecycleTrace(
  channel:
    | "tx-dialog"
    | "bootstrap"
    | "wallet"
    | "persistence"
    | "resume"
    | "integrity",
  event: string,
  detail?: Record<string, unknown>
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  stakingDevConsoleDebug(`[staking-lifecycle][${channel}] ${event}`, {
    t: Date.now(),
    ...detail,
  })
}
