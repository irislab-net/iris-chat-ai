/**
 * Staking explorer URL helpers (EVM, single configured chain).
 *
 * ## Assumptions (audit — Phase 7)
 *
 * - **`chainId` is numeric EIP-155** and compared to `STAKING_CHAIN_ID` from env.
 * - **Explorer layout** is EVM-style: `/address/{addr}` and `/tx/{hash}` under `STAKING_EXPLORER_BASE_URL`.
 * - **Unknown `chainId`:** `stakingExplorerBaseUrl` returns `undefined`; callers get `"Block explorer"` label fallback.
 * - **Multi-deployment / Tron:** not represented here yet — persisted-tx reconcile uses
 *   `createEvmExplorerResolver(deployment)` from `@/staking/core/createExplorerResolver` for deployment-scoped URLs.
 *   These helpers remain for general UI callers keyed by numeric `chainId`.
 */
import {
  STAKING_CHAIN_ID,
  STAKING_EXPLORER_BASE_URL,
  STAKING_EXPLORER_LABEL,
} from "@/constants/stakingVaultConfig"

export function stakingExplorerBaseUrl(chainId: number): string | undefined {
  if (chainId !== STAKING_CHAIN_ID) return undefined
  return STAKING_EXPLORER_BASE_URL
}

export function stakingAddressExplorerUrlForChain(
  chainId: number,
  address: string
): string | undefined {
  const base = stakingExplorerBaseUrl(chainId)
  if (!base) return undefined
  return `${base}/address/${encodeURIComponent(address)}`
}

export function stakingTransactionExplorerUrlForChain(
  chainId: number,
  txHash: string
): string | undefined {
  const base = stakingExplorerBaseUrl(chainId)
  if (!base) return undefined
  return `${base}/tx/${encodeURIComponent(txHash)}`
}

export function stakingExplorerLabelForChain(chainId: number): string {
  if (chainId !== STAKING_CHAIN_ID) return "Block explorer"
  return STAKING_EXPLORER_LABEL
}
