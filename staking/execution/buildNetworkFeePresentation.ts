import { formatFeeEtherDisplay } from "@/lib/formatFeeEtherDisplay"

/**
 * Chainlink-derived inputs for USD suffix on the staking network fee line.
 * All math consuming these fields stays in bigint until the final string.
 */
export type EthUsdFeedPresentation =
  | { kind: "none" }
  | {
      kind: "live"
      /** Aggregator `latestRoundData().answer` as non-negative wei-like int. */
      answer: bigint
      /** From `decimals()` — never hardcoded at call sites. */
      feedDecimals: number
      /** True when `updatedAt` is older than configured heartbeat (display-only). */
      stale: boolean
    }

/** Optional display hints (reserved — fee row string unchanged today). */
export type NetworkFeePresentationHints = Readonly<{
  feeSpike?: boolean
  highCongestion?: boolean
}>

export type BuildNetworkFeeDisplayLineInput = Readonly<{
  maxFeeWei: bigint
  ethUsd: EthUsdFeedPresentation
  /** Left label before ": ~… ETH" (default compact "Fee:"). */
  feeTitle?: string
  /** Reserved for future copy; does not alter the fee string today. */
  hints?: NetworkFeePresentationHints
}>

const MICRO_USD_SCALE = 1_000_000n

/**
 * Computes fee ETH value in micro-USD (USD × 1e6, integer truncate toward zero):
 *
 *   microUsd = floor( maxFeeWei × answer × 1e6 / (1e18 × 10^feedDecimals) )
 *
 * `answer` / 10^feedDecimals = USD per 1 ETH (Chainlink convention).
 */
export function computeEthFeeMicroUsd(
  maxFeeWei: bigint,
  answer: bigint,
  feedDecimals: number
): bigint {
  if (maxFeeWei <= 0n || answer <= 0n) return 0n
  if (feedDecimals < 0 || feedDecimals > 36) return 0n
  const denom = 10n ** 18n * 10n ** BigInt(feedDecimals)
  if (denom === 0n) return 0n
  return (maxFeeWei * answer * MICRO_USD_SCALE) / denom
}

/**
 * Formats micro-USD to a parenthetical wallet-friendly string: `($0.42)` or `($0.00)`.
 * Rounding: nearest cent using half-up on micro-USd (ties round up at half cent).
 */
export function formatMicroUsdParen(microUsd: bigint): string {
  if (microUsd <= 0n) return " ($0.00)"
  // Nearest cent: 1 cent = 10_000 micro-USD
  const centsRounded = (microUsd + 5_000n) / 10_000n
  const dollars = centsRounded / 100n
  const cents = centsRounded % 100n
  const centsStr = cents < 10n ? `0${cents}` : `${cents}`
  return ` ($${dollars.toString()}.${centsStr})`
}

/**
 * Single source of truth for the staking gas display line (ETH + optional USD), e.g. `Fee: ~… ETH`.
 * Does not perform RPC — only pure presentation from wei + optional feed snapshot.
 */
export function buildNetworkFeeDisplayLine(input: BuildNetworkFeeDisplayLineInput): string {
  const title = input.feeTitle?.trim() || "Fee"
  const ethStr = formatFeeEtherDisplay(input.maxFeeWei)
  let line = `${title}: ~${ethStr} ETH`
  if (input.ethUsd.kind === "live") {
    const micro = computeEthFeeMicroUsd(
      input.maxFeeWei,
      input.ethUsd.answer,
      input.ethUsd.feedDecimals
    )
    line += formatMicroUsdParen(micro)
  }
  return line
}

/** Placeholder fee line (0 wei) using the same formatter as live estimates. */
export function stakingGasFeeZeroDisplayLine(
  ethUsd: EthUsdFeedPresentation,
  feeTitle = "Fee"
): string {
  return buildNetworkFeeDisplayLine({
    maxFeeWei: 0n,
    ethUsd,
    feeTitle,
  })
}

/** Stable dependency key for React memoization (cheap string, no object identity). */
export function ethUsdPresentationKey(p: EthUsdFeedPresentation): string {
  if (p.kind === "none") return "none"
  return `live:${p.answer.toString()}:${p.feedDecimals}:${p.stale ? 1 : 0}`
}
