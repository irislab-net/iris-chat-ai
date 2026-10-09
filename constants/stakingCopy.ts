/**
 * Single source of truth for USDM staking page copy and allocation numbers.
 * Use these so we do not repeat the same numbers or phrases across the staking page.
 */

/** Protocol reference only, not a return guarantee. */
export const STAKING_APY_TARGET = "Up to 10%"

export const ALLOCATION = {
  rwa: { percentage: 50, label: "Cross-Venue Arbitrage" },
  cex: { percentage: 20, label: "Liquidity Operations" },
  reserve: { percentage: 30, label: "Operational Reserve" },
} as const

/** Short hook for the pool allocation section (main paragraph under the heading). */
export const STRATEGY_SUMMARY =
  "Matrix uses a three-part operating model to balance yield generation, liquidity movement, and reserve coverage."

/** Muted helper below the allocation hook. Not part of the primary pitch. */
export const ALLOCATION_FOOTNOTE =
  "In-app figures can change as conditions update. Your wallet balance may differ from what you see on a single screen."
