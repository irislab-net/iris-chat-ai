/**
 * CFG2+ — static display / product invariants for staking (not chain-authoritative).
 * Prefer on-chain token metadata where available; these are presentation fallbacks only.
 *
 * EVM network/explorer **names** live in `stakingEthConfig` / `stakingTronConfig` (chain-keyed or fixed).
 */

/** Reown / WalletConnect `metadata.name` (product copy; not deployment-bound). */
export const APP_METADATA_NAME = "Matrix" as const

/** Reown / WalletConnect `metadata.description` (product copy; not deployment-bound). */
export const APP_METADATA_DESCRIPTION = "Connect your wallet to use Matrix." as const

/** Default pool stable reference label when vault metadata is absent. */
export const STAKING_DEFAULT_STABLECOIN_LABEL = "USDC" as const

/** Referral deep-link persistence (product-localStorage key; not deployment-bound). */
export const STAKING_REFERRAL_STORAGE_KEY = "matrix_staking_referral_address" as const

export const STAKING_REFERRAL_QUERY_KEYS = ["ref", "affiliate"] as const

/**
 * Merchant PnL presentation: USD credited per 1 pool token unit (business/display invariant).
 */
export const STAKING_PNL_USD_PER_TOKEN = 1 as const
