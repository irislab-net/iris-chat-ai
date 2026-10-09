/**
 * Pure registry-level validation (Phase 15). Does **not** throw — returns `DeploymentValidationResult`.
 *
 * **Why runtime-key collisions are dangerous:** `providerRegistry.ts` maps HTTP/WS/receipt instances by
 * `deriveProviderRuntimeKey`. Two different `deploymentId`s sharing the same key would share one
 * provider — **silent cross-chain RPC corruption**. Duplicate keys must be **`error`** severity.
 *
 * **Soft-fail at load:** `getStakingDeploymentRegistry()` merges these results and only **replaces**
 * the registry when **`error`** issues exist (prod falls back to legacy-from-env). Warnings do not
 * block returning the candidate registry — production startup must not crash yet.
 *
 * **Phase 17–21:** Tron rows use **`validateTronDeployment`** (base58 vault, `tron:` CAIP-2, rpc.http,
 * well-formed explorer URL); EVM unchanged. **Ingestion validity ≠ execution:** passive Tron HTTP +
 * receipt maps may exist after Phase 21 while staking execution remains legacy-primary EVM only.
 */
import { deriveProviderRuntimeKey } from "@/staking/core/providerRuntime"
import type {
  DeploymentValidationIssue,
  DeploymentValidationResult,
  StakingDeploymentConfig,
  StakingDeploymentRegistry,
} from "@/staking/core/types"
import {
  mergeDeploymentValidationResults,
  validateDeploymentFamily,
  validateEvmDeploymentCompatibility,
} from "@/staking/core/validateDeployment"
import { isEvmDeployment, isTronDeployment } from "@/staking/core/deploymentFamily"
import { validateTronDeployment } from "@/staking/core/validateTronDeployment"

function iss(
  severity: "warning" | "error",
  code: string,
  message: string,
  deploymentId?: string
): DeploymentValidationIssue {
  return deploymentId !== undefined
    ? { severity, code, message, deploymentId }
    : { severity, code, message }
}

function fail(...issues: DeploymentValidationIssue[]): DeploymentValidationResult {
  return { ok: false, issues }
}

/**
 * Duplicate deployment ids, default id membership, non-empty registry.
 */
export function validateDeploymentIds(registry: StakingDeploymentRegistry): DeploymentValidationResult {
  const issues: DeploymentValidationIssue[] = []
  if (registry.deployments.length === 0) {
    const def = registry.defaultDeploymentId.trim()
    if (def !== "") {
      issues.push(
        iss(
          "error",
          "registry_empty_default_non_empty",
          `empty staking deployment registry requires defaultDeploymentId to be empty (got "${def}")`
        )
      )
      return fail(...issues)
    }
    return { ok: true }
  }

  const seen = new Map<string, string>()
  for (const d of registry.deployments) {
    const id = d.id.trim()
    if (seen.has(id)) {
      issues.push(
        iss(
          "error",
          "duplicate_deployment_id",
          `duplicate deployment id "${id}"`,
          id,
        ),
      )
    } else {
      seen.set(id, id)
    }
  }

  const def = registry.defaultDeploymentId.trim()
  if (!registry.deployments.some(d => d.id.trim() === def)) {
    issues.push(
      iss(
        "error",
        "default_deployment_missing",
        `defaultDeploymentId "${def}" does not match any deployment row`,
      ),
    )
  }

  return issues.length > 0 ? fail(...issues) : { ok: true }
}

/**
 * Ensures `deriveProviderRuntimeKey` is unique per deployment id (same key, different ids → error).
 */
export function validateDeploymentRuntimeUniqueness(
  registry: StakingDeploymentRegistry
): DeploymentValidationResult {
  const issues: DeploymentValidationIssue[] = []
  const keyToIds = new Map<string, string[]>()

  for (const d of registry.deployments) {
    const key = deriveProviderRuntimeKey(d)
    const list = keyToIds.get(key) ?? []
    list.push(d.id.trim())
    keyToIds.set(key, list)
  }

  for (const [key, ids] of keyToIds) {
    const unique = new Set(ids)
    if (unique.size > 1) {
      issues.push(
        iss(
          "error",
          "duplicate_runtime_key",
          `duplicate provider runtime key "${key}" for deployment ids: ${[...unique].join(", ")} — would corrupt providerRegistry maps`,
        ),
      )
    }
  }

  return issues.length > 0 ? fail(...issues) : { ok: true }
}

function withDeploymentId(
  deploymentId: string,
  result: DeploymentValidationResult
): DeploymentValidationIssue[] {
  if (result.ok) return []
  return result.issues.map(i => ({
    ...i,
    deploymentId: i.deploymentId ?? deploymentId,
  }))
}

export function deploymentRowHasValidationErrors(result: DeploymentValidationResult): boolean {
  if (result.ok) return false
  return result.issues.some(i => i.severity === "error")
}

/**
 * Per-row checks (EVM + non-EVM) — shared by full-registry validation and optional JSON ingestion.
 */
export function validateDeploymentRowForRegistryShape(
  deployment: StakingDeploymentConfig
): DeploymentValidationResult {
  const id = deployment.id.trim()
  const issues: DeploymentValidationIssue[] = []

  if (isEvmDeployment(deployment)) {
    issues.push(...withDeploymentId(id, validateEvmDeploymentCompatibility(deployment)))

    const base = deployment.explorer?.baseUrl?.trim() ?? ""
    if (!base) {
      issues.push(
        iss("error", "explorer_base_empty", "EVM deployment requires a non-empty explorer.baseUrl", id),
      )
    }

    if (!deployment.rpc?.ws?.trim()) {
      issues.push(
        iss(
          "warning",
          "rpc_ws_missing",
          "EVM deployment has no rpc.ws URL (HTTP-only reads; WS block signal disabled)",
          id,
        ),
      )
    }
  } else if (isTronDeployment(deployment)) {
    issues.push(...withDeploymentId(id, validateTronDeployment(deployment)))
  } else {
    issues.push(...withDeploymentId(id, validateDeploymentFamily(deployment)))
  }

  return issues.length > 0 ? fail(...issues) : { ok: true }
}

/**
 * Per-row structural validation across all registry rows.
 */
export function validateDeploymentRegistry(registry: StakingDeploymentRegistry): DeploymentValidationResult {
  const issues: DeploymentValidationIssue[] = []

  for (const d of registry.deployments) {
    const r = validateDeploymentRowForRegistryShape(d)
    if (!r.ok) issues.push(...r.issues)
  }

  return issues.length > 0 ? fail(...issues) : { ok: true }
}

/**
 * Full registry validation: ids, runtime uniqueness, and per-row checks.
 */
export function validateStakingDeploymentRegistryFull(
  registry: StakingDeploymentRegistry
): DeploymentValidationResult {
  return mergeDeploymentValidationResults(
    validateDeploymentIds(registry),
    validateDeploymentRuntimeUniqueness(registry),
    validateDeploymentRegistry(registry),
  )
}
