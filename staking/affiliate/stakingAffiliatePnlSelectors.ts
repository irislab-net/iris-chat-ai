// Phase D2b extracted affiliate/pnl derivations

import type { StakingAffiliatePrincipalInput } from "@/staking/affiliate/stakingAffiliatePrincipal"
import { selectStakingNetPrincipalWei } from "@/staking/affiliate/stakingAffiliatePrincipal"

export type SelectStakingPnlWeiInput = Readonly<{
  stakedAssets: bigint
  stakingNetPrincipalWei: bigint | null
}>

export function selectStakingPnlWei(input: SelectStakingPnlWeiInput): bigint | null {
  if (input.stakingNetPrincipalWei === null) return null
  return input.stakedAssets - input.stakingNetPrincipalWei
}

export type SelectStakingPnlBasisReadyInput = Readonly<{
  walletIdentityConnected: boolean
  isWrongNetwork: boolean
  tokenDecimals: number | null
  affiliateStatsError: string | null | undefined
  affiliateStatsLoading: boolean
  affiliateStats: unknown | null
  stakingNetPrincipalWei: bigint | null
}>

export function selectStakingPnlBasisReady(input: SelectStakingPnlBasisReadyInput): boolean {
  return Boolean(
    input.walletIdentityConnected &&
      !input.isWrongNetwork &&
      input.tokenDecimals !== null &&
      !(input.affiliateStatsError ?? "").trim() &&
      !input.affiliateStatsLoading &&
      input.affiliateStats !== null &&
      input.stakingNetPrincipalWei !== null
  )
}

export type SelectStakingAffiliatePnlSnapshotInput = StakingAffiliatePrincipalInput &
  Readonly<{
    stakedAssets: bigint
  }>

export type StakingAffiliatePnlSnapshot = Readonly<{
  stakingNetPrincipalWei: bigint | null
  stakingPnlWei: bigint | null
  stakingPnlBasisReady: boolean
}>

/** Readonly composition of principal + PnL wei + basis-ready (pure; vault keeps separate memos). */
export function selectStakingAffiliatePnlSnapshot(
  input: SelectStakingAffiliatePnlSnapshotInput
): StakingAffiliatePnlSnapshot {
  const stakingNetPrincipalWei = selectStakingNetPrincipalWei(input)
  const stakingPnlWei = selectStakingPnlWei({
    stakedAssets: input.stakedAssets,
    stakingNetPrincipalWei,
  })
  const stakingPnlBasisReady = selectStakingPnlBasisReady({
    walletIdentityConnected: input.walletIdentityConnected,
    isWrongNetwork: input.isWrongNetwork,
    tokenDecimals: input.tokenDecimals,
    affiliateStatsError: input.affiliateStatsError,
    affiliateStatsLoading: input.affiliateStatsLoading,
    affiliateStats: input.affiliateStats,
    stakingNetPrincipalWei,
  })
  return { stakingNetPrincipalWei, stakingPnlWei, stakingPnlBasisReady }
}
