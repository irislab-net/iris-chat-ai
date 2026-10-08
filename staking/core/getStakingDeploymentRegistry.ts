/**
 * Single source for the staking deployment registry (Phase 15–16: normalized, validated, optional JSON ingest).
 *
 * **Phase 15:** `normalizeDeployment` + `validateStakingDeploymentRegistryFull` — soft-fail on **errors**.
 *
 * ## Phase 16 — optional `VITE_STAKING_DEPLOYMENTS_JSON`
 *
 * - **Missing / empty string:** legacy-only registry (unchanged).
 * - **Malformed JSON / bad shape:** legacy-only; **DEV** one-time `console.warn` with reason.
 * - **Valid envelope `{ "deployments": [...] }`:** legacy row is **always first** and **never**
 *   replaced; optional rows are normalized, per-row validated, then de-duped by **runtime key** and
 *   **deployment id** against legacy + prior optionals. Dropped rows are logged once in DEV.
 * - **`defaultDeploymentId`:** always **`legacy-primary`** — no deployment switching in this phase.
 * - **Execution:** live staking still resolves **only** the legacy EVM row via `resolveLegacyStakingDeployment()`;
 *   extra rows are passive registry capacity. **Phase 21:** validated Tron rows may have **passive**
 *   FullNode + receipt runtime in `providerRegistry` / `runtimeFamilyDispatch` — still **not**
 *   staking-executable (`isDeploymentRuntimeExecutable` / **`getRuntimeCapabilitiesForDeployment`**).
 *
 * **Phase 46:** optional **`VITE_STAKING_TRON_*`** block (`buildExplicitEnvDeploymentRows.ts`) appends a Tron
 * sibling row after legacy and before JSON — same dedupe rules; **not** shared liquidity. Ethereum: legacy + JSON only.
 */
import {
  STAKING_CHAIN_ID,
  STAKING_DEPLOYMENTS_JSON,
  STAKING_EXPLORER_BASE_URL,
  STAKING_EXPLORER_LABEL,
  STAKING_NETWORK_LABEL,
  STAKING_RPC_HTTP_URL,
  STAKING_RPC_WS_URL,
  STAKING_TOKEN_ADDRESS,
  STAKING_VAULT_ADDRESS,
} from "@/staking/config"
import { collectExplicitEnvNormalizedDeployments } from "@/staking/core/buildExplicitEnvDeploymentRows"
import {
  buildDeploymentRegistryFromJson,
  filterDuplicateRuntimeKeysAgainst,
} from "@/staking/core/buildDeploymentRegistryFromJson"
import { buildLegacyDeploymentFromEnv } from "@/staking/core/buildLegacyDeploymentFromEnv"
import { normalizeDeployment } from "@/staking/core/normalizeDeployment"
import { deriveProviderRuntimeKey } from "@/staking/core/providerRuntime"
import { validateStakingDeploymentRegistryFull } from "@/staking/core/registryValidation"
import type { StakingDeploymentConfig, StakingDeploymentRegistry } from "@/staking/core/types"
import { LEGACY_PRIMARY_DEPLOYMENT_ID } from "@/staking/core/types"
import { isRuntimeFamilyEnabled } from "@/staking/runtime/capabilities/stakingRuntimeFamilyRollout"

let devRegistryWarnOnce = false

function devWarnRegistryOnce(payload: unknown): void {
  if (!(process.env.NODE_ENV !== 'production') || devRegistryWarnOnce) return
  devRegistryWarnOnce = true
  console.warn("[staking] deployment registry:", payload)
}

function buildEmptyStakingRegistry(): StakingDeploymentRegistry {
  return { deployments: [], defaultDeploymentId: "" }
}

function computeDefaultDeploymentId(
  deployments: readonly StakingDeploymentConfig[]
): string {
  if (deployments.length === 0) return ""
  const legacy = LEGACY_PRIMARY_DEPLOYMENT_ID.trim()
  if (deployments.some(d => d.id.trim() === legacy)) return legacy
  return deployments[0].id.trim()
}

/** CFG6 — drop rows whose chain family is build-disabled; recomputes default id. */
function filterRegistryDeploymentsByFamilyRollout(
  registry: StakingDeploymentRegistry,
  ingestNotes: string[]
): StakingDeploymentRegistry {
  const kept: StakingDeploymentConfig[] = []
  for (const d of registry.deployments) {
    if (!isRuntimeFamilyEnabled(d.chainFamily)) {
      ingestNotes.push(
        `filtered deployment "${d.id.trim()}" (${d.chainFamily}): runtime family disabled by env rollout`
      )
      continue
    }
    kept.push(d)
  }
  const deployments = [...kept]
  return {
    deployments,
    defaultDeploymentId: computeDefaultDeploymentId(deployments),
  }
}

function buildNormalizedLegacyRegistry(): StakingDeploymentRegistry {
  const deployment = normalizeDeployment(
    buildLegacyDeploymentFromEnv({
      chainId: STAKING_CHAIN_ID,
      vaultAddress: STAKING_VAULT_ADDRESS,
      tokenAddress: STAKING_TOKEN_ADDRESS,
      rpcHttpUrl: STAKING_RPC_HTTP_URL,
      rpcWsUrl: STAKING_RPC_WS_URL,
      explorerBaseUrl: STAKING_EXPLORER_BASE_URL,
      explorerLabel: STAKING_EXPLORER_LABEL,
      networkLabel: STAKING_NETWORK_LABEL,
    })
  )

  return {
    deployments: [deployment],
    defaultDeploymentId: LEGACY_PRIMARY_DEPLOYMENT_ID.trim(),
  }
}

