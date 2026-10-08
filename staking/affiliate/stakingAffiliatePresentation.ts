// Phase D2b extracted affiliate/pnl derivations

import {
  capPlainDecimalFractionDigits,
  formatPlainApiAmount,
} from "@/lib/plainDecimalAmount"
import { formatUnits, parseUnits } from "ethers"

/** Max positive cost basis (human units) for settled-residual ROI hiding only. */
export const SETTLED_RESIDUAL_BASIS_MAX_HUMAN = "0.1"

export const RESIDUAL_DUST_ABS_HUMAN = "0.02"
export const RESIDUAL_DUST_RATIO_CAP_HUMAN = "0.05"

export type StakingPnlDirection = "positive" | "negative" | "neutral"

/** Signed cost basis / PnL wei → float (display path). */
export function signedWeiToTokenFloat(value: bigint, tokenDecimals: number): number {
  try {
    const n = parseFloat(formatUnits(value, tokenDecimals))
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

export type SelectPnlTokenFloatInput = Readonly<{
  stakingPnlWei: bigint | null
  tokenDecimals: number | null
}>

export function selectPnlTokenFloat(input: SelectPnlTokenFloatInput): number | null {
  if (input.tokenDecimals === null || input.stakingPnlWei === null) return null
  try {
    const n = parseFloat(formatUnits(input.stakingPnlWei, input.tokenDecimals))
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export type SelectCostBasisTokenFloatInput = Readonly<{
  stakingNetPrincipalWei: bigint | null
  tokenDecimals: number | null
}>

export function selectCostBasisTokenFloat(input: SelectCostBasisTokenFloatInput): number | null {
  if (input.tokenDecimals === null || input.stakingNetPrincipalWei === null) return null
  return signedWeiToTokenFloat(input.stakingNetPrincipalWei, input.tokenDecimals)
}

/** Gain/loss hue from token PnL wei only; ROI does not influence direction. */
export function getStakingPnlDirectionFromWei(
  pnlWei: bigint,
  neutralAbsWei: bigint
): StakingPnlDirection {
  const abs = pnlWei < 0n ? -pnlWei : pnlWei
  if (abs <= neutralAbsWei) return "neutral"
  if (pnlWei > 0n) return "positive"
  return "negative"
}

export function normalizeSignedZeroDisplay(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (Object.is(n, -0) || n === 0) return 0
  const a = Math.abs(n)
  if (a < 1e-20) return 0
  return n
}

export function formatRoiPercentDisplay(roi: number): string {
  const r = normalizeSignedZeroDisplay(roi)
  if (r === 0) return "0.00%"
  if (r > 0) return `+${r.toFixed(2)}%`
  return `${r.toFixed(2)}%`
}

export type SelectStakingRoiPercentInput = Readonly<{
  stakingNetPrincipalWei: bigint
  stakingPnlWei: bigint
  pnlHuman: number
  basisHuman: number
  direction: StakingPnlDirection
  settledResidual: boolean
  residualDust: boolean
}>

/**
 * Display-only ROI % string; empty when basis is not meaningful (settled residual, dust, non-positive basis).
 */
export function selectStakingRoiPercent(input: SelectStakingRoiPercentInput): string {
  if (input.settledResidual) return ""
  if (input.residualDust) return ""
  if (input.stakingNetPrincipalWei <= 0n) return ""
  if (input.direction === "neutral") return "0.00%"

  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER)
  const absBasis =
    input.stakingNetPrincipalWei < 0n
      ? -input.stakingNetPrincipalWei
      : input.stakingNetPrincipalWei
  const roi =
    absBasis > 0n &&
    absBasis <= maxSafe &&
    input.stakingPnlWei <= maxSafe &&
    input.stakingPnlWei >= -maxSafe
      ? (Number(input.stakingPnlWei) / Number(input.stakingNetPrincipalWei)) * 100
      : (input.pnlHuman / input.basisHuman) * 100

  return Number.isFinite(roi) && Math.abs(roi) < 1e15 ? formatRoiPercentDisplay(roi) : ""
}

/** UX-only: near-settled dust; does not alter `stakingPnlWei` or basis semantics. */
export function isResidualDustStakingPosition(
  stakedWei: bigint,
  basisWei: bigint,
  tokenDecimals: number
): boolean {
  if (stakedWei <= 0n || basisWei <= 0n) return false
  try {
    const absDustWei = parseUnits(RESIDUAL_DUST_ABS_HUMAN, tokenDecimals)
    const ratioCapWei = parseUnits(RESIDUAL_DUST_RATIO_CAP_HUMAN, tokenDecimals)
    if (stakedWei <= absDustWei) return true
    if (stakedWei <= ratioCapWei && stakedWei * 10n <= basisWei) return true
    return false
  } catch {
    return false
  }
}

/** Max fractional digits for Rewards summary (Firestore plain decimal). */
export const AFFILIATE_REWARD_SUMMARY_MAX_FRACTION_DIGITS = 6 as const

/**
 * Rewards summary: `$` + plain Firestore decimal (max
 * {@link AFFILIATE_REWARD_SUMMARY_MAX_FRACTION_DIGITS} dp). Not a USD conversion.
 */
export function formatAffiliateRewardSummaryDisplay(rewardRaw: unknown): string {
  const amount = capPlainDecimalFractionDigits(
    formatPlainApiAmount(rewardRaw) ?? "0",
    AFFILIATE_REWARD_SUMMARY_MAX_FRACTION_DIGITS
  )
  return `$${amount}`
}

export function isSettledResidualPosition(input: {
  stakedWei: bigint
  basisWei: bigint
  tokenDecimals: number
}): boolean {
  const { stakedWei, basisWei, tokenDecimals } = input
  if (stakedWei !== 0n) return false
  if (basisWei <= 0n) return false
  try {
    const maxResidualBasisWei = parseUnits(
      SETTLED_RESIDUAL_BASIS_MAX_HUMAN,
      tokenDecimals
    )
    return basisWei <= maxResidualBasisWei
  } catch {
    return false
  }
}
