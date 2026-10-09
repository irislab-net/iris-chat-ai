import type { BalanceSnapshot } from "@/staking/reads/types"
import { STAKING_VAULT_EMPTY_BALANCE_SNAPSHOT } from "@/staking/vault/composer/stakingVaultComposerContracts"
import { useRef } from "react"

export type StakingVaultComposerLifecycleRefs = Readonly<{
  isMountedRef: React.MutableRefObject<boolean>
}>

export type StakingVaultComposerRefreshRefs = Readonly<{
  observedBalanceRef: React.MutableRefObject<{ balance: bigint; anchorMs: number } | null>
  balanceSnapshotRef: React.MutableRefObject<BalanceSnapshot>
  lastDisplayBalancesRef: React.MutableRefObject<BalanceSnapshot>
  tronPassiveReadFailStreakRef: React.MutableRefObject<number>
  tronPassiveRefetchRef: React.MutableRefObject<(() => void) | null>
  tronPassiveFetchGenRef: React.MutableRefObject<number>
}>

export type StakingVaultComposerHistoryGlueRefs = Readonly<{
  clearStakingHistoryOnWrongNetworkRef: React.MutableRefObject<(() => void) | null>
}>

export type StakingVaultComposerRefs = Readonly<{
  lifecycle: StakingVaultComposerLifecycleRefs
  refresh: StakingVaultComposerRefreshRefs
  historyGlue: StakingVaultComposerHistoryGlueRefs
}>

export function useStakingVaultComposerRefs(): StakingVaultComposerRefs {
  const isMountedRef = useRef(true)

  const observedBalanceRef = useRef<{ balance: bigint; anchorMs: number } | null>(null)
  const balanceSnapshotRef = useRef({ ...STAKING_VAULT_EMPTY_BALANCE_SNAPSHOT })
  const lastDisplayBalancesRef = useRef({ ...STAKING_VAULT_EMPTY_BALANCE_SNAPSHOT })

  const clearStakingHistoryOnWrongNetworkRef = useRef<(() => void) | null>(null)
  const tronPassiveReadFailStreakRef = useRef(0)
  const tronPassiveRefetchRef = useRef<(() => void) | null>(null)
  const tronPassiveFetchGenRef = useRef(0)

  return {
    lifecycle: { isMountedRef },
    refresh: {
      observedBalanceRef,
      balanceSnapshotRef,
      lastDisplayBalancesRef,
      tronPassiveReadFailStreakRef,
      tronPassiveRefetchRef,
      tronPassiveFetchGenRef,
    },
    historyGlue: { clearStakingHistoryOnWrongNetworkRef },
  }
}
