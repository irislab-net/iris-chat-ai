/**
 * Shared `Skeleton` sizing for staking fee rows so placeholders match real
 * `~0.00000000 ETH ($99.99)`-style lines and avoid layout shift.
 */
export const STAKING_ETH_FEE_VALUE_SKELETON =
  "h-4 w-[min(100%,9.5rem)] max-w-full shrink-0 rounded-md"

/** Vault protocol fee line (~`12.34 MUSDC`). */
export const STAKING_TOKEN_FEE_VALUE_SKELETON =
  "h-4 w-[min(100%,10rem)] max-w-full shrink-0 rounded-md"

/** Deposit/withdraw action summary — fee value shimmer (compact, ~10px cap). */
export const STAKING_SUMMARY_FEE_VALUE_SKELETON =
  "h-2.5 w-[min(100%,6.75rem)] max-w-[72%] shrink-0 rounded-sm motion-reduce:animate-none"

/** Receive / profit value shimmer in summary stack (slightly shorter bar). */
export const STAKING_SUMMARY_INLINE_VALUE_SKELETON =
  "h-2.5 w-[min(100%,5rem)] max-w-[52%] shrink-0 rounded-sm motion-reduce:animate-none"
