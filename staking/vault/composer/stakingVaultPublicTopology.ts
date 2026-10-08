/**
 * Frozen public return keys for `useStakingVaultState`.
 * Update only with intentional API/version bumps and topology audit.
 */
export const STAKING_VAULT_PUBLIC_TOPOLOGY_KEYS = [
  "openWallet",
  "executionAddress",
  "executionConnected",
  "executionChainId",
  "executionNetworkOk",
  "stakingOwnerAddress",
  "runtimeWallet",
  "runtimeWalletAddress",
  "runtimeWalletConnected",
  "runtimeWalletShortAddress",
  "passiveTronChainId",
  "passiveTronNetworkOk",
  "hasTronAccount",
  "isWrongNetwork",
  "canTransact",
  "txExecutionReady",
  "awaitingSigner",
  "vaultDataReady",
  "loading",
  "tokenSymbol",
  "tokenName",
  "merchantTokenSymbol",
  "merchantTokenName",
  "tokenAddress",
  "tokenDecimals",
  "tokenMetaError",
  "tokenMetaFetched",
  "walletBalance",
  "stakedAssets",
  "stakingPnlWei",
  "stakingNetPrincipalWei",
  "stakingTotalDepositsWei",
  "stakingTotalWithdrawalsWei",
  "stakingBalanceAnchorMs",
  "stakingHistoryRows",
  "stakingHistoryLoading",
  "stakingHistoryFetched",
  "stakingHistoryIndexerError",
  "stakingHistoryIndexerPartialWarning",
  "stakingPnlHistoryIncomplete",
  "stakingPnlHistoryReady",
  "stakingPnlBasisReady",
  "affiliateStats",
  "affiliateStatsLoading",
  "affiliateStatsError",
  "affiliateFirebaseConfigured",
  "vaultShares",
  "allowance",
  "formattedWalletBalance",
  "formattedStakedAssets",
  "maxStakeWei",
  "maxUnstakeWei",
  "minWithdrawalFeeWei",
  "formattedMinWithdrawalFee",
  "refreshBalances",
  "refreshStakingHistory",
  "approveStakeAmount",
  "deposit",
  "withdraw",
  "isAttemptingNetworkSwitch",
  "requestNetworkSwitch",
  "stakingExplorerUrl",
] as const

/** Removed in G4c — must not reappear on public vault assembly. */
export const STAKING_VAULT_DEPRECATED_BRIDGE_KEYS = [
  "isConnected",
  "address",
  "chainId",
  "activeRuntimeSelection",
] as const

export type StakingVaultPublicTopologyKey =
  (typeof STAKING_VAULT_PUBLIC_TOPOLOGY_KEYS)[number]

import { devAssertPublicAssemblyNoInternalLeakage } from "@/staking/diagnostics/stakingInvariantAssertionsDev"

/** DEV-only: assert assembled public object still exposes frozen topology keys. */
export function assertStakingVaultPublicTopology(
  value: Record<string, unknown>
): void {
  if (!(process.env.NODE_ENV !== 'production')) return
  devAssertPublicAssemblyNoInternalLeakage(value)
  for (const key of STAKING_VAULT_PUBLIC_TOPOLOGY_KEYS) {
    if (!(key in value)) {
      console.error(`[staking-vault-public-topology] missing key: ${key}`)
    }
  }
}
