/**
 * Neutral CTA contracts for form presentation (no hook imports).
 */

export type StakingCtaActionType = "connect" | "switch" | "submit" | "noop"

/** Minimal CTA fields consumed by inline reason / presentation resolvers. */
export type StakingCtaInlineSnapshot = Readonly<{
  label: string
  actionType: StakingCtaActionType
  disabled: boolean
}>
