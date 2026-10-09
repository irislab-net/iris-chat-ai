/**
 * CFG2 — shared types for staking canonical config (static / display / invariants).
 * Deployment-bound secrets and URLs stay in `@/config/env`.
 */

export type StakingEvmChainFamily = "evm"
export type StakingTronChainFamily = "tron"

/** Viem / AppKit native currency row for legacy-primary EVM (`defineChain`). */
export type LegacyEvmNativeCurrency = Readonly<{
  name: string
  symbol: string
  decimals: number
}>
