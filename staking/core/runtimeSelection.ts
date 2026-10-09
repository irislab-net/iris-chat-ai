import { getStakingDeploymentRegistry } from "@/staking/core/getStakingDeploymentRegistry"
import { resolveStakingDeploymentForActiveSelection } from "@/staking/runtime/capabilities/stakingRuntimeDisabledSentinel"
import {
  bumpRuntimeGeneration,
  createStaticRuntimeGeneration,
} from "@/staking/core/runtimeGeneration"
import type { RuntimeGeneration } from "@/staking/core/runtimeGeneration"
import { getRuntimeCapabilitiesForDeployment } from "@/staking/core/runtimeCapabilities"
import type { RuntimeCapabilities } from "@/staking/core/runtimeCapabilities"
import { deriveRuntimeReadContext } from "@/staking/core/runtimeReadContext"
import type { RuntimeReadContext } from "@/staking/core/runtimeReadContext"
import type {
  DeploymentProviderRuntimeKey,
  StakingDeploymentConfig,
} from "@/staking/core/types"

/**
 * Phase 23 — **app-level passive staking runtime selection** (pure, no persistence).
 *
 * **Wallet connection ≠ runtime selection:** a connected wallet does not imply this row, executability,
 * gas, or allowance support — those come from **`capabilities`** and policy (`isDeploymentRuntimeExecutable`).
 *
 * **Phase 23–24 default:** **`getActiveStakingRuntimeSelection`** is the only app entry that may call
 * **`resolveLegacyStakingDeployment()`** (infra). App-facing code uses **`getDefaultRuntimeSelection`** /
 * **`getDefaultStakingRuntimeDeployment`** from `runtimeSelectionDefaults.ts` instead of ad-hoc legacy
 * fallbacks — no UI switching, no persistence; future picker updates selection derivation only.
 *
 * **Phase 25:** runtime-sensitive execution uses **`RuntimeOperationContext`** (alias of this type) —
 * snapshots created in React (`useActiveRuntimeSelection` / `useRuntimeOperationContext`) and passed
 * into gas / reads / reconcile; services fall back to **`resolveRuntimeOperationContextOrDefault`**
 * only when the caller omits a snapshot (scripts, tests).
 *
 * **Phase 26:** **`generation`** (`RuntimeGeneration`) is part of the snapshot identity together with
 * **`runtimeKey`** — async work should depend on both; generation is static until mutable selection exists.
 *
 * **Phase 28–33:** coordinated UI/async ownership uses **`RuntimeTransitionSnapshot`** (`runtimeTransition.ts`)
 * via **`useRuntimeTransitionSnapshot()`** — not scattered **`runtimeKey` / `generation`** reads alone.
 *
 * **Phase 34:** in-memory swaps replace the full row atomically via **`cloneActiveRuntimeSelectionForSwap`**
 * (`runtimeSwapEngine` / tests) — **`generation`** always bumps from the **previous** active row.
 *
 * **Phase 42 — PRODUCTION-FROZEN:** `ActiveRuntimeSelection` shape and derivation are the contract for hooks/services;
 * change only for correctness. See `docs/staking-runtime-phase42-stabilization.md`.
 */
export type ActiveRuntimeSelection = Readonly<{
  deployment: StakingDeploymentConfig
  runtimeKey: DeploymentProviderRuntimeKey
  /** Phase 26 — invalidates async work across runtime switches (static `1` until selection is mutable). */
  generation: RuntimeGeneration
  capabilities: RuntimeCapabilities
  runtimeRead: RuntimeReadContext
}>

export function createActiveRuntimeSelection(
  deployment: StakingDeploymentConfig
): ActiveRuntimeSelection {
  const runtimeRead = deriveRuntimeReadContext(deployment)
  return {
    deployment,
    runtimeKey: runtimeRead.runtimeKey,
    generation: createStaticRuntimeGeneration(),
    capabilities: getRuntimeCapabilitiesForDeployment(deployment),
    runtimeRead,
  }
}

/**
 * Phase 34 — build the next passive row for a swap: re-derive read context + capabilities from
 * **`next.deployment`**, bump **`generation`** from **`previous`** (caller must already be in the
 * **`refresh_paused`** mutation window).
 */
export function cloneActiveRuntimeSelectionForSwap(
  previous: ActiveRuntimeSelection,
  next: Pick<ActiveRuntimeSelection, "deployment">
): ActiveRuntimeSelection {
  const deployment = next.deployment
  const runtimeRead = deriveRuntimeReadContext(deployment)
  return {
    deployment,
    runtimeKey: runtimeRead.runtimeKey,
    generation: bumpRuntimeGeneration(previous.generation),
    capabilities: getRuntimeCapabilitiesForDeployment(deployment),
    runtimeRead,
  }
}

/** Single passive app selection — registry default row, or CFG6 sentinel when no deployments. */
export function getActiveStakingRuntimeSelection(): ActiveRuntimeSelection {
  return createActiveRuntimeSelection(
    resolveStakingDeploymentForActiveSelection(getStakingDeploymentRegistry())
  )
}
