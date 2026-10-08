import { DEBUG_LOGS } from "@/config/env"
import {
  STAKING_CTA_ENTER_AMOUNT_MESSAGE,
  STAKING_CTA_HINT_DETACHED_TRACKING,
  STAKING_CTA_LABEL_CONFIRMING,
  STAKING_CTA_LABEL_FINALIZING,
  STAKING_CTA_LABEL_PREPARING,
  STAKING_CTA_LABEL_REVIEW,
  STAKING_CTA_LABEL_SIGN,
  STAKING_CTA_LABEL_SUBMITTED,
  STAKING_CTA_WALLET_INTENT_AWAITING,
  STAKING_CTA_WALLET_INTENT_CHECK,
  STAKING_CTA_WALLET_INTENT_STILL,
} from "@/constants/stakingCtaShortLabels"
import { logger } from "@/lib/logger"
import type { StakingCtaState } from "@/hooks/useStakingCtaState"
import { isStakingCtaAsyncStatusEchoReason } from "@/staking/cta"
import type { StakingCtaReasonModel } from "@/types/stakingCtaReason"
import type { StakingCtaScenario } from "@/hooks/useStakingCtaState"
import type { StakingCtaTxPhase } from "@/types/stakingCtaTxPhase"
import type { TransactionStatusUiPhase } from "@/staking/tx/types/transactionStatusUiPhase"

export type StakingCtaUiPhase =
  | "idle"
  | "ready"
  | "preview"
  | "preparing_transaction"
  | "submitted"
  | "approving"
  | "depositing"
  | "withdrawing"
  | "confirming"
  | "success"

export type DeriveUiPhaseInput = {
  successLockActive: boolean
  txPhase: StakingCtaTxPhase
  scenario: StakingCtaScenario
  cta: Pick<StakingCtaState, "actionType" | "disabled">
}

let lastCheckReadyFingerprint = ""

/**
 * Pure resolver: same input → same UiPhase. Fallback "idle" if gaps appear.
 */
export function deriveStakingUiPhase(input: DeriveUiPhaseInput): StakingCtaUiPhase {
  if (input.successLockActive) return "success"

  const { txPhase, scenario, cta } = input

  if (txPhase === "preview") return "preview"
  if (txPhase === "preparing_transaction") return "preparing_transaction"
  if (txPhase === "submitted") return "submitted"
  if (txPhase === "approving") return "approving"
  if (txPhase === "depositing" || txPhase === "depositAfterApproval") {
    return "depositing"
  }
  if (txPhase === "withdrawing") {
    return scenario === "withdraw" ? "withdrawing" : "idle"
  }
  if (txPhase === "confirming") {
    return "confirming"
  }

  if (DEBUG_LOGS) {
    const canSubmit = cta.actionType === "submit" && !cta.disabled
    const fp = `${canSubmit}|${cta.actionType}|${cta.disabled}`
    if (fp !== lastCheckReadyFingerprint) {
      lastCheckReadyFingerprint = fp
      logger.log("[CHECK READY]", {
        canSubmit,
        actionType: cta.actionType,
        disabled: cta.disabled,
      })
    }
  }

  if (cta.actionType === "submit" && !cta.disabled) return "ready"

  return "idle"
}

export const STAKING_SUCCESS_REASON_DEPOSIT: StakingCtaReasonModel = {
  message: "Rewards on",
  tone: "neutral",
}

export const STAKING_SUCCESS_REASON_WITHDRAW: StakingCtaReasonModel = {
  message: "Withdrawal sent",
  tone: "neutral",
}

export function getWalletIntentReason(elapsedMs: number): StakingCtaReasonModel {
  if (elapsedMs > 8000) {
    return {
      message: STAKING_CTA_WALLET_INTENT_STILL,
      tone: "neutral",
    }
  }
  if (elapsedMs > 3000) {
    return { message: STAKING_CTA_WALLET_INTENT_AWAITING, tone: "neutral" }
  }
  return { message: STAKING_CTA_WALLET_INTENT_CHECK, tone: "neutral" }
}
export type SelectInlineCtaReasonInput = {
  uiPhase: StakingCtaUiPhase
  scenario: StakingCtaScenario
  txPhase: StakingCtaTxPhase
  submitIntentActive: boolean
  intentElapsedMs: number
  ctaReason: StakingCtaReasonModel | null
  /** Modal dismissed while post-broadcast receipt is in flight. */
  detachedAwaitingReceipt?: boolean
}

