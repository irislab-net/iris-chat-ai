import { TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP } from "@/staking/tx/types/transactionStatusUiPhase"
import type { TransactionStatusUiPhase } from "@/staking/tx/types/transactionStatusUiPhase"

type TxModalActivityProbe = () => Readonly<{
  dialogOpen: boolean
  uiPhase: TransactionStatusUiPhase | null
}>

let probe: TxModalActivityProbe | null = null

/** Provider registers live modal activity — avoids WC storage inspection. */
export function registerStakingTxModalActivityProbe(fn: TxModalActivityProbe | null): void {
  probe = fn
}

/** True when the staking tx modal owns an active or detached-receipt flow. */
export function isStakingTxModalActivityActive(): boolean {
  const p = probe?.()
  if (!p) return false
  if (p.uiPhase === null) return false
  if (
    p.dialogOpen &&
    !TERMINAL_UI_PHASES_FOR_RUNTIME_SWAP.has(p.uiPhase)
  ) {
    return true
  }
  if (
    !p.dialogOpen &&
    (p.uiPhase === "submitted" || p.uiPhase === "confirming")
  ) {
    return true
  }
  return false
}
