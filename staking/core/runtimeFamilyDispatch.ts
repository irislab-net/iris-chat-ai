import type { StakingDeploymentConfig } from "./types"
import {
  getOrCreateEvmJsonRpcProviderForDeployment,
  getOrCreateEvmReceiptResolver,
  getOrCreateTronHttpProviderForDeployment,
  getOrCreateTronReceiptResolverForDeployment,
} from "./providerRegistry"
import type { ChainReceiptResolver } from "@/staking/core/persistenceTypes"
import type { TronHttpProvider } from "@/staking/core/tronProviderTypes"
import { isCfg6StakingRuntimeDisabledSentinel } from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"
import type { JsonRpcProvider } from "ethers"

function assertDeploymentProvidersAllowed(deployment: StakingDeploymentConfig): void {
  if (isCfg6StakingRuntimeDisabledSentinel(deployment)) {
    throw new Error(
      "[staking] Provider stack unavailable — no active staking deployment (CFG6 sentinel)."
    )
  }
  if (!isRuntimeFamilyEnabled(deployment.chainFamily)) {
    throw new Error(
      `[staking] Provider stack unavailable — ${deployment.chainFamily} runtime family is disabled by env rollout (CFG6).`
    )
  }
}

/**
 * Phase 18–22 — **family dispatch**, **executability**, and **runtime capabilities**
 *
 * **Runtime available (HTTP / receipt maps) ≠ staking executable** and **≠ feature parity**
 * (`getRuntimeCapabilitiesForDeployment`). Tron may have passive FullNode + receipts while gas /
 * allowance / ethers Contract reads / execution stay off for that family until policy changes.
 *
 * Use `getReceiptResolverForDeployment` / `getReadProviderForDeployment` at family boundaries — **never**
 * silently downgrade **tron → evm** or **evm → tron**; unknown `chainFamily` throws.
 */

export type StakingReadHttpRuntime =
  | { chainFamily: "evm"; jsonRpc: JsonRpcProvider }
  | { chainFamily: "tron"; tronHttp: TronHttpProvider }

export {
  assertExecutableDeployment,
  assertSupportsEthersContracts,
  assertSupportsGasEstimation,
  getRuntimeCapabilitiesForDeployment,
  isDeploymentRuntimeExecutable,
} from "./runtimeCapabilities"
export type { RuntimeCapabilities } from "./runtimeCapabilities"

/**
 * Family-aware receipt resolver: EVM and Tron each use registry-backed, **runtimeKey-partitioned**
 * resolvers — no cross-family fallback.
 */
export function getReceiptResolverForDeployment(
  deployment: StakingDeploymentConfig
): ChainReceiptResolver {
  assertDeploymentProvidersAllowed(deployment)
  if (deployment.chainFamily === "evm") {
    return getOrCreateEvmReceiptResolver(deployment)
  }
  if (deployment.chainFamily === "tron") {
    return getOrCreateTronReceiptResolverForDeployment(deployment)
  }
  throw new Error(
    `[staking] Unsupported chainFamily for receipt resolver: ${deployment.chainFamily}`
  )
}

/**
 * Family-aware read HTTP runtime: **EVM** → ethers `JsonRpcProvider`; **Tron** → passive FullNode
 * wrapper (no ethers). Callers that require JSON-RPC must narrow to `chainFamily === "evm"`.
 */
export function getReadProviderForDeployment(
  deployment: StakingDeploymentConfig
): StakingReadHttpRuntime {
  assertDeploymentProvidersAllowed(deployment)
  if (deployment.chainFamily === "evm") {
    return {
      chainFamily: "evm",
      jsonRpc: getOrCreateEvmJsonRpcProviderForDeployment(deployment),
    }
  }
  if (deployment.chainFamily === "tron") {
    return {
      chainFamily: "tron",
      tronHttp: getOrCreateTronHttpProviderForDeployment(deployment),
    }
  }
  throw new Error(
    `[staking] Unsupported chainFamily for read HTTP runtime: ${deployment.chainFamily}`
  )
}

/** EVM-only JSON-RPC — Tron throws (use `getReadProviderForDeployment` + `tronHttp` for Tron). */
export function getJsonRpcProviderForDeployment(
  deployment: StakingDeploymentConfig
): JsonRpcProvider {
  const rt = getReadProviderForDeployment(deployment)
  if (rt.chainFamily !== "evm") {
    throw new Error(
      `[staking] JsonRpcProvider is EVM-only; received chainFamily=${rt.chainFamily} (Phase 21).`
    )
  }
  return rt.jsonRpc
}
