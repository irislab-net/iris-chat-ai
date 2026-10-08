import { MaxUint256, parseUnits } from "ethers"

/**
 * Canonical ERC-20 "unlimited" allowance used by this app's vault approvals.
 * Do not treat max allowance as a "downgrade" / over-cap case; it already authorizes all deposits.
 */
export function isUnlimitedErc20Allowance(allowance: bigint): boolean {
  return allowance === MaxUint256
}

/**
 * Threshold for UI: user has approved more than this (human: 1_000_000 whole tokens)
 * and may want to switch to limited / downgrade. **Not** used as an on-chain approve target.
 */
export function maxLimitedApprovalWei(decimals: number): bigint {
  return parseUnits("1000000", decimals)
}

export function allowanceExceedsLimitedCap(
  allowance: bigint,
  decimals: number
): boolean {
  if (isUnlimitedErc20Allowance(allowance)) return false
  return allowance > maxLimitedApprovalWei(decimals)
}
