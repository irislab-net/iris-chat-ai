/**
 * CFG2 — ETH / EVM staking metadata (typed, runtime-invariant).
 * RPC, vault, explorer **base URLs**, and chain ids remain in `@/config/env`.
 */
import type { LegacyEvmNativeCurrency, StakingEvmChainFamily } from "@/staking/config/stakingConfigTypes"

/** Runtime CAIP family tag for explicit + legacy EVM deployment rows. */
export const STAKING_ETH_CHAIN_FAMILY: StakingEvmChainFamily = "evm"

/** Prefix for EVM CAIP-2 network ids (`eip155:{chainId}`). */
export const STAKING_ETH_CAIP2_PREFIX = "eip155:" as const

/**
 * Native currency metadata for `STAKING_APPKIT_NETWORK` (legacy EVM row).
 * Single canonical copy — use for viem `defineChain` and fee copy.
 */
export const LEGACY_EVM_NATIVE_CURRENCY: LegacyEvmNativeCurrency = Object.freeze({
  name: "Ether",
  symbol: "ETH",
  decimals: 18,
})

/** Legacy-primary EVM row: network chip / AppKit name (was `VITE_STAKING_*_NETWORK_LABEL`). */
export function stakingEvmNetworkDisplayName(chainId: number): string {
  if (chainId === 11155111) return "Sepolia"
  return "Ethereum"
}

/**
 * Legacy-primary + explicit env EVM row: block explorer **brand** (was `VITE_STAKING_*_EXPLORER_LABEL`).
 * Product defaults for supported deploys; extend map when adding chains.
 */
export function stakingEvmExplorerDisplayName(chainId: number): string {
  if (chainId === 11155111) return "Sepolia Etherscan"
  return "Etherscan"
}

/**
 * Chainlink ETH/USD fee presentation poll interval (ms).
 * Formerly optional `VITE_ETH_USD_CACHE_TTL_MS` (default branch only — no env knob).
 */
export const STAKING_ETH_USD_CACHE_POLL_TTL_MS = 60_000 as const

export function readEthUsdCachePollTtlMs(): number {
  return STAKING_ETH_USD_CACHE_POLL_TTL_MS
}

/**
 * Feed staleness threshold seconds (Chainlink `updatedAt` age).
 * Formerly optional `VITE_ETH_USD_FEED_STALE_AFTER_SEC` (default branch only).
 */
export function getEthUsdFeedStaleThresholdSec(): bigint {
  return 7200n
}
