import type {
  DeploymentProviderRuntimeKey,
  StakingDeploymentConfig,
} from "@/staking/core/types"

/**
 * Pure deployment / provider runtime identity helpers (Phase 12–13).
 * Live HTTP/WS/receipt instances are keyed in **`providerRegistry.ts`** (Phase 14); this module stays
 * string math only — no provider maps here.
 *
 * ## Why CAIP-2 (not numeric chain id alone)
 *
 * Staking historically used a single EVM `chainId` with ethers — that is **ambiguous** once
 * multiple **chain families** exist: the same number can mean different networks, and non-EVM
 * families do not use EIP-155 style ids at all. **CAIP-2** is the portable `namespace:reference`
 * network identifier; **`chainFamily`** in `StakingDeploymentConfig` picks codecs and RPC stacks.
 *
 * ## Non-EVM / Tron (this module today)
 *
 * - **`tryParseEvmChainIdFromCaip2`** — EVM-only; returns `null` for Tron or unknown CAIP namespaces.
 * - **`deriveProviderRuntimeKey`** — includes **`chainFamily`** so `eip155:…` and `tron:…` networks never
 *   share a collision-prone key with the same bare reference string.
 * - **CAIP-2:** `eip155:{chainId}` is **EVM**-specific; Tron uses the **`tron:`** namespace (see
 *   `validateTronDeployment.ts`). Never infer family from numeric id alone.
 *
 * ## Phase 14–15 — canonical runtime identity
 *
 * **Registry keys:** application code must use **`getProviderRuntimeKeyForDeployment`** from
 * `providerRegistry.ts` (it delegates here). Do not concatenate `deploymentId`, `chainFamily`, and
 * `caip2` ad hoc — maps in `providerRegistry.ts` assume a single string composition path.
 * **Phase 15:** pass **normalized** deployments (`normalizeDeployment`) so CAIP-2 whitespace/casing
 * cannot fork `DeploymentProviderRuntimeKey` strings for the same logical network.
 *
 * **Phase 18:** Receipt and JSON-RPC **selection** for a deployment row is **family-dispatched** in
 * `runtimeFamilyDispatch.ts` (this module remains key-string math only).
 *
 * **Phase 19:** Read-side **runtime identity** for threading (not provider construction) is
 * `deriveRuntimeReadContext` in `runtimeReadContext.ts` — **`runtimeKey`** is authoritative for map keys.
 *
 * **Phase 20:** Contract / gas **cache material** reuses the same **`runtimeKey`** (`runtimeCacheKey.ts`);
 * do not build runtime cache keys by hand outside those helpers.
 */

/** Canonical CAIP-2 string from a deployment row (trimmed). */
export function deriveDeploymentCaip2(deployment: StakingDeploymentConfig): string {
  return deployment.caip2.trim()
}

/**
 * Splits CAIP-2 into namespace + reference (reference may contain additional `:` segments).
 * @see https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md
 */
export function tryParseCaip2Parts(caip2: string): { namespace: string; reference: string } | null {
  const t = caip2.trim()
  const idx = t.indexOf(":")
  if (idx <= 0) return null
  const namespace = t.slice(0, idx).toLowerCase()
  const reference = t.slice(idx + 1)
  if (!namespace || !reference) return null
  return { namespace, reference }
}

/**
 * Parses `eip155:{chainId}` → numeric chain id, or `null` if not a well-formed EVM CAIP-2 network id.
 */
export function tryParseEvmChainIdFromCaip2(caip2: string): number | null {
  const m = /^eip155:(\d+)$/i.exec(caip2.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/**
 * Runtime key for future provider registries: `{deploymentId}:{chainFamily}:{caip2}`.
 * Example: `legacy-primary:evm:eip155:1`
 */
export function deriveProviderRuntimeKey(
  deployment: StakingDeploymentConfig
): DeploymentProviderRuntimeKey {
  return `${deployment.id}:${deployment.chainFamily}:${deriveDeploymentCaip2(
    deployment,
  )}` as DeploymentProviderRuntimeKey
}
