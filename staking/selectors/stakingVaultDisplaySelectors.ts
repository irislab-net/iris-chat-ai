// Phase D2a extracted presentation selectors

import { formatUnits, MaxUint256 } from "ethers"
import { formatStakingRuntimeWalletShort } from "@/staking/identity/stakingRuntimeWalletIdentity"
import type { StakingHistoryTotals } from "@/staking/execution"

/** Format a vault-token amount in human units; `"—"` when decimals missing or `formatUnits` throws. */
export type SelectFormattedTokenUnitsInput = Readonly<{
  amountWei: bigint
  tokenDecimals: number | null
}>

export function selectFormattedTokenUnits(input: SelectFormattedTokenUnitsInput): string {
  if (input.tokenDecimals === null) return "—"
  try {
    return formatUnits(input.amountWei, input.tokenDecimals)
  } catch {
    return "—"
  }
}

export type SelectVaultBalanceCapsInput = Readonly<{
  walletBalance: bigint
  stakedAssets: bigint
  vaultMaxDepositWei: bigint
  vaultMaxWithdrawWei: bigint
}>

export type VaultBalanceCapsSnapshot = Readonly<{
  maxStakeWei: bigint
  maxUnstakeWei: bigint
}>

export function selectVaultBalanceCaps(input: SelectVaultBalanceCapsInput): VaultBalanceCapsSnapshot {
  const maxStakeWei =
    input.vaultMaxDepositWei >= MaxUint256
      ? input.walletBalance
      : input.walletBalance < input.vaultMaxDepositWei
        ? input.walletBalance
        : input.vaultMaxDepositWei
  const maxUnstakeWei =
    input.vaultMaxWithdrawWei >= MaxUint256
      ? input.stakedAssets
      : input.stakedAssets < input.vaultMaxWithdrawWei
        ? input.stakedAssets
        : input.vaultMaxWithdrawWei
  return { maxStakeWei, maxUnstakeWei }
}

export type SelectStakingBalanceAnchorMsInput = Readonly<{
  observedBalanceAnchorMs: number | null
  stakingHistoryTotals: Pick<StakingHistoryTotals, "lastBalanceChangeTimestamp">
}>

export function selectStakingBalanceAnchorMs(input: SelectStakingBalanceAnchorMsInput): number | null {
  if (input.stakingHistoryTotals.lastBalanceChangeTimestamp !== null) {
    return input.stakingHistoryTotals.lastBalanceChangeTimestamp * 1000
  }
  return input.observedBalanceAnchorMs
}

export function selectRuntimeWalletShortAddress(
  runtimeWalletAddress: string | undefined
): string {
  return formatStakingRuntimeWalletShort(runtimeWalletAddress)
}
