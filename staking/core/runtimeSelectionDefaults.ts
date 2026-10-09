import type { ActiveRuntimeSelection } from "@/staking/core/runtimeSelection"
import { getActiveStakingRuntimeSelection } from "@/staking/core/runtimeSelection"
import type { RuntimeOperationContext } from "@/staking/core/runtimeOperationContext"
import type { StakingDeploymentConfig } from "@/staking/core/types"

/**
 * Phase 24–25 — **read-only default runtime** when the caller omits a **`RuntimeOperationContext`**.
 *
 * **Layering:**
 * - **Infra** (`providerRegistry.resolveLegacyStakingDeployment`) materializes the canonical legacy row.
 * - **Selection** (`getActiveStakingRuntimeSelection`) is the app’s chosen runtime (passive; legacy-primary today).
 * - **Defaults here** back **optional** snapshot params in services (gas, reads) and non-React entry points.
 *
 * **Phase 25:** app / React paths should pass an explicit **`RuntimeOperationContext`**; this helper is
 * the compatibility fallback only (`resolveRuntimeOperationContextOrDefault`).
 *
 * **Phase 26:** default snapshots include static **`generation`** (`STAKING_RUNTIME_GENERATION_INITIAL`);
 * mutable selection will bump generation without necessarily changing **`runtimeKey`**.
 * **No mutation:** no setters, persistence, or URL state — switching is a future change to selection only.
 */
export function getDefaultRuntimeSelection(): ActiveRuntimeSelection {
  return getActiveStakingRuntimeSelection()
}

/** When `runtime` is omitted, use passive app selection (legacy-primary today). */
export function resolveRuntimeOperationContextOrDefault(
  runtime?: RuntimeOperationContext | null
): RuntimeOperationContext {
  return runtime ?? getDefaultRuntimeSelection()
}

/** Deployment row for reads/gas when the caller omits an explicit `StakingDeploymentConfig`. */
export function getDefaultStakingRuntimeDeployment(): StakingDeploymentConfig {
  return getDefaultRuntimeSelection().deployment
}
