/**
 * CFG2 — Tron chain metadata constants (non-address). RPC / vault / token stay in `@/config/env`.
 */
import type { StakingTronChainFamily } from "@/staking/config/stakingConfigTypes"

export const STAKING_TRON_CHAIN_FAMILY: StakingTronChainFamily = "tron"

/**
 * Fallback CAIP2 for explicit Tron env row when `VITE_STAKING_TRON_CAIP2` is unset.
 * **Must** match pre-CFG2 `buildExplicitEnvDeploymentRows.ts` (`"tron:mainnet"`).
 * Deployments that need Nile/Shasta must set `VITE_STAKING_TRON_CAIP2` in env.
 */
export const EXPLICIT_TRON_ROW_CAIP2_WHEN_ENV_UNSET = "tron:mainnet" as const

/** Explicit env Tron row network label (was `VITE_STAKING_TRON_NETWORK_LABEL`). */
export const EXPLICIT_TRON_ENV_NETWORK_DISPLAY_NAME = "TRON" as const

/** Explicit env Tron row explorer brand (was `VITE_STAKING_TRON_EXPLORER_LABEL`). */
export const EXPLICIT_TRON_ENV_EXPLORER_DISPLAY_NAME = "Tronscan" as const
