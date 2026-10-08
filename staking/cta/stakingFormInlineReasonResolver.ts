import {
  STAKING_CTA_LABEL_CALCULATING,
  STAKING_CTA_LABEL_ERROR,
  STAKING_CTA_LABEL_INVALID_AMOUNT,
  STAKING_CTA_LABEL_LOADING,
  STAKING_CTA_LABEL_NO_BALANCE,
  STAKING_CTA_LABEL_NO_ETH,
  STAKING_CTA_LABEL_TOO_LOW,
} from "@/constants/stakingCtaShortLabels"
import { getStakingCtaReasonDisplayLine } from "@/staking/cta/stakingCtaEllipsisPolicy"
import type { StakingCtaInlineSnapshot } from "@/staking/cta/types/stakingCtaContracts"
import type { StakingCtaReasonModel } from "@/types/stakingCtaReason"

/**
 * Phase 1 presentation keys for analytics / future toast gating (not user-visible).
 */
export type StakingFormPresentationReasonKey =
  | "none"
  | `line:${string}`

export type StakingFormInlinePresentationInput = Readonly<{
  scenario: "deposit" | "withdraw"
  /** Output of `selectStakingInlineCtaReason` (unchanged). */
  inlineCtaReason: StakingCtaReasonModel | null
  /** Per-form UI suppression for the reserved line (existing sets). */
  suppressedReasonMessages: ReadonlySet<string>
  cta: StakingCtaInlineSnapshot
}>

export type StakingFormInlinePresentation = Readonly<{
  reasonKey: StakingFormPresentationReasonKey
  lineText: string
  /** Model for `StakingCtaReason` (tone preserved); null keeps the slot visually empty. */
  lineReason: StakingCtaReasonModel | null
  shouldShowLine: boolean
  /** When true, pass `defaultSubmitLabel` into `getStakingPrimaryLabel` instead of `cta.label`. */
  ctaPreferVerb: boolean
  /** Phase 1: reserved for toast dedupe; always null. */
  suppressToastForReasonKey: string | null
  /** Phase 1: reserved for fee-row dedupe; always false (fee row unchanged). */
  suppressDuplicateFeeText: boolean
}>

const NOOP_LABELS_DEFER_TO_VERB: ReadonlySet<string> = new Set([
  STAKING_CTA_LABEL_INVALID_AMOUNT,
  STAKING_CTA_LABEL_TOO_LOW,
  STAKING_CTA_LABEL_NO_BALANCE,
  STAKING_CTA_LABEL_NO_ETH,
  STAKING_CTA_LABEL_CALCULATING,
  STAKING_CTA_LABEL_LOADING,
  STAKING_CTA_LABEL_ERROR,
])

function ctaLabelDuplicatesReservedLine(
  ctaLabel: string,
  reserved: StakingCtaReasonModel
): boolean {
  const msg = reserved.message.trim()
  const hint = reserved.hint?.trim()
  const lineCompact = hint ? `${msg} — ${hint}` : msg
  if (ctaLabel === msg || ctaLabel === lineCompact) return true
  if (ctaLabel === STAKING_CTA_LABEL_NO_ETH && msg === STAKING_CTA_LABEL_NO_ETH) {
    return true
  }
  return false
}

function deriveReasonKey(
  scenario: "deposit" | "withdraw",
  lineReason: StakingCtaReasonModel | null
): StakingFormPresentationReasonKey {
  if (lineReason) {
    return `line:${scenario}:${lineReason.message}`
  }
  return "none"
}

/**
 * Pure resolver: maps existing inline reason + CTA snapshot to reserved-line
 * authority and optional CTA verb substitution (Phase 1 dedupe).
 */
export function resolveStakingFormInlinePresentation(
  input: StakingFormInlinePresentationInput
): StakingFormInlinePresentation {
  const { scenario, inlineCtaReason, suppressedReasonMessages, cta } = input

  const lineReason =
    inlineCtaReason != null &&
    !suppressedReasonMessages.has(inlineCtaReason.message)
      ? inlineCtaReason
      : null

  const lineText = getStakingCtaReasonDisplayLine(lineReason).trim()
  const shouldShowLine = lineReason !== null

  const duplicateVerbNarrative =
    shouldShowLine &&
    cta.actionType === "noop" &&
    ctaLabelDuplicatesReservedLine(cta.label, lineReason)

  const noopDeferLabel =
    shouldShowLine &&
    cta.actionType === "noop" &&
    NOOP_LABELS_DEFER_TO_VERB.has(cta.label)

  const ctaPreferVerb = duplicateVerbNarrative || noopDeferLabel

  return {
    reasonKey: deriveReasonKey(scenario, lineReason),
    lineText,
    lineReason,
    shouldShowLine,
    ctaPreferVerb,
    suppressToastForReasonKey: null,
    suppressDuplicateFeeText: false,
  }
}
