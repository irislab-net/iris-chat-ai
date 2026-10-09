import type { ChainReceiptResolver } from "@/staking/core/persistenceTypes"

/**
 * @deprecated Phase 21 — Tron receipt resolvers are **deployment-bound** and registry-cached.
 * Use **`getReceiptResolverForDeployment(deployment)`** (or `getOrCreateTronReceiptResolverForDeployment`
 * from `providerRegistry.ts` inside staking core only).
 */
export function createTronReceiptResolver(): ChainReceiptResolver {
  throw new Error(
    "[staking] createTronReceiptResolver() without deployment is removed (Phase 21). Use getReceiptResolverForDeployment(deployment)."
  )
}
