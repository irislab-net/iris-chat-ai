import type { TransactionStatusUiPhase } from "@/staking/tx/types/transactionStatusUiPhase"

const PRE_BROADCAST_UI_PHASES: ReadonlySet<TransactionStatusUiPhase> = new Set([
  "preview",
  "pending",
  "awaiting_signature",
])

/** Phases that should not be resurrected from sessionStorage over an active tab session. */
export function isPreBroadcastTxUiPhase(
  phase: TransactionStatusUiPhase | null
): boolean {
  return phase !== null && PRE_BROADCAST_UI_PHASES.has(phase)
}
