import {
  selectFormattedTokenUnits,
  selectStakingBalanceAnchorMs,
  selectStakingPnlWei,
  selectVaultBalanceCaps,
} from "@/staking/selectors"
import type { StakingVaultHistoryPlane } from "@/staking/vault/composer/useStakingVaultHistoryPlane"
import type { StakingVaultComposerBalanceState } from "@/staking/vault/composer/useStakingVaultComposerBalanceState"
import type { StakingVaultTokenReads } from "@/staking/reads/useStakingVaultTokenReads"
import { useMemo } from "react"

export type UseStakingVaultPresentationPlaneInput = Readonly<{
  balance: StakingVaultComposerBalanceState
  tokenReads: Pick<StakingVaultTokenReads, "tokenDecimals">
  stakingNetPrincipalWei: bigint | null
  historyPlane: Pick<
    StakingVaultHistoryPlane,
    "stakingHistoryTotals" | "stakingHistoryRows"
  >
}>

export type StakingVaultPresentationPlane = Readonly<{
  formattedWalletBalance: string
  formattedStakedAssets: string
  maxStakeWei: bigint
  maxUnstakeWei: bigint
  formattedMinWithdrawalFee: string
  stakingPnlWei: bigint | null
  stakingBalanceAnchorMs: number | null
}>

export function useStakingVaultPresentationPlane(
  input: UseStakingVaultPresentationPlaneInput
): StakingVaultPresentationPlane {
  const { balance, tokenReads, stakingNetPrincipalWei, historyPlane } = input
  const { tokenDecimals } = tokenReads
  const {
    walletBalance,
    stakedAssets,
    vaultMaxDepositWei,
    vaultMaxWithdrawWei,
    minWithdrawalFeeWei,
    observedBalanceAnchorMs,
  } = balance
  const { stakingHistoryTotals } = historyPlane

  const formattedWalletBalance = useMemo(
    () => selectFormattedTokenUnits({ amountWei: walletBalance, tokenDecimals }),
    [walletBalance, tokenDecimals]
  )

  const formattedStakedAssets = useMemo(
    () => selectFormattedTokenUnits({ amountWei: stakedAssets, tokenDecimals }),
    [stakedAssets, tokenDecimals]
  )

  const { maxStakeWei, maxUnstakeWei } = useMemo(
    () =>
      selectVaultBalanceCaps({
        walletBalance,
        stakedAssets,
        vaultMaxDepositWei,
        vaultMaxWithdrawWei,
      }),
    [walletBalance, stakedAssets, vaultMaxDepositWei, vaultMaxWithdrawWei]
  )

  const formattedMinWithdrawalFee = useMemo(
    () =>
      selectFormattedTokenUnits({
        amountWei: minWithdrawalFeeWei,
        tokenDecimals,
      }),
    [minWithdrawalFeeWei, tokenDecimals]
  )

  const stakingPnlWei = useMemo(
    () => selectStakingPnlWei({ stakedAssets, stakingNetPrincipalWei }),
    [stakedAssets, stakingNetPrincipalWei]
  )

  const stakingBalanceAnchorMs = useMemo(
    () =>
      selectStakingBalanceAnchorMs({
        observedBalanceAnchorMs,
        stakingHistoryTotals,
      }),
    [observedBalanceAnchorMs, stakingHistoryTotals.lastBalanceChangeTimestamp]
  )

  return {
    formattedWalletBalance,
    formattedStakedAssets,
    maxStakeWei,
    maxUnstakeWei,
    formattedMinWithdrawalFee,
    stakingPnlWei,
    stakingBalanceAnchorMs,
  }
}
