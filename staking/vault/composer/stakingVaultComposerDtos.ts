import type { StakingVaultBalanceRefBag, StakingVaultBalanceRefreshSetters } from "@/staking/refresh/types"
import type { StakingVaultComposerRefreshRefs } from "@/staking/vault/composer/useStakingVaultComposerRefs"
import type { StakingVaultComposerBalanceState } from "@/staking/vault/composer/useStakingVaultComposerBalanceState"
import type { StakingVaultTokenReads } from "@/staking/reads/useStakingVaultTokenReads"

export function buildStakingVaultBalanceRefBag(
  refreshRefs: StakingVaultComposerRefreshRefs
): Readonly<StakingVaultBalanceRefBag> {
  const {
    balanceSnapshotRef,
    lastDisplayBalancesRef,
    observedBalanceRef,
    tronPassiveRefetchRef,
    tronPassiveFetchGenRef,
    tronPassiveReadFailStreakRef,
  } = refreshRefs
  return {
    balanceSnapshotRef,
    lastDisplayBalancesRef,
    observedBalanceRef,
    tronPassiveRefetchRef,
    tronPassiveFetchGenRef,
    tronPassiveReadFailStreakRef,
  }
}

export function buildStakingVaultBalanceRefreshSetters(
  balance: StakingVaultComposerBalanceState,
  tokenReads: Pick<
    StakingVaultTokenReads,
    "setTokenMetaFetched" | "setTokenDecimals" | "setTokenMetaError"
  >
): Readonly<StakingVaultBalanceRefreshSetters> {
  return {
    setWalletBalance: balance.setWalletBalance,
    setAllowance: balance.setAllowance,
    setVaultShares: balance.setVaultShares,
    setStakedAssets: balance.setStakedAssets,
    setVaultMaxDepositWei: balance.setVaultMaxDepositWei,
    setVaultMaxWithdrawWei: balance.setVaultMaxWithdrawWei,
    setMinWithdrawalFeeWei: balance.setMinWithdrawalFeeWei,
    setBalancesFetched: balance.setBalancesFetched,
    setObservedBalanceAnchorMs: balance.setObservedBalanceAnchorMs,
    setTokenMetaFetched: tokenReads.setTokenMetaFetched,
    setTokenDecimals: tokenReads.setTokenDecimals,
    setTokenMetaError: tokenReads.setTokenMetaError,
  }
}

export function buildStakingVaultBalanceResetSetters(
  balance: Pick<StakingVaultComposerBalanceState, "setBalancesFetched">,
  tokenReads: Pick<
    StakingVaultTokenReads,
    "setTokenMetaFetched" | "setTokenDecimals" | "setTokenMetaError"
  >
): Pick<
  StakingVaultBalanceRefreshSetters,
  "setTokenMetaFetched" | "setBalancesFetched" | "setTokenDecimals" | "setTokenMetaError"
> {
  return {
    setTokenMetaFetched: tokenReads.setTokenMetaFetched,
    setBalancesFetched: balance.setBalancesFetched,
    setTokenDecimals: tokenReads.setTokenDecimals,
    setTokenMetaError: tokenReads.setTokenMetaError,
  }
}
