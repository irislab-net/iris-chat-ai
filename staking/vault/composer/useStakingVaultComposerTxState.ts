import {
  createStakingVaultTxExecutionOwnership,
  publishStakingVaultTxExecutionAbandonReason,
  type StakingVaultTxExecutionLease,
  type StakingVaultTxExecutionOp,
} from "@/staking/tx/execution/stakingVaultTxExecutionOwnership"
import { useCallback, useRef, useState } from "react"

export type StakingVaultComposerTxState = Readonly<{
  loading: boolean
  acquireVaultTxExecutionLoading: (
    op: StakingVaultTxExecutionOp
  ) => StakingVaultTxExecutionLease
  releaseVaultTxExecutionLoading: (lease: StakingVaultTxExecutionLease) => void
  abandonVaultTxExecutionLoading: (reason: string) => void
  /** Clears UI loading when ownership has no active lease (stale release / resume desync). */
  reconcileVaultTxExecutionLoading: () => void
  refreshKey: number
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>
  isAttemptingNetworkSwitch: boolean
  setIsAttemptingNetworkSwitch: React.Dispatch<React.SetStateAction<boolean>>
  hasTriedSwitch: boolean
  setHasTriedSwitch: React.Dispatch<React.SetStateAction<boolean>>
}>

export function useStakingVaultComposerTxState(): StakingVaultComposerTxState {
  const ownershipRef = useRef(createStakingVaultTxExecutionOwnership())
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isAttemptingNetworkSwitch, setIsAttemptingNetworkSwitch] = useState(false)
  const [hasTriedSwitch, setHasTriedSwitch] = useState(false)

  const acquireVaultTxExecutionLoading = useCallback(
    (op: StakingVaultTxExecutionOp): StakingVaultTxExecutionLease => {
      const lease = ownershipRef.current.acquire(op)
      setLoading(true)
      return lease
    },
    []
  )

  const releaseVaultTxExecutionLoading = useCallback(
    (lease: StakingVaultTxExecutionLease) => {
      const released = ownershipRef.current.release(lease)
      if (released || !ownershipRef.current.isActive()) {
        setLoading(false)
      }
    },
    []
  )

  const abandonVaultTxExecutionLoading = useCallback((reason: string) => {
    ownershipRef.current.abandon(reason)
    publishStakingVaultTxExecutionAbandonReason(reason)
    setLoading(false)
  }, [])

  const reconcileVaultTxExecutionLoading = useCallback(() => {
    if (loading && !ownershipRef.current.isActive()) {
      setLoading(false)
    }
  }, [loading])

  return {
    loading,
    acquireVaultTxExecutionLoading,
    releaseVaultTxExecutionLoading,
    abandonVaultTxExecutionLoading,
    reconcileVaultTxExecutionLoading,
    refreshKey,
    setRefreshKey,
    isAttemptingNetworkSwitch,
    setIsAttemptingNetworkSwitch,
    hasTriedSwitch,
    setHasTriedSwitch,
  }
}
