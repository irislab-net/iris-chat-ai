import { LEGACY_PRIMARY_DEPLOYMENT_ID, type StakingDeploymentConfig } from "@/staking/core/types"
import { STAKING_ETH_CAIP2_PREFIX, STAKING_ETH_CHAIN_FAMILY } from "@/staking/config/stakingEthConfig"

export type LegacyDeploymentEnvInput = {
  chainId: number
  vaultAddress: string
  tokenAddress: string
  rpcHttpUrl: string
  rpcWsUrl: string | null
  explorerBaseUrl: string
  explorerLabel: string
  networkLabel: string
}

/** Build the canonical legacy-primary EVM deployment row from env-backed fields. */
export function buildLegacyDeploymentFromEnv(
  input: LegacyDeploymentEnvInput
): StakingDeploymentConfig {
  const chainId = Number(input.chainId)
  const caip2 = `${STAKING_ETH_CAIP2_PREFIX}${Number.isFinite(chainId) ? chainId : 0}`
  const ws = input.rpcWsUrl?.trim() || null

  return {
    id: LEGACY_PRIMARY_DEPLOYMENT_ID,
    chainFamily: STAKING_ETH_CHAIN_FAMILY,
    caip2,
    vault: { address: input.vaultAddress },
    token: { address: input.tokenAddress },
    rpc: { http: input.rpcHttpUrl, ws },
    explorer: {
      baseUrl: input.explorerBaseUrl,
      label: input.explorerLabel,
    },
    labels: { network: input.networkLabel },
  }
}
