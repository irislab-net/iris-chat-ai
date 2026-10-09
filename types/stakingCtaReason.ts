export type StakingCtaReasonTone = "red" | "amber" | "neutral"

export type StakingCtaReasonModel = {
  message: string
  tone: StakingCtaReasonTone
  hint?: string
}