function mergeExplicitEnvDeploymentRowsIntoRegistry(
  baseRegistry: StakingDeploymentRegistry,
  ingestNotes: string[]
): StakingDeploymentRegistry {
  const explicit = collectExplicitEnvNormalizedDeployments(ingestNotes)
  if (explicit.length === 0) return baseRegistry

  const usedIds = new Set(baseRegistry.deployments.map(d => d.id.trim()))
  const usedKeys = new Set(baseRegistry.deployments.map(d => deriveProviderRuntimeKey(d)))
  const merged: StakingDeploymentConfig[] = [...baseRegistry.deployments]

  for (const row of explicit) {
    const k = deriveProviderRuntimeKey(row)
    if (usedKeys.has(k)) {
      ingestNotes.push(`skipped explicit-env row duplicate runtime key "${k}" (${row.id})`)
      continue
    }
    if (usedIds.has(row.id.trim())) {
      ingestNotes.push(`skipped explicit-env duplicate id "${row.id.trim()}"`)
      continue
    }
    usedKeys.add(k)
    usedIds.add(row.id.trim())
    merged.push(row)
  }

  return {
    deployments: merged,
    defaultDeploymentId: baseRegistry.defaultDeploymentId,
  }
}

function mergeOptionalDeploymentsJsonIntoRegistry(
  baseRegistry: StakingDeploymentRegistry,
  ingestNotes: string[]
): StakingDeploymentRegistry {
  const raw = STAKING_DEPLOYMENTS_JSON
  if (!raw?.trim()) return baseRegistry

  const built = buildDeploymentRegistryFromJson(raw)
  if (built.kind === "malformed") {
    ingestNotes.push(`VITE_STAKING_DEPLOYMENTS_JSON: ${built.detail}`)
    return baseRegistry
  }

  ingestNotes.push(...built.droppedRows.map(r => r.detail))

  const usedIds = new Set(baseRegistry.deployments.map(d => d.id.trim()))
  const usedKeys = new Set(baseRegistry.deployments.map(d => deriveProviderRuntimeKey(d)))

  const keyFiltered = filterDuplicateRuntimeKeysAgainst(usedKeys, [...built.optionalDeployments])
  ingestNotes.push(...keyFiltered.dropped.map(d => d.detail))

  const merged: StakingDeploymentConfig[] = [...baseRegistry.deployments]
  for (const row of keyFiltered.accepted) {
    if (row.chainFamily === "evm" && !isRuntimeFamilyEnabled("evm")) {
      ingestNotes.push(
        `skipped optional JSON row "${row.id.trim()}": VITE_ENABLE_ETHEREUM disables EVM registry rows`
      )
      continue
    }
    if (row.chainFamily === "tron" && !isRuntimeFamilyEnabled("tron")) {
      ingestNotes.push(
        `skipped optional JSON row "${row.id.trim()}": VITE_ENABLE_TRON disables Tron registry rows`
      )
      continue
    }
    if (usedIds.has(row.id.trim())) {
      ingestNotes.push(`skipped optional row duplicate id "${row.id.trim()}"`)
      continue
    }
    usedIds.add(row.id.trim())
    merged.push(row)
  }

  return {
    deployments: merged,
    defaultDeploymentId: baseRegistry.defaultDeploymentId,
  }
}

/**
 * Returns the staking deployment registry (normalized). Optional JSON may append passive rows.
 * Allocates a fresh object each call — intentional (no module-level cache / singleton).
 */
export function getStakingDeploymentRegistry(): StakingDeploymentRegistry {
  const baseRegistry = isRuntimeFamilyEnabled("evm")
    ? buildNormalizedLegacyRegistry()
    : buildEmptyStakingRegistry()
  const ingestNotes: string[] = []
  if (!isRuntimeFamilyEnabled("evm")) {
    ingestNotes.push(
      "CFG6: legacy-primary EVM row omitted — VITE_ENABLE_ETHEREUM is off"
    )
  }
  const withExplicit = mergeExplicitEnvDeploymentRowsIntoRegistry(baseRegistry, ingestNotes)
  const merged = mergeOptionalDeploymentsJsonIntoRegistry(withExplicit, ingestNotes)
  const candidate = filterRegistryDeploymentsByFamilyRollout(merged, ingestNotes)

  const validation = validateStakingDeploymentRegistryFull(candidate)
  const errors = validation.ok ? [] : validation.issues.filter(i => i.severity === "error")

  const devPayload: Record<string, unknown> = {}
  if (ingestNotes.length > 0) devPayload.ingestNotes = ingestNotes
  if (!validation.ok) devPayload.validationIssues = validation.issues
  if (Object.keys(devPayload).length > 0) {
    devWarnRegistryOnce(devPayload)
  }

  if (errors.length > 0) {
    return isRuntimeFamilyEnabled("evm")
      ? buildNormalizedLegacyRegistry()
      : buildEmptyStakingRegistry()
  }

  return candidate
}

/**
 * Resolve a deployment by id with registry fallbacks (default id, then first entry).
 * FUTURE: multi-deployment registry; today live execution still targets legacy via `resolveLegacyStakingDeployment`.
 */
export function resolveStakingDeploymentForReconcile(
  registry: StakingDeploymentRegistry,
  deploymentId: string
): StakingDeploymentConfig {
  const byId = registry.deployments.find(d => d.id === deploymentId)
  if (byId) return byId
  const byDefault = registry.deployments.find(d => d.id === registry.defaultDeploymentId)
  if (byDefault) return byDefault
  const first = registry.deployments[0]
  if (first) return first
  throw new Error("[staking] resolveStakingDeploymentForReconcile: empty registry")
}
