import type { StakingDeploymentConfig } from "@/staking/core/types"
import { fetchTronPassiveReadBalances } from "@/staking/execution/tronPassiveReads"
import type { BalanceSnapshot } from "@/staking/reads/types"

export type FetchTronPassiveBalancesInput = Readonly<{
  deployment: StakingDeploymentConfig
  tokenContractBase58: string
  walletBase58: string
  signal?: AbortSignal
}>

/** Tron passive balance + vault cap reads (maps to vault `BalanceSnapshot`). */
export async function fetchTronPassiveBalances(
  input: FetchTronPassiveBalancesInput
): Promise<BalanceSnapshot> {
  return fetchTronPassiveReadBalances(input)
}
