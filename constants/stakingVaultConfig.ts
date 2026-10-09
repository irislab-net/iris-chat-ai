import {
  STAKING_CHAIN_ID,
  STAKING_EXPLORER_BASE_URL,
  STAKING_EXPLORER_LABEL,
  STAKING_NETWORK_LABEL,
  STAKING_RPC_HTTP_URL,
  STAKING_RPC_WS_URL,
  STAKING_TX_HISTORY_ORIGIN,
  STAKING_VAULT_ADDRESS,
} from "@/config/env"
import {
  STAKING_DEFAULT_STABLECOIN_LABEL,
  STAKING_PNL_USD_PER_TOKEN,
  STAKING_REFERRAL_QUERY_KEYS,
  STAKING_REFERRAL_STORAGE_KEY,
} from "@/staking/config/stakingUiConfig"
import { LEGACY_EVM_NATIVE_CURRENCY } from "@/staking/config/stakingEthConfig"
import { getAddress, isAddress } from "ethers"
import { defineChain } from "viem"

export {
  STAKING_CHAIN_ID,
  STAKING_EXPLORER_BASE_URL,
  STAKING_EXPLORER_LABEL,
  STAKING_NETWORK_LABEL,
  STAKING_RPC_HTTP_URL,
  STAKING_RPC_WS_URL,
  STAKING_VAULT_ADDRESS,
}

export const STAKING_WALLET_CONNECT_PHRASE = STAKING_NETWORK_LABEL

export const STAKING_APPKIT_NETWORK = defineChain({
  id: STAKING_CHAIN_ID,
  name: STAKING_NETWORK_LABEL,
  nativeCurrency: { ...LEGACY_EVM_NATIVE_CURRENCY },
  rpcUrls: {
    default: { http: [STAKING_RPC_HTTP_URL] },
  },
  blockExplorers: {
    default: {
      name: STAKING_EXPLORER_LABEL,
      url: STAKING_EXPLORER_BASE_URL,
    },
  },
})

export function stakingAddressExplorerUrl(address: string): string {
  return `${STAKING_EXPLORER_BASE_URL}/address/${encodeURIComponent(address)}`
}

export function stakingTransactionExplorerUrl(txHash: string): string {
  return `${STAKING_EXPLORER_BASE_URL}/tx/${encodeURIComponent(txHash)}`
}

/** Collapse `https://host/?q` → `https://host?q` (default `/` before `?` breaks some APIs). */
function stripRedundantSlashBeforeQuery(href: string): string {
  return href.replace(/^(https?:\/\/[^/?#]+)\/\?/, "$1?")
}

/**
 * Unified staking tx-history API URL (`type=transactions` | `type=affiliate`).
 * Sets `token` to the pool vault and `address` to the connected wallet (checksummed).
 * When `poolVaultAddress` is a valid EVM address, it is used (active deployment); otherwise
 * `VITE_STAKING_VAULT_ADDRESS` (legacy-primary env).
 * Returns null when origin env is unset or wallet address invalid.
 */
export function stakingTxHistoryUrl(
  walletAddress: string,
  type: "transactions" | "affiliate",
  poolVaultAddress?: string | null
): string | null {
  if (!STAKING_TX_HISTORY_ORIGIN) return null
  const raw = walletAddress.trim()
  if (!raw || !isAddress(raw)) return null
  const vaultRaw = poolVaultAddress?.trim() ?? ""
  const tokenParam =
    vaultRaw && isAddress(vaultRaw) ? getAddress(vaultRaw) : getAddress(STAKING_VAULT_ADDRESS)
  const url = new URL(STAKING_TX_HISTORY_ORIGIN)
  url.searchParams.set("token", tokenParam)
  url.searchParams.set("address", getAddress(raw))
  url.searchParams.set("type", type)
  const pathOnlyRoot = url.pathname === "/" || url.pathname === ""
  const href = pathOnlyRoot
    ? `${url.origin}${url.search}`
    : `${url.origin}${url.pathname}${url.search}`
  return stripRedundantSlashBeforeQuery(href)
}

export const REFERRAL_STORAGE_KEY = STAKING_REFERRAL_STORAGE_KEY

export const REFERRAL_QUERY_KEYS = STAKING_REFERRAL_QUERY_KEYS

export const STAKING_STABLECOIN_LABEL = STAKING_DEFAULT_STABLECOIN_LABEL

export { STAKING_PNL_USD_PER_TOKEN }
