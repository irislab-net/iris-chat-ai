import { inferStakingWalletVendor } from "@/staking/diagnostics/stakingConnectStallLogic"
import { getLastStakingVaultTxExecutionAbandonReason } from "@/staking/tx/execution/stakingVaultTxExecutionOwnership"
import { snapshotLooksIdle } from "@/staking/tx"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { deriveCurrentTxHashFromSnapshot } from "@/staking/tx"
import { logger } from "@/lib/logger"
import { useEffect, useRef } from "react"

const DESYNC_GRACE_MS = 500

export type StakingVaultTxLoadingDesyncInvariantInput = Readonly<{
  vaultLoading: boolean
  snapshot: TransactionStatusSnapshot
  executionConnected: boolean
  /** Optional — e.g. form submission generation */
  submissionId?: number | null
}>

/**
 * DEV-only: `vault.loading` must not survive an idle tx modal snapshot.
 */
export function useStakingVaultTxLoadingDesyncInvariantDev(
  input: StakingVaultTxLoadingDesyncInvariantInput
): void {
  const inputRef = useRef(input)
  inputRef.current = input
  const reportedRef = useRef(false)

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return

    const disarm = () => {
      reportedRef.current = false
    }

    const cur = inputRef.current
    if (!cur.vaultLoading || !snapshotLooksIdle(cur.snapshot)) {
      disarm()
      return disarm
    }

    const timer = window.setTimeout(() => {
      const latest = inputRef.current
      if (!latest.vaultLoading || !snapshotLooksIdle(latest.snapshot)) {
        disarm()
        return
      }
      if (reportedRef.current) return
      reportedRef.current = true

      const snap = latest.snapshot
      const txHash = deriveCurrentTxHashFromSnapshot(snap)
      const visibilityState =
        typeof document !== "undefined" ? document.visibilityState : "unknown"

      logger.warn("[READINESS_DESYNC:vault_loading_idle_modal]", {
        scenario: snap.scenario,
        txHash: txHash || null,
        submissionId: latest.submissionId ?? null,
        uiPhase: snap.uiPhase,
        dialogOpen: snap.dialogOpen,
        executionConnected: latest.executionConnected,
        visibilityState,
        walletVendor: inferStakingWalletVendor(),
        resetReason: getLastStakingVaultTxExecutionAbandonReason(),
        preparingTransaction: snap.preparingTransaction,
        depositWirePhase: snap.depositWirePhase,
        withdrawWirePhase: snap.withdrawWirePhase,
        approveWirePhase: snap.approveWirePhase,
      })
    }, DESYNC_GRACE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    input.vaultLoading,
    input.snapshot.dialogOpen,
    input.snapshot.uiPhase,
    input.snapshot.scenario,
    input.executionConnected,
    input.submissionId,
  ])
}
