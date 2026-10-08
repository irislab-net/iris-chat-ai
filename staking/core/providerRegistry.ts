/**
 * Runtime-keyed provider / resolver registries (Phase 14+; **EVM + passive Tron HTTP** in Phase 21).
 *
 * **Why registries:** staking historically hid a single HTTP + WS pair behind module singletons.
 * Multi-deployment / multi-family runtime needs a **stable map key** per logical RPC surface so
 * instances are reused without ad-hoc globals.
 *
 * **Why `deploymentId` alone is insufficient:** two rows can share an id across versions; runtime
 * identity must include **chainFamily + CAIP-2** (see `deriveProviderRuntimeKey` in
 * `providerRuntime.ts`). Use **`getProviderRuntimeKeyForDeployment`** as the only registry key
 * source — do not compose `id:family:caip2` strings elsewhere.
 *
 * **Current app:** the registry still collapses to **one** `DeploymentProviderRuntimeKey` in
 * production (single legacy EVM deployment). Maps hold at most one entry each until multi-runtime
 * wiring lands.
 *
 * **Phase 16:** Rows may include **passive** optional deployments from `VITE_STAKING_DEPLOYMENTS_JSON`;
 * live HTTP/WS/receipt paths still resolve **legacy** only — no automatic execution of extra rows.
 *
 * **Phase 17–21 (multi-family):** maps are keyed by **`DeploymentProviderRuntimeKey`**
 * (`id:chainFamily:caip2`) so Tron and EVM keys never collide. **EVM** uses `JsonRpcProvider` + WS +
 * receipt resolvers; **Tron** uses passive **`TronHttpProvider`** + **`buildTronChainReceiptResolver`**
 * (FullNode `wallet/*` JSON only — no TronWeb, no env-global Tron singleton). **Staking execution**
 * on Tron remains **disabled** via `isDeploymentRuntimeExecutable` / **`getRuntimeCapabilitiesForDeployment`**
 * (`runtimeCapabilities.ts` re-exported from `runtimeFamilyDispatch.ts`).
 * **Phase 23:** passive **app** runtime selection is **`getActiveStakingRuntimeSelection`** (`runtimeSelection.ts`);
 * `resolveLegacyStakingDeployment` remains the underlying row for that selection today.
 *
 * **Phase 26:** app async work should key on **`RuntimeOperationContext`**’s **`runtimeKey` + `generation`**
 * (see `runtimeGeneration.ts`); registry maps remain **`DeploymentProviderRuntimeKey`**-keyed — generation
 * does not partition these singletons until explicit invalidation is implemented.
 * **Phase 18 — family-aware runtime dispatch (`runtimeFamilyDispatch.ts`):**
 * - **Receipt reads at reconcile / family boundaries** should use **`getReceiptResolverForDeployment`**
 *   (not bare `getOrCreateEvmReceiptResolver` with an unchecked deployment) so Tron never silently
 *   hits EVM code paths.
 * - **EVM creation paths (this file):** `getOrCreateEvmJsonRpcProviderForDeployment` and
 *   `getOrCreateEvmReceiptResolver` are **EVM-only** and throw if `chainFamily !== "evm"`.
 * - **Future Tron execution:** wallet + deposit/withdraw wiring is **out of scope**; passive HTTP
 *   and receipt maps exist for reconcile / indexing / tests only.
 * - **Why provider maps stay passive for Tron:** registry ingestion can admit Tron rows for validation
 *   and future UI; **runtime executability** is decided in `runtimeFamilyDispatch` (legacy-primary EVM
 *   only today), not by presence in these `Map`s.
 *
 * **Phase 19–20 — read / gas HTTP ownership:** runtime-sensitive callers should obtain JSON-RPC via
 * **`getReadProviderForDeployment`** (`runtimeFamilyDispatch.ts`), not ad-hoc env-based providers.
 * This module’s `Map`s remain the **sole** construction layer for **EVM** `JsonRpcProvider` and
 * **passive Tron** `TronHttpProvider` / receipt resolvers, each keyed by **`runtimeKey`**.
 * **TTL caches** for gas/native (see `gasEstimator.ts`) and **contract** caches (see `stakingReadFactory.ts`)
 * partition by that same **`runtimeKey`** material (`runtimeCacheKey.ts` / `deriveRuntimeReadContext`) —
 * never assume **`deploymentId` alone** is a sufficient partition across families or RPC surfaces.
 *
 * **Phase 15:** rows are **normalized** at registry load; duplicate runtime keys are **`error`** at validation.
 *
 * **Phase 38 (DEV torture):** `getStakingProviderRegistryDevSnapshot` exposes map sizes for long-session leak checks.
 *
 * **Phase 42 — PRODUCTION-FROZEN:** registry construction and keys are stability-critical; change only with full
 * multi-runtime audit. See `docs/staking-runtime-phase42-stabilization.md`.
 *
 * **Not React / not app state:** internal module `Map`s only; no user-visible behavior.
 */
