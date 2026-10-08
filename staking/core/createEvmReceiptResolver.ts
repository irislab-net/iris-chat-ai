import type { ChainReceiptResolver } from "@/staking/core/persistenceTypes"
import { isEvmDeployment } from "@/staking/core/deploymentFamily"
import { getOrCreateEvmReceiptResolver } from "@/staking/core/providerRegistry"
import { getDefaultStakingRuntimeDeployment } from "@/staking/core/runtimeSelectionDefaults"
import type { StakingDeploymentConfig } from "@/staking/core/types"

/**
 * EVM receipt resolver backed by the **runtime-keyed** HTTP provider registry (`providerRegistry.ts`).
 *
 * **Phase 12–14:** `_deployment` selects the registry entry; omitted → **default runtime deployment**
 * (`getDefaultStakingRuntimeDeployment`, Phase 24). Receipt reads use **`getOrCreateEvmJsonRpcProviderForDeployment`** — same `JsonRpcProvider` instance as
 * `getReadProviderForDeployment` / registry for that deployment’s runtime key (one key in production today).
 *
 * **Phase 18:** For **family-aware** entry (reconcile, multi-row contexts), prefer
 * **`getReceiptResolverForDeployment`** in `runtimeFamilyDispatch.ts`. This factory stays **EVM-only**
 * and throws if given a non-EVM deployment — no silent fallback.
 */
export function createEvmReceiptResolver(
  deployment?: StakingDeploymentConfig
): ChainReceiptResolver {
  const d = deployment ?? getDefaultStakingRuntimeDeployment()
  if (!isEvmDeployment(d)) {
    throw new Error(
      `[staking] createEvmReceiptResolver: EVM-only; received chainFamily=${d.chainFamily} (Phase 18).`
    )
  }
  return getOrCreateEvmReceiptResolver(d)
}
