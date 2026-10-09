import { getProviderRuntimeKeyForDeployment } from "@/staking/core/providerRegistry"
import type {
  DeploymentProviderRuntimeKey,
  StakingDeploymentConfig,
} from "@/staking/core/types"

/**
 * Phase 20 — **canonical runtime-scoped cache key material** (pure strings).
 *
 * **Invariant:** `DeploymentProviderRuntimeKey` is the authoritative execution partition
 * (`providerRuntime.ts` / `providerRegistry.ts`). **Do not** key runtime-sensitive caches by
 * `deploymentId` alone — two rows can share an id across families or RPC surfaces.
 *
 * **≠ ingestion:** registry JSON identity ≠ provider map identity; cache rows must follow
 * **`runtimeKey`**, not only deployment ingestion ids.
 *
 * **Phase 26:** module-level contract/gas caches use **`runtimeKey`** only today; **`RuntimeGeneration`**
 * (`runtimeGeneration.ts`) invalidates **React async subscriptions** — extend cache keys when switching
 * must evict prior-runtime `Contract` instances without waiting for TTL.
 */
const RUNTIME_CACHE_FIELD_SEP = "\u001f" as const

export function deriveRuntimeScopedCacheKey(
  runtimeKey: DeploymentProviderRuntimeKey,
  suffix: string
): string {
  return `${runtimeKey}${RUNTIME_CACHE_FIELD_SEP}${suffix}`
}

export function deriveDeploymentRuntimeCacheKey(
  deployment: StakingDeploymentConfig,
  suffix: string
): string {
  return deriveRuntimeScopedCacheKey(
    getProviderRuntimeKeyForDeployment(deployment),
    suffix
  )
}