/** Section G — inline reason above primary CTA (not modal). */
export function selectStakingInlineCtaReason(
  input: SelectInlineCtaReasonInput
): StakingCtaReasonModel | null {
  const {
    uiPhase,
    scenario,
    txPhase,
    submitIntentActive,
    intentElapsedMs,
    ctaReason,
    detachedAwaitingReceipt = false,
  } = input

  if (
    detachedAwaitingReceipt &&
    (uiPhase === "submitted" || uiPhase === "confirming")
  ) {
    return { message: STAKING_CTA_HINT_DETACHED_TRACKING, tone: "neutral" }
  }

  if (uiPhase === "success") {
    return scenario === "deposit"
      ? STAKING_SUCCESS_REASON_DEPOSIT
      : STAKING_SUCCESS_REASON_WITHDRAW
  }

  if (
    uiPhase === "preview" ||
    uiPhase === "preparing_transaction" ||
    uiPhase === "submitted" ||
    uiPhase === "approving" ||
    uiPhase === "depositing" ||
    uiPhase === "withdrawing" ||
    uiPhase === "confirming"
  ) {
    return null
  }

  if (submitIntentActive && txPhase === "idle") {
    return getWalletIntentReason(intentElapsedMs)
  }

  if (
    ctaReason !== null &&
    ctaReason.message === STAKING_CTA_ENTER_AMOUNT_MESSAGE
  ) {
    return null
  }

  if (ctaReason !== null && isStakingCtaAsyncStatusEchoReason(ctaReason)) {
    return null
  }

  return ctaReason
}

export type PrimaryLabelInput = {
  uiPhase: StakingCtaUiPhase
  scenario: StakingCtaScenario
  txPhase: StakingCtaTxPhase
  /** Base label from useStakingCtaState — never compared to string literals elsewhere */
  ctaLabel: string
}

/** Section F — phase overrides only; base label from hook snapshot */
export function getStakingPrimaryLabel(input: PrimaryLabelInput): string {
  const { uiPhase, scenario, txPhase, ctaLabel } = input

  if (uiPhase === "success") {
    return "Done"
  }
  if (uiPhase === "preview") return STAKING_CTA_LABEL_REVIEW
  if (uiPhase === "preparing_transaction") return STAKING_CTA_LABEL_PREPARING
  if (uiPhase === "submitted") return STAKING_CTA_LABEL_SUBMITTED
  if (uiPhase === "approving") return STAKING_CTA_LABEL_SIGN
  if (uiPhase === "depositing") {
    if (scenario === "deposit" && txPhase === "depositAfterApproval") {
      return STAKING_CTA_LABEL_FINALIZING
    }
    return STAKING_CTA_LABEL_SIGN
  }
  if (uiPhase === "withdrawing") return STAKING_CTA_LABEL_SIGN
  if (uiPhase === "confirming") {
    return STAKING_CTA_LABEL_CONFIRMING
  }
  return ctaLabel
}

export function getStakingPrimaryDisabled(input: {
  uiPhase: StakingCtaUiPhase
  cta: StakingCtaState
  submitUiLocked: boolean
}): boolean {
  const { uiPhase, cta, submitUiLocked } = input
  if (cta.actionType === "connect" || cta.actionType === "switch") {
    return false
  }
  if (
    uiPhase === "preview" ||
    uiPhase === "preparing_transaction" ||
    uiPhase === "submitted" ||
    uiPhase === "approving" ||
    uiPhase === "depositing" ||
    uiPhase === "withdrawing" ||
    uiPhase === "confirming" ||
    uiPhase === "success"
  ) {
    return true
  }
  return cta.disabled || submitUiLocked
}

/**
 * Aligns derived CTA tx phase with transaction modal lifecycle for a single "busy" signal.
 * Use in forms when guarding UI (e.g. assert modal + form never disagree on activity).
 */
export function deriveTxUiPhaseFromTxPhase(
  txPhase: StakingCtaTxPhase,
  modalUiPhase: TransactionStatusUiPhase | null
): "idle" | "busy" {
  const modalBusy =
    modalUiPhase === "preview" ||
    modalUiPhase === "pending" ||
    modalUiPhase === "awaiting_signature" ||
    modalUiPhase === "submitted" ||
    modalUiPhase === "confirming"
  const formBusy =
    txPhase === "preview" ||
    txPhase === "preparing_transaction" ||
    txPhase === "submitted" ||
    txPhase === "approving" ||
    txPhase === "depositing" ||
    txPhase === "depositAfterApproval" ||
    txPhase === "withdrawing" ||
    txPhase === "confirming" ||
    txPhase === "confirmed" ||
    txPhase === "failed" ||
    txPhase === "cancelled"
  return modalBusy || formBusy ? "busy" : "idle"
}
