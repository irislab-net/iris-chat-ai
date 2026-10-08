import type { StakingVaultPresentationPlane } from "@/staking/vault/composer/useStakingVaultPresentationPlane"
import type { StakingVaultHistoryPlane } from "@/staking/vault/composer/useStakingVaultHistoryPlane"
import type { StakingVaultRefreshPlane } from "@/staking/vault/composer/useStakingVaultRefreshPlane"
import type { StakingVaultComposerBalanceState } from "@/staking/vault/composer/useStakingVaultComposerBalanceState"
import type { StakingVaultComposerTxState } from "@/staking/vault/composer/useStakingVaultComposerTxState"
import type { StakingVaultTokenReads } from "@/staking/reads/useStakingVaultTokenReads"
import type { StakingVaultTxExecution } from "@/staking/tx/execution/stakingTxExecutionTypes"
import type { useStakingVaultRuntimePlanes } from "@/staking/runtime/useStakingVaultRuntimePlanes"
import type { useAffiliateFirestoreStats } from "@/hooks/useAffiliateFirestoreStats"
import { assertStakingVaultPublicTopology } from "@/staking/vault/composer/stakingVaultPublicTopology"

export type AssembleStakingVaultPublicValueInput = Readonly<{
  planes: ReturnType<typeof useStakingVaultRuntimePlanes>
  isWrongNetwork: boolean
  canTransact: boolean
  txExecutionReady: boolean
  awaitingSigner: boolean
  vaultDataReady: boolean
  stakingPnlBasisReady: boolean
  affiliate: ReturnType<typeof useAffiliateFirestoreStats>
  stakingNetPrincipalWei: bigint | null
  tokenReads: StakingVaultTokenReads
  balance: StakingVaultComposerBalanceState
  txState: StakingVaultComposerTxState
  refreshPlane: StakingVaultRefreshPlane
  historyPlane: StakingVaultHistoryPlane
  presentation: StakingVaultPresentationPlane
  txExecution: Pick<StakingVaultTxExecution, "deposit" | "withdraw" | "approveStakeAmount">
  openWallet: () => void
}>

/** Pure public DTO assembly — shape must match `StakingVaultValue` / `useStakingVaultState` return. */
export function assembleStakingVaultPublicValue(input: AssembleStakingVaultPublicValueInput) {
  const {
    planes,
    isWrongNetwork,
    canTransact,
    txExecutionReady,
    awaitingSigner,
    vaultDataReady,
    stakingPnlBasisReady,
    affiliate,
    stakingNetPrincipalWei,
    tokenReads,
    balance,
    txState,
    refreshPlane,
    historyPlane,
    presentation,
    txExecution,
    openWallet,
  } = input

  const {
    appKitTronIdentityEnabled,
    executionAddress,
    executionConnected,
    executionChainId,
    executionNetworkOk,
    passiveTronChainId,
    runtimeWallet,
    hasTronAccount,
    runtimeWalletAddress,
    runtimeWalletConnected,
    runtimeWalletShortAddress,
    stakingOwnerAddress,
    stakingExplorerUrl,
  } = planes

  const {
    tokenSymbol,
    tokenName,
    tokenAddress,
    tokenDecimals,
    tokenMetaError,
    tokenMetaFetched,
  } = tokenReads

  const {
    walletBalance,
    stakedAssets,
    vaultShares,
    allowance,
    minWithdrawalFeeWei,
  } = balance

  const { loading, isAttemptingNetworkSwitch } = txState
  const { refreshBalances, requestNetworkSwitch } = refreshPlane
  const {
    stakingHistoryRows,
    stakingHistoryLoading,
    stakingHistoryFetched,
    stakingHistoryIndexerError,
    stakingHistoryIndexerPartialWarning,
    stakingPnlHistoryIncomplete,
    stakingPnlHistoryReady,
    stakingHistoryTotals,
    refreshStakingHistory,
    merchantTokenSymbol,
    merchantTokenName,
  } = historyPlane

  const {
    formattedWalletBalance,
    formattedStakedAssets,
    maxStakeWei,
    maxUnstakeWei,
    formattedMinWithdrawalFee,
    stakingPnlWei,
    stakingBalanceAnchorMs,
  } = presentation

  const { deposit, withdraw, approveStakeAmount } = txExecution

  const publicValue = {
    openWallet,
    executionAddress: executionAddress ?? null,
    executionConnected,
    executionChainId,
    executionNetworkOk,
    stakingOwnerAddress,
    runtimeWallet,
    runtimeWalletAddress,
    runtimeWalletConnected,
    runtimeWalletShortAddress,
    passiveTronChainId:
      appKitTronIdentityEnabled && runtimeWallet.tronChainId != null
        ? runtimeWallet.tronChainId
        : passiveTronChainId,
    passiveTronNetworkOk: runtimeWallet.networkOk,
    hasTronAccount,
    isWrongNetwork,
    canTransact,
    txExecutionReady,
    awaitingSigner,
    vaultDataReady,
    loading,
    tokenSymbol,
    tokenName,
    merchantTokenSymbol,
    merchantTokenName,
    tokenAddress,
    tokenDecimals,
    tokenMetaError,
    /** `false` until first `loadMeta` attempt finishes (success or RPC error). */
    tokenMetaFetched,
    walletBalance,
    stakedAssets,
    stakingPnlWei,
    stakingNetPrincipalWei,
    stakingTotalDepositsWei: stakingHistoryTotals.totalDepositsWei,
    stakingTotalWithdrawalsWei: stakingHistoryTotals.totalWithdrawalsWei,
    stakingBalanceAnchorMs,
    stakingHistoryRows,
    stakingHistoryLoading,
    stakingHistoryFetched,
    stakingHistoryIndexerError,
    stakingHistoryIndexerPartialWarning,
    stakingPnlHistoryIncomplete,
    stakingPnlHistoryReady,
    stakingPnlBasisReady,
    affiliateStats: affiliate.stats,
    affiliateStatsLoading: affiliate.loading,
    affiliateStatsError: affiliate.error,
    affiliateFirebaseConfigured: affiliate.configured,
    vaultShares,
    allowance,
    formattedWalletBalance,
    formattedStakedAssets,
    maxStakeWei,
    maxUnstakeWei,
    minWithdrawalFeeWei,
    formattedMinWithdrawalFee,
    refreshBalances,
    refreshStakingHistory,
    approveStakeAmount,
    deposit,
    withdraw,
    isAttemptingNetworkSwitch,
    requestNetworkSwitch,
    stakingExplorerUrl,
  }

  assertStakingVaultPublicTopology(publicValue as Record<string, unknown>)
  return publicValue
}
