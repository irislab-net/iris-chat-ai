import type { StakingDeploymentConfig } from "@/staking/core/types"

/** Per-deployment explorer URLs (EVM `/tx/`; Tronscan-style `/#/transaction/`). */
export interface ExplorerResolver {
  transactionUrl(txHash: string): string | null
  addressUrl(address: string): string | null
}

function normalizeExplorerBase(baseUrl: string): string {
  return baseUrl.trim().replace(/\/$/, "")
}

/**
 * Resolver from deployment registry row (EVM + Tron path conventions).
 */
export function createDeploymentExplorerResolver(
  deployment: StakingDeploymentConfig
): ExplorerResolver {
  const base = normalizeExplorerBase(deployment.explorer.baseUrl)
  const tron = deployment.chainFamily === "tron"
  return {
    transactionUrl(txHash: string): string | null {
      if (!base) return null
      const h = txHash.trim()
      if (!h) return null
      if (tron) {
        const tid =
          h.startsWith("0x") || h.startsWith("0X") ? h.slice(2) : h
        return `${base}/#/transaction/${encodeURIComponent(tid)}`
      }
      return `${base}/tx/${encodeURIComponent(h)}`
    },
    addressUrl(address: string): string | null {
      if (!base) return null
      const a = address.trim()
      if (!a) return null
      if (tron) {
        return `${base}/#/address/${encodeURIComponent(a)}`
      }
      return `${base}/address/${encodeURIComponent(a)}`
    },
  }
}

/**
 * EVM explorer resolver for a single deployment config.
 * @deprecated Prefer {@link createDeploymentExplorerResolver} (same behavior for `chainFamily === "evm"`).
 */
export function createEvmExplorerResolver(
  deployment: StakingDeploymentConfig
): ExplorerResolver {
  return createDeploymentExplorerResolver(deployment)
}
