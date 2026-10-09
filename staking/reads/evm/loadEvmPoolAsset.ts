import { getStakingVaultRead, type StakingContractReadOptions } from "@/staking/execution"
import type { JsonRpcProvider } from "ethers"

export type LoadEvmPoolAssetInput = Readonly<{
  read: JsonRpcProvider
  stakingReadOptions: StakingContractReadOptions
}>

/** EVM pool token address via vault `asset()` (caller validates `isAddress`). */
export async function loadEvmPoolAsset(input: LoadEvmPoolAssetInput): Promise<string> {
  const vault = getStakingVaultRead(input.read, input.stakingReadOptions)
  return vault.asset()
}
