import type { StakingDeploymentConfig } from "@/staking/core/types"
import { fetchTronPassiveTokenMeta } from "@/staking/execution/tronPassiveReads"
import type { TronTokenMeta } from "@/staking/reads/types"

export type LoadTronTokenMetaInput = Readonly<{
  deployment: StakingDeploymentConfig
  tokenContractBase58: string
  callerBase58: string
  signal?: AbortSignal
}>

/** Tron TRC20 token metadata (FullNode `triggerconstantcontract`). */
export async function loadTronTokenMeta(input: LoadTronTokenMetaInput): Promise<TronTokenMeta> {
  return fetchTronPassiveTokenMeta(input)
}
