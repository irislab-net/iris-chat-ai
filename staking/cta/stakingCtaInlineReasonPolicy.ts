import { STAKING_CTA_MESSAGE_CALCULATING_NETWORK_FEE } from "@/constants/stakingCtaMessages"
import {
  STAKING_CTA_HINT_APPROVE,
  STAKING_CTA_HINT_CANCELLED,
  STAKING_CTA_HINT_CONFIRMING,
  STAKING_CTA_HINT_CONFIRM_STAKE,
  STAKING_CTA_HINT_CONFIRM_UNSTAKE,
  STAKING_CTA_HINT_CONFIRM_WALLET,
  STAKING_CTA_HINT_CONNECTING,
  STAKING_CTA_HINT_DONE,
  STAKING_CTA_HINT_FAILED,
  STAKING_CTA_HINT_FINALIZING,
  STAKING_CTA_HINT_PREPARING_TX,
  STAKING_CTA_HINT_REVIEW,
  STAKING_CTA_HINT_SUBMITTED,
  STAKING_CTA_HINT_SYNC_BALANCE,
  STAKING_CTA_HINT_VAULT,
} from "@/constants/stakingCtaShortLabels"
import type { StakingCtaReasonModel } from "@/types/stakingCtaReason"

/**
 * `reason.message` values that only echo async work already shown on the primary CTA.
 * The inline row is reserved for validation, warnings, terms, wallet nudges, and RPC/gas.
 */
const CTA_OWNED_ASYNC_REASON_MESSAGES: ReadonlySet<string> = new Set([
  STAKING_CTA_MESSAGE_CALCULATING_NETWORK_FEE,
  STAKING_CTA_HINT_VAULT,
  STAKING_CTA_HINT_SYNC_BALANCE,
  STAKING_CTA_HINT_CONNECTING,
  STAKING_CTA_HINT_CONFIRM_WALLET,
  STAKING_CTA_HINT_REVIEW,
  STAKING_CTA_HINT_PREPARING_TX,
  STAKING_CTA_HINT_APPROVE,
  STAKING_CTA_HINT_CONFIRM_STAKE,
  STAKING_CTA_HINT_CONFIRM_UNSTAKE,
  STAKING_CTA_HINT_FINALIZING,
  STAKING_CTA_HINT_SUBMITTED,
  STAKING_CTA_HINT_CONFIRMING,
  STAKING_CTA_HINT_DONE,
  STAKING_CTA_HINT_CANCELLED,
  STAKING_CTA_HINT_FAILED,
])

/**
 * When true, `selectStakingInlineCtaReason` should not surface `cta.reason` — the button
 * already carries the same async / in-flight story.
 */
export function isStakingCtaAsyncStatusEchoReason(
  reason: StakingCtaReasonModel | null
): boolean {
  if (reason == null) return false
  return CTA_OWNED_ASYNC_REASON_MESSAGES.has(reason.message)
}
