import { MaxUint256 } from "ethers"

export type StakingTokenMetaError = "WRONG_NETWORK" | "RPC_ERROR"

/** On-chain balance fields merged by orchestrator / Tron refetch (vault `balanceSnapshotRef` shape). */
export type BalanceSnapshot = Readonly<{
  walletBalance: bigint
  allowance: bigint
  vaultShares: bigint
  stakedAssets: bigint
  vaultMaxDepositWei: bigint
  vaultMaxWithdrawWei: bigint
  minWithdrawalFeeWei: bigint
}>

export const EMPTY_BALANCE_SNAPSHOT: BalanceSnapshot = {
  walletBalance: 0n,
  allowance: 0n,
  vaultShares: 0n,
  stakedAssets: 0n,
  vaultMaxDepositWei: MaxUint256,
  vaultMaxWithdrawWei: MaxUint256,
  minWithdrawalFeeWei: 0n,
}

/** Normalized ERC20 metadata from `loadEvmTokenMeta`. */
export type EvmTokenMeta = Readonly<{
  decimals: number
  symbol: string
  name: string
}>

/** Normalized TRC20 metadata from `loadTronTokenMeta`. */
export type TronTokenMeta = Readonly<{
  decimals: number
  symbol: string
  name: string
}>
