import { getProviderRuntimeKeyForDeployment } from "@/staking/core/providerRegistry"
import type {
  ChainFamily,
  DeploymentProviderRuntimeKey,
  StakingDeploymentConfig,
} from "@/staking/core/types"

/**
 * Phase 19–20 — **runtime read identity** (pure, allocation-light: three fields + one registry call).
 *
 * **Rule:** `DeploymentProviderRuntimeKey` is the authoritative provider-map identity
 * (`providerRuntime.ts` / `providerRegistry.ts`). Do not reconstruct
 * `id:chainFamily:caip2` strings ad hoc on read paths — derive once here.
 *
 * **≠ ingestion:** registry / JSON row identity does not imply which HTTP provider instance
 * serves reads; that flows from **deployment selection → `deriveRuntimeReadContext`** →
 * `getReadProviderForDeployment` in `runtimeFamilyDispatch.ts` (EVM → `jsonRpc`, Tron → `tronHttp`).
 * **Phase 22:** feature parity is **`getRuntimeCapabilitiesForDeployment`** — availability of HTTP/receipts
 * does not imply ethers, gas, allowance, or execution support.
 *
 * **Phase 20:** materialized cache keys for contracts / gas / native use **`runtimeKey`** via
 * `runtimeCacheKey.ts` — `deploymentId` here is diagnostic only, not a sufficient partition alone.
 *
 * **Phase 23:** **`ActiveRuntimeSelection`** (`runtimeSelection.ts`) bundles this context with
 * **`capabilities`** and **`generation`** (Phase 26) — do not infer feature support from wallet connectivity.
 */
export type RuntimeReadContext = {
  deploymentId: string
  runtimeKey: DeploymentProviderRuntimeKey
  chainFamily: ChainFamily
}

export function deriveRuntimeReadContext(
  deployment: StakingDeploymentConfig
): RuntimeReadContext {
  return {
    deploymentId: deployment.id.trim(),
    runtimeKey: getProviderRuntimeKeyForDeployment(deployment),
    chainFamily: deployment.chainFamily,
  }
}
