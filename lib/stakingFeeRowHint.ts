export type StakingFeeHintTone = "amber" | "neutral"

export type StakingFeeHint = {
  text: string | null
  tone: StakingFeeHintTone
}

/**
 * Row-2 hints only for actionable fee signals (never loading copy).
 * Gas sufficiency is shown on the primary fee value + CTA reason, not here.
 */
export function deriveStakingFeeHint(input: {
  hasEstimate: boolean
  estimateSuccess: boolean
  isEstimating: boolean
  isRevalidating: boolean
  gasUiActive: boolean
  gasAmountValid: boolean
  nearZeroEth: boolean
  insufficientNative: boolean
  feeSpikeWarning: boolean
  highCongestionWarning: boolean
}): StakingFeeHint {
  const { feeSpikeWarning, highCongestionWarning } = input

  if (feeSpikeWarning) {
    return { text: "Fee increased", tone: "amber" }
  }
  if (highCongestionWarning) {
    return { text: "High network congestion", tone: "amber" }
  }

  return { text: null, tone: "neutral" }
}