import { JsonRpcProvider, WebSocketProvider } from "ethers"
import { createStakingJsonRpcProvider } from "@/staking/core/createStakingJsonRpcProvider"
import { createTronHttpProvider } from "@/staking/core/createTronHttpProvider"
import { buildTronChainReceiptResolver } from "@/staking/core/createTronReceiptResolverRuntime"
import { getStakingDeploymentRegistry } from "@/staking/core/getStakingDeploymentRegistry"
import { resolveStakingDeploymentForActiveSelection } from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"
import type { ChainReceiptResolver } from "@/staking/core/persistenceTypes"
import {
  deriveProviderRuntimeKey,
  tryParseEvmChainIdFromCaip2,
} from "@/staking/core/providerRuntime"
import type {
  DeploymentProviderRuntimeKey,
  StakingDeploymentConfig,
} from "@/staking/core/types"
import type { TronHttpProvider } from "@/staking/core/tronProviderTypes"
import {
  buildRuntimeTelemetryEvent,
  emitRuntimeTelemetry,
  isRuntimeTelemetryEmitEnabled,
} from "@/lib/runtimeTelemetry/runtimeTelemetry"

const httpProviderRegistry = new Map<DeploymentProviderRuntimeKey, JsonRpcProvider>()
const tronHttpProviderRegistry = new Map<DeploymentProviderRuntimeKey, TronHttpProvider>()
const receiptResolverRegistry = new Map<DeploymentProviderRuntimeKey, ChainReceiptResolver>()
const wsProviderRegistry = new Map<DeploymentProviderRuntimeKey, WebSocketProvider>()

function maybeEmitRegistryGrowthTelemetry(): void {
  if (!isRuntimeTelemetryEmitEnabled()) return
  const total =
    httpProviderRegistry.size +
    tronHttpProviderRegistry.size +
    receiptResolverRegistry.size +
    wsProviderRegistry.size
  if (total <= 6) return
  emitRuntimeTelemetry(
    buildRuntimeTelemetryEvent(
      "registry_growth_abnormal",
      "warning",
      { reasonToken: "provider_map_pressure" },
      total
    )
  )
}

/**
 * Two deployments with the same runtime key must share identical RPC surfaces; first writer wins.
 */

/** Single composition point for registry keys (delegates to `deriveProviderRuntimeKey`). */
export function getProviderRuntimeKeyForDeployment(
  deployment: StakingDeploymentConfig
): DeploymentProviderRuntimeKey {
  return deriveProviderRuntimeKey(deployment)
}

/** Default staking deployment row from registry — legacy-primary when present; CFG6 sentinel when empty. */
export function resolveLegacyStakingDeployment(): StakingDeploymentConfig {
  return resolveStakingDeploymentForActiveSelection(getStakingDeploymentRegistry())
}

export function getOrCreateEvmJsonRpcProviderForDeployment(
  deployment: StakingDeploymentConfig
): JsonRpcProvider {
  if (deployment.chainFamily !== "evm") {
    throw new Error("[staking] getOrCreateEvmJsonRpcProviderForDeployment: EVM only (Phase 14)")
  }
  const key = getProviderRuntimeKeyForDeployment(deployment)
  let p = httpProviderRegistry.get(key)
  if (!p) {
    const chainId = tryParseEvmChainIdFromCaip2(deployment.caip2)
    if (chainId === null) {
      throw new Error("[staking] getOrCreateEvmJsonRpcProviderForDeployment: invalid eip155 caip2")
    }
    p = createStakingJsonRpcProvider({
      rpcHttpUrl: deployment.rpc.http,
      chainId,
      deployment,
    })
    httpProviderRegistry.set(key, p)
    maybeEmitRegistryGrowthTelemetry()
  }
  return p
}

