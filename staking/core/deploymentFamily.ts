import type { ChainFamily, StakingDeploymentConfig } from "@/staking/core/types"

/**
 * Pure chain-family helpers (Phase 13). No registry or provider branching — narrowing only.
 *
 * **Phase 15:** registry rows are **normalized** before validation (`normalizeDeployment.ts`) — family
 * checks here assume canonical `chainFamily` strings when present.
 *
 * **Phase 17:** **`isTronDeployment`** pairs with `validateTronDeployment.ts` for passive Tron registry rows.
 *
 * **Phase 18:** **Runtime executability** (legacy-primary EVM gate, receipt/provider dispatch) lives in
 * `runtimeFamilyDispatch.ts` — registry containment and family narrowing here are orthogonal.
 *
 * **Phase 19:** **`deriveRuntimeReadContext`** (`runtimeReadContext.ts`) is the portable read identity
 * bundle (`deploymentId` + **`runtimeKey`** + `chainFamily`) for threading alongside these predicates.
 *
 * **Phase 20:** Runtime-sensitive **cache partitions** use **`runtimeKey`** via `runtimeCacheKey.ts`;
 * `deploymentId` alone is never sufficient for cross-family / multi-RPC isolation.
 */

export function deriveDeploymentChainFamily(d: StakingDeploymentConfig): ChainFamily {
  return d.chainFamily
}

export function isEvmDeployment(
  d: StakingDeploymentConfig
): d is StakingDeploymentConfig & { chainFamily: "evm" } {
  return d.chainFamily === "evm"
}

export function isTronDeployment(
  d: StakingDeploymentConfig
): d is StakingDeploymentConfig & { chainFamily: "tron" } {
  return d.chainFamily === "tron"
}
