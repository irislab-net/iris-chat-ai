import { createTronAddressCodec } from "@/staking/core/address/tronAddressCodec"
import { tryParseCaip2Parts } from "@/staking/core/providerRuntime"
import type {
  DeploymentValidationIssue,
  DeploymentValidationResult,
  DeploymentValidationSeverity,
  StakingDeploymentConfig,
} from "@/staking/core/types"
import {
  mergeDeploymentValidationResults,
  validateDeploymentCaip2,
  validateDeploymentFamily,
} from "@/staking/core/validateDeployment"

function iss(
  severity: DeploymentValidationSeverity,
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

function validateTronCaip2Namespace(deployment: StakingDeploymentConfig): DeploymentValidationResult {
  const id = deployment.id.trim()
  const parts = tryParseCaip2Parts(deployment.caip2?.trim() ?? "")
  if (!parts || parts.namespace !== "tron") {
    return fail(
      iss(
        "error",
        "tron_caip2_namespace",
        "Tron deployments require CAIP-2 with namespace `tron` (e.g. tron:mainnet)",
        id,
      ),
    )
  }
  return { ok: true }
}

function validateTronVaultAddress(deployment: StakingDeploymentConfig): DeploymentValidationResult {
  const id = deployment.id.trim()
  const codec = createTronAddressCodec()
  if (!codec.tryParse(deployment.vault?.address ?? "")) {
    return fail(
      iss(
        "error",
        "tron_vault_invalid",
        "Tron deployment vault.address must be a valid base58 Tron account (T + 33 chars)",
        id,
      ),
    )
  }
  return { ok: true }
}

function validateTronTokenAddress(deployment: StakingDeploymentConfig): DeploymentValidationResult {
  const id = deployment.id.trim()
  const codec = createTronAddressCodec()
  if (!codec.tryParse(deployment.token?.address ?? "")) {
    return fail(
      iss(
        "error",
        "tron_token_invalid",
        "Tron deployment token.address must be a valid base58 Tron account (T + 33 chars)",
        id,
      ),
    )
  }
  return { ok: true }
}

function validateTronExplorerUrl(deployment: StakingDeploymentConfig): DeploymentValidationResult {
  const id = deployment.id.trim()
  const base = deployment.explorer?.baseUrl?.trim() ?? ""
  if (!base) {
    return fail(
      iss("error", "explorer_base_empty", "Tron deployment requires a non-empty explorer.baseUrl", id),
    )
  }
  try {
    const u = new URL(base)
    if (!u.protocol.startsWith("http")) {
      return fail(
        iss(
          "error",
          "explorer_base_malformed",
          "Tron explorer.baseUrl must be an http(s) absolute URL",
          id,
        ),
      )
    }
  } catch {
    return fail(
      iss(
        "error",
        "explorer_base_malformed",
        "Tron explorer.baseUrl must be a valid absolute URL",
        id,
      ),
    )
  }
  return { ok: true }
}

function validateTronRpcAndExplorer(deployment: StakingDeploymentConfig): DeploymentValidationResult {
  const id = deployment.id.trim()
  const issues: DeploymentValidationIssue[] = []
  if (!deployment.rpc?.http?.trim()) {
    issues.push(iss("error", "rpc_http_empty", "Tron deployment requires a non-empty rpc.http URL", id))
  }
  const explorer = validateTronExplorerUrl(deployment)
  if (!explorer.ok) {
    issues.push(...(explorer.issues ?? []))
  }
  return issues.length > 0 ? fail(...issues) : { ok: true }
}

/**
 * Pure Tron deployment row validation (Phase 17). No RPC clients or network I/O.
 * Call only when `chainFamily === "tron"` (see `registryValidation.ts`).
 */
export function validateTronDeployment(deployment: StakingDeploymentConfig): DeploymentValidationResult {
  const id = deployment.id.trim()
  if (deployment.chainFamily !== "tron") {
    return fail(
      iss("error", "not_tron_family", "validateTronDeployment requires chainFamily tron", id),
    )
  }

  return mergeDeploymentValidationResults(
    validateDeploymentFamily(deployment),
    validateDeploymentCaip2(deployment),
    validateTronCaip2Namespace(deployment),
    validateTronVaultAddress(deployment),
    validateTronTokenAddress(deployment),
    validateTronRpcAndExplorer(deployment),
  )
}
