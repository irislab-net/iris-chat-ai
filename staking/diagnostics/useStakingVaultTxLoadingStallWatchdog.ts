import { useEffect, useRef } from "react"
import { captureStakingVaultTxLoadingStall } from "@/lib/stakingSentry"
import {
  readStakingConnectStallEnvironment,
} from "@/staking/diagnostics/stakingConnectStallLogic"

export const STAKING_VAULT_TX_LOADING_STALL_THRESHOLD_MS = 12_000

export type StakingVaultTxLoadingStallWatchdogInput = Readonly<{
  loading: boolean
  awaitingSigner: boolean
  activeDeploymentId: string
  runtimeKey: string
  chainFamily: string
  canTransact: boolean
  vaultDataReady: boolean
  executionConnected: boolean
  hasSigner: boolean
  transitionLifecycle: string | null
  refreshPaused: boolean
}>

/**
 * Reports when `txState.loading` stays true (vault_tx_loading gate) beyond threshold.
 * Writers: `useStakingVaultTxExecution` (lease acquire/release; abandon on lifecycle reset).
 */
export function useStakingVaultTxLoadingStallWatchdog(
  input: StakingVaultTxLoadingStallWatchdogInput
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const armedAtRef = useRef<number | null>(null)
  const inputRef = useRef(input)
  inputRef.current = input

  const shouldArm =
    input.loading && !input.awaitingSigner && input.executionConnected

  useEffect(() => {
    const disarm = () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      armedAtRef.current = null
    }

    if (!shouldArm) {
      disarm()
      return disarm
    }

    if (timerRef.current != null) return disarm

    armedAtRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      const cur = inputRef.current
      if (!cur.loading || cur.awaitingSigner) return

      const env = readStakingConnectStallEnvironment()
      const started = armedAtRef.current ?? Date.now()
      const dedupeKey = `vault_tx_loading:${cur.activeDeploymentId}:${cur.runtimeKey}`

      captureStakingVaultTxLoadingStall(
        {
          durationMs: Date.now() - started,
          activeDeploymentId: cur.activeDeploymentId,
          runtimeKey: cur.runtimeKey,
          chainFamily: cur.chainFamily,
          awaitingSigner: cur.awaitingSigner,
          canTransact: cur.canTransact,
          vaultDataReady: cur.vaultDataReady,
          executionConnected: cur.executionConnected,
          hasSigner: cur.hasSigner,
          transitionLifecycle: cur.transitionLifecycle,
          refreshPaused: cur.refreshPaused,
          visibilityState: env.visibilityState,
          isMobileUa: env.isMobileUa,
        },
        dedupeKey
      )
    }, STAKING_VAULT_TX_LOADING_STALL_THRESHOLD_MS)

    return disarm
  }, [shouldArm, input.loading, input.awaitingSigner, input.executionConnected])
}
