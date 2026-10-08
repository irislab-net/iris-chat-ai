import { tryParseCaip2Parts } from "@/staking/core/providerRuntime"
import type { ChainFamily, StakingDeploymentConfig } from "@/staking/core/types"

/**
 * Canonical deployment shape **before** registry / provider usage (Phase 15).
 *
 * **Why normalize first:** provider runtime keys (`deriveProviderRuntimeKey`) and validators assume
 * stable trimming and CAIP-2 namespace casing; mixed whitespace or `EIP155:1` must not fork cache keys.
 *
 * **Soft vs strict:** normalization is mechanical only — invalid `chainFamily` strings are trimmed but
 * not coerced to a fake union value; `validateDeployment.ts` / `registryValidation.ts` still decide validity.
 *
 * **Addresses:** vault is **trim-only** — no global checksum/lowercase (Tron-safe future).
 *
 * **Optional DEV freeze** was omitted: freezing rows can break legitimate test mutations / HMR.
 */
export function trimDeploymentExplorerBase(url: string): string {
  return url.trim().replace(/\/$/, "")
}

function normalizeCaip2(caip2: string): string {
  const t = caip2.trim()
  const parts = tryParseCaip2Parts(t)
  if (!parts) return t
  return `${parts.namespace}:${parts.reference}`
}

function normalizeChainFamilyValue(value: string): ChainFamily {
  const raw = value.trim()
  const lo = raw.toLowerCase()
  if (lo === "evm" || lo === "tron") return lo
  return raw as ChainFamily
}

export function normalizeDeployment(deployment: StakingDeploymentConfig): StakingDeploymentConfig {
  const id = deployment.id.trim()
  const chainFamily = normalizeChainFamilyValue(String(deployment.chainFamily))
  const caip2 = normalizeCaip2(deployment.caip2)
  const http = deployment.rpc.http.trim()
  const wsRaw = deployment.rpc.ws?.trim()
  const ws = wsRaw && wsRaw.length > 0 ? wsRaw : null
  const explorerBaseUrl = trimDeploymentExplorerBase(deployment.explorer.baseUrl)
  const explorerLabel = deployment.explorer.label.trim()
  const networkLabel = deployment.labels.network.trim()
  const vaultAddress = deployment.vault.address.trim()
  const tokenAddress = deployment.token.address.trim()

  return {
    id,
    chainFamily,
    caip2,
    vault: { address: vaultAddress },
    token: { address: tokenAddress },
    rpc: { http, ws },
    explorer: { baseUrl: explorerBaseUrl, label: explorerLabel },
    labels: { network: networkLabel },
  }
}
