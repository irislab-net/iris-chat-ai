import {
  STAKING_CTA_LABEL_CALCULATING,
  STAKING_CTA_READY_REASON_DEPOSIT,
  STAKING_CTA_READY_REASON_WITHDRAW,
} from "@/constants/stakingCtaShortLabels"

/** CTA state machine copy — keep literals here so UI suppression stays in sync. */
export const STAKING_CTA_MESSAGE_READY_TO_STAKE = STAKING_CTA_READY_REASON_DEPOSIT
export const STAKING_CTA_MESSAGE_READY_TO_WITHDRAW =
  STAKING_CTA_READY_REASON_WITHDRAW
export const STAKING_CTA_MESSAGE_CALCULATING_NETWORK_FEE =
  STAKING_CTA_LABEL_CALCULATING

/**
 * Deposit form hides these under the primary CTA — they duplicate calmer fee-row /
 * button states (see StakingAppDepositForm).
 */
export const STAKING_DEPOSIT_CTA_REASON_UI_SUPPRESSED = new Set<string>([
  STAKING_CTA_MESSAGE_READY_TO_STAKE,
  STAKING_CTA_MESSAGE_CALCULATING_NETWORK_FEE,
])

/** Withdraw form: hide idle copy; status is implied by the enabled CTA. */
export const STAKING_WITHDRAW_CTA_REASON_UI_SUPPRESSED = new Set<string>([
  STAKING_CTA_MESSAGE_READY_TO_WITHDRAW,
])
