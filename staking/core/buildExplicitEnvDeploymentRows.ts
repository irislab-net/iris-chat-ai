import {
  STAKING_TRON_CAIP2,
  STAKING_TRON_EXPLORER_BASE_URL,
  STAKING_TRON_RPC_HTTP_URL,
  STAKING_TRON_TOKEN_ADDRESS,
  STAKING_TRON_VAULT_ADDRESS,
} from "@/config/env"
import {
  EXPLICIT_TRON_ENV_EXPLORER_DISPLAY_NAME,
  EXPLICIT_TRON_ENV_NETWORK_DISPLAY_NAME,
  EXPLICIT_TRON_ROW_CAIP2_WHEN_ENV_UNSET,
  STAKING_TRON_CHAIN_FAMILY,
} from "@/staking/config/stakingTronConfig"
import { normalizeDeployment } from "@/staking/core/normalizeDeployment"
import {
  EXPLICIT_ENV_TRON_DEPLOYMENT_ID,
  type StakingDeploymentConfig,
} from "@/staking/core/types"

/**
 * Optional Phase 46 Tron sibling row from `NEXT_PUBLIC_STAKING_TRON_*` / `VITE_STAKING_TRON_*`.
 * Returns normalized rows (0 or 1). Empty when vault/token/rpc incomplete.
 */
export function collectExplicitEnvNormalizedDeployments(
  ingestNotes: string[]
): StakingDeploymentConfig[] {
  const vault = STAKING_TRON_VAULT_ADDRESS?.trim() ?? ""
  const token = STAKING_TRON_TOKEN_ADDRESS?.trim() ?? ""
  const rpc = STAKING_TRON_RPC_HTTP_URL?.trim() ?? ""

  if (!vault && !token && !rpc) {
    return []
  }

  if (!vault || !token || !rpc) {
    ingestNotes.push(
      "skipped explicit Tron env row: require STAKING_TRON_VAULT_ADDRESS, STAKING_TRON_TOKEN_ADDRESS, and STAKING_TRON_RPC_HTTP_URL"
    )
    return []
  }

  const caip2 =
    (STAKING_TRON_CAIP2?.trim() || EXPLICIT_TRON_ROW_CAIP2_WHEN_ENV_UNSET).trim()
  const explorerBase =
    (STAKING_TRON_EXPLORER_BASE_URL?.trim() || "https://tronscan.org").trim()

  const row = normalizeDeployment({
    id: EXPLICIT_ENV_TRON_DEPLOYMENT_ID,
    chainFamily: STAKING_TRON_CHAIN_FAMILY,
    caip2,
    vault: { address: vault },
    token: { address: token },
    rpc: { http: rpc, ws: null },
    explorer: {
      baseUrl: explorerBase,
      label: EXPLICIT_TRON_ENV_EXPLORER_DISPLAY_NAME,
    },
    labels: { network: EXPLICIT_TRON_ENV_NETWORK_DISPLAY_NAME },
  })

  ingestNotes.push(`ingested explicit Tron env row "${row.id}" (${row.caip2})`)
  return [row]
}
