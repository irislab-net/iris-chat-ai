import { JsonRpcProvider } from "ethers"
import { tryParseEvmChainIdFromCaip2 } from "@/staking/core/providerRuntime"
import type { StakingDeploymentConfig } from "@/staking/core/types"

export type CreateStakingJsonRpcProviderInput = {
  rpcHttpUrl: string
  chainId: number
  /**
   * Optional deployment metadata for future multi-RPC identity / validation.
   * **Not** used in construction today — construction still uses only `rpcHttpUrl` + `chainId`.
   * FUTURE: may validate URL/chain against deployment or attach `deriveProviderRuntimeKey` plumbing.
   */
  deployment?: StakingDeploymentConfig
}

/**
 * Pure factory: same JsonRpcProvider construction as legacy staking HTTP reads
 * (`staticNetwork: true`, HTTP URL + numeric chain id).
 * Callers own singleton / lifecycle — this only constructs instances.
 *
 * **Phase 13 — non-EVM:** `JsonRpcProvider` is ethers/EVM; non-EVM families must not use this path.
 * Optional `deployment` is for future validation against URL/chain — not enforced here (runtime parity).
 */
export function createStakingJsonRpcProvider(
  input: CreateStakingJsonRpcProviderInput
): JsonRpcProvider {
  void input.deployment
  return new JsonRpcProvider(input.rpcHttpUrl, input.chainId, {
    staticNetwork: true,
  })
}

/**
 * Same provider construction as passing `deployment.rpc.http` + EVM chain parsed from `deployment.caip2`.
 * **EVM-only:** throws when CAIP-2 is not `eip155:*` or when `chainFamily` is not EVM — Tron needs a
 * different provider stack (`validateEvmDeploymentCompatibility` in `validateDeployment.ts` documents row shape).
 */
export function createStakingJsonRpcProviderForDeployment(
  deployment: StakingDeploymentConfig
): JsonRpcProvider {
  if (deployment.chainFamily !== "evm") {
    throw new Error(
      "[staking] createStakingJsonRpcProviderForDeployment: chainFamily must be evm (ethers JsonRpcProvider is EVM-only)"
    )
  }
  const chainId = tryParseEvmChainIdFromCaip2(deployment.caip2)
  if (chainId === null) {
    throw new Error(
      "[staking] createStakingJsonRpcProviderForDeployment: expected eip155 CAIP-2 for EVM deployment"
    )
  }
  return createStakingJsonRpcProvider({
    rpcHttpUrl: deployment.rpc.http,
    chainId,
    deployment,
  })
}