function buildEvmChainReceiptResolver(deployment: StakingDeploymentConfig): ChainReceiptResolver {
  return {
    family: "evm",
    async getReceiptSummary(txHash: string, signal?: AbortSignal) {
      void signal
      const http = getOrCreateEvmJsonRpcProviderForDeployment(deployment)
      const receipt = await http.getTransactionReceipt(txHash)
      if (!receipt) {
        return { status: "pending" }
      }
      const ok =
        receipt.status === 1 || (typeof receipt.status === "bigint" && receipt.status === 1n)
      if (ok) {
        return { status: "success", rawStatus: receipt.status }
      }
      return { status: "failure", rawStatus: receipt.status }
    },
  }
}

export function getOrCreateEvmReceiptResolver(deployment: StakingDeploymentConfig): ChainReceiptResolver {
  if (deployment.chainFamily !== "evm") {
    throw new Error(
      "[staking] getOrCreateEvmReceiptResolver: EVM-only — use getOrCreateTronReceiptResolverForDeployment or getReceiptResolverForDeployment (Phase 21)."
    )
  }
  const key = getProviderRuntimeKeyForDeployment(deployment)
  let r = receiptResolverRegistry.get(key)
  if (!r) {
    r = buildEvmChainReceiptResolver(deployment)
    receiptResolverRegistry.set(key, r)
    maybeEmitRegistryGrowthTelemetry()
  }
  return r
}

export function getOrCreateTronHttpProviderForDeployment(
  deployment: StakingDeploymentConfig
): TronHttpProvider {
  if (deployment.chainFamily !== "tron") {
    throw new Error(
      "[staking] getOrCreateTronHttpProviderForDeployment: Tron only — no EVM fallback (Phase 21)."
    )
  }
  const rpc = deployment.rpc.http?.trim()
  if (!rpc) {
    throw new Error("[staking] Tron deployment missing rpc.http — cannot create passive HTTP runtime (Phase 21)")
  }
  const key = getProviderRuntimeKeyForDeployment(deployment)
  let p = tronHttpProviderRegistry.get(key)
  if (!p) {
    p = createTronHttpProvider({ runtimeKey: key, rpcHttpUrl: rpc })
    tronHttpProviderRegistry.set(key, p)
    maybeEmitRegistryGrowthTelemetry()
  }
  return p
}

export function getOrCreateTronReceiptResolverForDeployment(
  deployment: StakingDeploymentConfig
): ChainReceiptResolver {
  if (deployment.chainFamily !== "tron") {
    throw new Error(
      "[staking] getOrCreateTronReceiptResolverForDeployment: Tron only — no EVM fallback (Phase 21)."
    )
  }
  const key = getProviderRuntimeKeyForDeployment(deployment)
  let r = receiptResolverRegistry.get(key)
  if (!r) {
    const http = getOrCreateTronHttpProviderForDeployment(deployment)
    r = buildTronChainReceiptResolver(deployment, http)
    receiptResolverRegistry.set(key, r)
    maybeEmitRegistryGrowthTelemetry()
  }
  return r
}

/** @internal WS lifecycle owner (`stakingReadProviders.ts`) — not a public surface. */
export function registryGetWsProvider(
  key: DeploymentProviderRuntimeKey
): WebSocketProvider | undefined {
  return wsProviderRegistry.get(key)
}

/** @internal */
export function registrySetWsProvider(
  key: DeploymentProviderRuntimeKey,
  ws: WebSocketProvider | undefined
): void {
  if (ws === undefined) {
    wsProviderRegistry.delete(key)
  } else {
    wsProviderRegistry.set(key, ws)
    maybeEmitRegistryGrowthTelemetry()
  }
}

/** Phase 38 — DEV-only: bounded registry size snapshot (no production behavior change). */
export function getStakingProviderRegistryDevSnapshot(): Readonly<{
  evmJsonRpcProviders: number
  tronHttpProviders: number
  receiptResolvers: number
  wsProviders: number
}> {
  return {
    evmJsonRpcProviders: httpProviderRegistry.size,
    tronHttpProviders: tronHttpProviderRegistry.size,
    receiptResolvers: receiptResolverRegistry.size,
    wsProviders: wsProviderRegistry.size,
  }
}
