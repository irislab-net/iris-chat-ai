// Phase D2b extracted affiliate/pnl derivations

import {
  affiliateBaseBalanceToVaultTokenWei,
  type AffiliateFirestoreStats,
} from "@/lib/affiliateFirestoreStats"

export { affiliateBaseBalanceToVaultTokenWei }

/** Vault-facing Firestore affiliate row slice (subscription stays in `useStakingVault`). */
export type StakingAffiliatePrincipalInput = Readonly<{
  walletIdentityConnected: boolean
  isWrongNetwork: boolean
  tokenDecimals: number | null
  affiliateStatsError: string | null | undefined
  affiliateStatsLoading: boolean
  affiliateStats: Pick<AffiliateFirestoreStats, "baseBalanceSource"> | null
}>

export type StakingAffiliatePrincipalSnapshot = Readonly<{
  stakingNetPrincipalWei: bigint | null
}>

export function buildStakingAffiliatePrincipalInput(input: {
  walletIdentityConnected: boolean
  isWrongNetwork: boolean
  tokenDecimals: number | null
  affiliateStatsError: string | null | undefined
  affiliateStatsLoading: boolean
  affiliateStats: AffiliateFirestoreStats | null
}): StakingAffiliatePrincipalInput {
  return {
    walletIdentityConnected: input.walletIdentityConnected,
    isWrongNetwork: input.isWrongNetwork,
    tokenDecimals: input.tokenDecimals,
    affiliateStatsError: input.affiliateStatsError,
    affiliateStatsLoading: input.affiliateStatsLoading,
    affiliateStats: input.affiliateStats,
  }
}

/**
 * Cost basis in vault token smallest units from Firestore `base_balance` (affiliate 6 dp → `tokenDecimals`).
 * Returns null when wallet/network/decimals/loading/error/stats preconditions fail.
 */
export function selectStakingNetPrincipalWei(
  input: StakingAffiliatePrincipalInput
): bigint | null {
  if (!input.walletIdentityConnected || input.isWrongNetwork || input.tokenDecimals === null) {
    return null
  }
  const affErr = (input.affiliateStatsError ?? "").trim()
  if (affErr) return null
  if (input.affiliateStatsLoading) return null
  if (input.affiliateStats === null) return null
  return affiliateBaseBalanceToVaultTokenWei(
    input.affiliateStats.baseBalanceSource,
    input.tokenDecimals
  )
}

export function selectStakingAffiliatePrincipalSnapshot(
  input: StakingAffiliatePrincipalInput
): StakingAffiliatePrincipalSnapshot {
  return { stakingNetPrincipalWei: selectStakingNetPrincipalWei(input) }
}
