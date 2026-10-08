import { isAddress } from "ethers"
import { isEvmDeployment } from "@/staking/core/deploymentFamily"
import { tryParseCaip2Parts, tryParseEvmChainIdFromCaip2 } from "@/staking/core/providerRuntime"
import {
  CHAIN_FAMILIES,
  type ChainFamily,
  type DeploymentValidationIssue,
  type DeploymentValidationResult,
  type DeploymentValidationSeverity,
  type StakingDeploymentConfig,
} from "@/staking/core/types"

function issue(
  code: string,
  message: string,
  severity: DeploymentValidationSeverity = "error",
  deploymentId?: string
): DeploymentValidationIssue {
  return deploymentId !== undefined
    ? { code, message, severity, deploymentId }
    : { code, message, severity }
}

function fail(...issues: DeploymentValidationIssue[]): DeploymentValidationResult {
  return { ok: false, issues }
}

export function mergeDeploymentValidationResults(
  ...results: DeploymentValidationResult[]
): DeploymentValidationResult {
  const issues: DeploymentValidationIssue[] = []
  for (const r of results) {
    if (!r.ok) issues.push(...r.issues)
  }
  return issues.length > 0 ? { ok: false, issues } : { ok: true }
}

function isKnownChainFamily(value: string): value is ChainFamily {
  return (CHAIN_FAMILIES as readonly string[]).includes(value)
}

/**
 * Ensures `chainFamily` is one of the known union values (guards future JSON / config drift).
 */
export function validateDeploymentFamily(
  deployment: StakingDeploymentConfig
): DeploymentValidationResult {
  if (!isKnownChainFamily(deployment.chainFamily)) {
    return fail(
      issue("unknown_chain_family", "chainFamily must be evm or tron", "error", deployment.id)
    )
  }
  return { ok: true }
}

/**
 * Structural CAIP-2 checks + family/namespace consistency (no RPC probes).
 *
 * - **EVM:** `caip2` must parse as `eip155:{decimalChainId}`.
 * - **Tron:** must not use an `eip155:` network id; must have a `namespace:reference` shape.
 *   Stricter **`tron:`** namespace + vault rules live in **`validateTronDeployment.ts`** (registry ingestion).
 */
export function validateDeploymentCaip2(
  deployment: StakingDeploymentConfig
): DeploymentValidationResult {
  const caip2 = deployment.caip2?.trim() ?? ""
  if (!caip2) {
    return fail(issue("caip2_empty", "caip2 must be a non-empty CAIP-2 network id", "error", deployment.id))
  }

  if (isEvmDeployment(deployment)) {
    if (tryParseEvmChainIdFromCaip2(caip2) === null) {
      return fail(
        issue(
          "evm_caip2_invalid",
          "EVM deployments require caip2 in the form eip155:<decimalChainId>",
          "error",
          deployment.id,
        ),
      )
    }
    return { ok: true }
  }

  if (/^eip155:/i.test(caip2)) {
    return fail(
      issue(
        "tron_caip2_eip155",
        "Tron deployments must not use an eip155 CAIP-2 network id for chainFamily tron",
        "error",
        deployment.id,
      ),
    )
  }

  if (tryParseCaip2Parts(caip2) === null) {
    return fail(
      issue("caip2_malformed", "caip2 must contain a namespace:reference pair", "error", deployment.id)
    )
  }

  return { ok: true }
}

/**
 * Validates a deployment row that is intended to use **ethers** JSON-RPC + hex vault addresses
 * (today’s legacy staking stack). Non-EVM rows fail here by design — they need a different runtime.
 */
export function validateEvmDeploymentCompatibility(
  deployment: StakingDeploymentConfig
): DeploymentValidationResult {
  const issues: DeploymentValidationIssue[] = []

  if (!isEvmDeployment(deployment)) {
    issues.push(
      issue("not_evm_family", "EVM compatibility requires chainFamily evm", "error", deployment.id)
    )
  }

  const fam = validateDeploymentFamily(deployment)
  if (!fam.ok) issues.push(...fam.issues)

  const caip = validateDeploymentCaip2(deployment)
  if (!caip.ok) issues.push(...caip.issues)

  const http = deployment.rpc?.http?.trim() ?? ""
  if (!http) {
    issues.push(
      issue(
        "rpc_http_empty",
        "EVM deployment requires a non-empty rpc.http URL",
        "error",
        deployment.id,
      ),
    )
  }

  const vault = deployment.vault?.address?.trim() ?? ""
  if (!vault || !isAddress(vault)) {
    issues.push(
      issue(
        "vault_address_invalid_evm",
        "EVM deployment requires an 0x-prefixed checksummable vault address",
        "error",
        deployment.id,
      ),
    )
  }

  const token = deployment.token?.address?.trim() ?? ""
  if (!token || !isAddress(token)) {
    issues.push(
      issue(
        "token_address_invalid_evm",
        "EVM deployment requires an 0x-prefixed checksummable token.address",
        "error",
        deployment.id,
      ),
    )
  }

  return issues.length > 0 ? fail(...issues) : { ok: true }
}
