import { DEBUG_LOGS } from "@/staking/config"
import {
  isWithinAppKitHydrationGrace,
  snapshotWalletConnectStorageKeyCounts,
} from "@/lib/wallet/appKitSessionHydrationObserve"
import { getLastStakingConnectIntent } from "@/staking/diagnostics/stakingTrustWalletConnectDebug"
import {
  STAKING_CTA_ENTER_AMOUNT_MESSAGE,
  STAKING_CTA_HINT_APPROVE,
  STAKING_CTA_HINT_CANCELLED,
  STAKING_CTA_HINT_CONFIRMING,
  STAKING_CTA_HINT_CONFIRM_STAKE,
  STAKING_CTA_HINT_CONFIRM_UNSTAKE,
  STAKING_CTA_HINT_CONFIRM_WALLET,
  STAKING_CTA_HINT_CONNECTING,
  STAKING_CTA_HINT_DETACHED_TRACKING,
  STAKING_CTA_HINT_RUNTIME_SETTLING,
  STAKING_CTA_HINT_DONE,
  STAKING_CTA_HINT_FAILED,
  STAKING_CTA_HINT_FINALIZING,
  STAKING_CTA_HINT_NO_ETH,
  STAKING_CTA_HINT_PREPARING_TX,
  STAKING_CTA_HINT_REVIEW,
  STAKING_CTA_HINT_RPC,
  STAKING_CTA_HINT_SUBMITTED,
  STAKING_CTA_HINT_SYNC_BALANCE,
  STAKING_CTA_HINT_TERMS,
  STAKING_CTA_HINT_VAULT,
  STAKING_CTA_HINT_WRONG_NETWORK,
  STAKING_CTA_LABEL_CALCULATING,
  STAKING_CTA_LABEL_CLOSING,
  STAKING_CTA_LABEL_CONFIRMING,
  STAKING_CTA_LABEL_CONNECT,
  STAKING_CTA_LABEL_DONE,
  STAKING_CTA_LABEL_ERROR,
  STAKING_CTA_LABEL_FINALIZING,
  STAKING_CTA_LABEL_INVALID_AMOUNT,
  STAKING_CTA_LABEL_LOADING,
  STAKING_CTA_LABEL_NO_BALANCE,
  STAKING_CTA_LABEL_NO_ETH,
  STAKING_CTA_LABEL_PREPARING,
  STAKING_CTA_LABEL_RETRY,
  STAKING_CTA_LABEL_REVIEW,
  STAKING_CTA_LABEL_SIGN,
  STAKING_CTA_LABEL_SUBMITTED,
  STAKING_CTA_LABEL_SWITCHING,
  STAKING_CTA_LABEL_TERMS,
  STAKING_CTA_LABEL_TOO_LOW,
  STAKING_CTA_LABEL_VIEW_ONLY,
  STAKING_CTA_LABEL_WRONG_NETWORK,
} from "@/constants/stakingCtaShortLabels"
import {
  STAKING_CTA_MESSAGE_CALCULATING_NETWORK_FEE,
  STAKING_CTA_MESSAGE_READY_TO_STAKE,
  STAKING_CTA_MESSAGE_READY_TO_WITHDRAW,
} from "@/constants/stakingCtaMessages"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { logger } from "@/lib/logger"
import {
  stakingCtaClearBlockedCode,
  stakingCtaLogIfChanged,
  stakingCtaWarnBlockedIfChanged,
} from "@/staking/cta"
import { deriveStakingCtaTxPhaseFromSnapshot } from "@/staking/cta"
import { STAKING_PASSIVE_TRON_VIEW_ONLY_MESSAGE } from "@/staking/identity"
import type { StakingTokenMetaError } from "@/hooks/useStakingVault"
import type { StakingCtaReasonModel } from "@/types/stakingCtaReason"
import type { StakingCtaTxPhase } from "@/types/stakingCtaTxPhase"
import { useRef } from "react"

export type { StakingCtaTxPhase } from "@/types/stakingCtaTxPhase"

/**
 * Single source of truth for the staking primary CTA.
 *
 * Pure, deterministic resolver: same inputs -> same output, every call.
 * Forms MUST consume this hook exclusively for label/reason/disabled/actionType.
 *
 * `txSnapshot` is authoritative for in-flight transaction UI (with
 * `deriveStakingCtaTxPhaseFromSnapshot`). Precedence (highest first):
 *   1. not connected
 *   2. wrong network
 *   3. awaiting signer
 *   4. terms not accepted
 *   5. active tx snapshot phase (preview → confirming, etc.)
 *   6. RPC error
 *   7. gas shortfall
 *   8. input validation
 *   9. vault tx `loading` while lifecycle idle (edge)
 *   10. vault / balance loading
 *   11. fee readiness (deposit / withdraw)
 *   12. ready — `label` is the final action (Stake / Approve & Stake / Withdraw) only here
 */

import type { StakingCtaActionType } from "@/staking/cta/types/stakingCtaContracts"

export type { StakingCtaActionType } from "@/staking/cta/types/stakingCtaContracts"

export type StakingCtaState = {
  label: string
  reason: StakingCtaReasonModel | null
  disabled: boolean
  actionType: StakingCtaActionType
}

export type StakingCtaScenario = "deposit" | "withdraw"

export type UseStakingCtaStateInput = {
  scenario: StakingCtaScenario

  isConnected: boolean
  awaitingSigner: boolean
  vaultDataReady: boolean
  loading: boolean

  isWrongNetwork: boolean
  isAttemptingNetworkSwitch: boolean

  tokenMetaError: StakingTokenMetaError | null

  /** Authoritative staking transaction modal + preparation state */
  txSnapshot: TransactionStatusSnapshot

  /**
   * When `false`, primary CTA stays in a calm loading state until the app signer is ready.
   * Omit when not applicable (defaults to ready).
   */
  txExecutionReady?: boolean

  /** When `false`, primary action stays disabled until user accepts terms. Default `true`. */
  termsAccepted?: boolean
  /**
   * When `false` (e.g. Tron passive runtime), skip ETH-native gas shortfall branches. Default `true` (EVM).
   */
  applyEvmNetworkAndGasCtaBlocks?: boolean
  /** When `true`, show wrong-network / switch-network CTA (EVM always via gas blocks; Tron explicit). */
  applyWrongNetworkCtaBlocks?: boolean
  /** Override primary label for wrong-network switch CTA (e.g. "Switch to Nile"). */
  wrongNetworkLabel?: string
  /**
   * Passive non-executable runtime (Tron today): calm view-only CTA; skips amount/gas/EVM gates.
   */
  passiveRuntimeViewOnly?: boolean

  trimmedAmount: string
  hasInvalidAmount: boolean
  parsedWeiPositive: boolean
  exceedsLimit: boolean
  belowMinWithdrawal: boolean

  needsApproval: boolean

  nearZeroEth: boolean
  insufficientNative: boolean
  estimateSuccess: boolean
  /**
   * Deposit: `false` until a usable network fee line exists for the current amount.
   */
  depositFeeReady?: boolean
  /**
   * Withdraw: `false` until protocol withdrawal fee + network fee are usable for CTA.
   */
  withdrawFeeReady?: boolean
}

const DEPOSIT_LABEL_DEFAULT = "Stake"
const DEPOSIT_LABEL_NEEDS_APPROVAL = "Approve & Stake"
const WITHDRAW_LABEL_DEFAULT = "Withdraw"

/** Empty trimmed amount — inline reason hidden in `selectStakingInlineCtaReason`. */
export { STAKING_CTA_ENTER_AMOUNT_MESSAGE } from "@/constants/stakingCtaShortLabels"

function R(
  message: string,
  tone: StakingCtaReasonModel["tone"],
  hint?: string
): StakingCtaReasonModel {
  return hint !== undefined ? { message, tone, hint } : { message, tone }
}

function devThrowIfDisabledWithoutReason(state: StakingCtaState): void {
  if (!DEBUG_LOGS) return
  if (state.disabled === true && state.reason === null) {
    throw new Error(
      "useStakingCtaState: disabled state must carry a non-null reason"
    )
  }
}

function ctaFinalRecord(
  input: UseStakingCtaStateInput,
  state: StakingCtaState,
  txPhase: StakingCtaTxPhase
): Record<string, unknown> {
  return {
    actionType: state.actionType,
    disabled: state.disabled,
    label: state.label,
    reason: state.reason,
    scenario: input.scenario,
    isConnected: input.isConnected,
    isCorrectNetwork: !input.isWrongNetwork,
    trimmedAmount: input.trimmedAmount,
    hasInvalidAmount: input.hasInvalidAmount,
    parsedWeiPositive: input.parsedWeiPositive,
    exceedsLimit: input.exceedsLimit,
    belowMinWithdrawal: input.belowMinWithdrawal,
    needsApproval: input.needsApproval,
    vaultDataReady: input.vaultDataReady,
    loading: input.loading,
    awaitingSigner: input.awaitingSigner,
    txPhase,
    tokenMetaError: input.tokenMetaError,
    nearZeroEth: input.nearZeroEth,
    insufficientNative: input.insufficientNative,
    estimateSuccess: input.estimateSuccess,
    depositFeeReady: input.depositFeeReady,
    withdrawFeeReady: input.withdrawFeeReady,
    isAttemptingNetworkSwitch: input.isAttemptingNetworkSwitch,
  }
}

function criticalFlagsRecord(
  input: UseStakingCtaStateInput,
  txPhase: StakingCtaTxPhase
): Record<string, unknown> {
  return {
    isConnected: input.isConnected,
    isCorrectNetwork: !input.isWrongNetwork,
    trimmedAmount: input.trimmedAmount,
    parsedWeiPositive: input.parsedWeiPositive,
    hasInvalidAmount: input.hasInvalidAmount,
    exceedsLimit: input.exceedsLimit,
    needsApproval: input.needsApproval,
    vaultDataReady: input.vaultDataReady,
    loading: input.loading,
    txPhase,
  }
}

function emitCtaFinalIfChanged(
  lastRef: { current: string },
  input: UseStakingCtaStateInput,
  state: StakingCtaState,
  txPhase: StakingCtaTxPhase
): void {
  stakingCtaLogIfChanged(lastRef, ctaFinalRecord(input, state, txPhase), r =>
    logger.log("[CTA FINAL]", r)
  )
}

export function useStakingCtaState(
  input: UseStakingCtaStateInput
): StakingCtaState {
  const lastCriticalFpRef = useRef("")
  const lastFinalFpRef = useRef("")
  const lastBlockedCodeRef = useRef<string | null>(null)

  const termsAccepted = input.termsAccepted !== false
  const applyEvmNetworkAndGasCtaBlocks = input.applyEvmNetworkAndGasCtaBlocks !== false
  const applyWrongNetworkCtaBlocks =
    input.applyWrongNetworkCtaBlocks === true ||
    applyEvmNetworkAndGasCtaBlocks
  const wrongNetworkLabel =
    input.wrongNetworkLabel?.trim() || STAKING_CTA_LABEL_WRONG_NETWORK
  const passiveRuntimeViewOnly = input.passiveRuntimeViewOnly === true

  const txPhase = deriveStakingCtaTxPhaseFromSnapshot(
    input.scenario,
    input.txSnapshot
  )

  const {
    scenario,
    isConnected,
    awaitingSigner,
    vaultDataReady,
    loading,
    isWrongNetwork,
    isAttemptingNetworkSwitch,
    tokenMetaError,
    trimmedAmount,
    hasInvalidAmount,
    parsedWeiPositive,
    exceedsLimit,
    belowMinWithdrawal,
    needsApproval,
    nearZeroEth,
    insufficientNative,
    estimateSuccess,
    depositFeeReady,
    withdrawFeeReady,
  } = input

  stakingCtaLogIfChanged(lastCriticalFpRef, criticalFlagsRecord(input, txPhase), r =>
    logger.log("[CRITICAL FLAGS]", r)
  )

  const defaultLabel =
    scenario === "deposit"
      ? needsApproval
        ? DEPOSIT_LABEL_NEEDS_APPROVAL
        : DEPOSIT_LABEL_DEFAULT
      : WITHDRAW_LABEL_DEFAULT

  if (passiveRuntimeViewOnly) {
    stakingCtaClearBlockedCode(lastBlockedCodeRef)
    if (!vaultDataReady || loading) {
      const state: StakingCtaState = {
        label: STAKING_CTA_LABEL_LOADING,
        reason: R(STAKING_CTA_HINT_VAULT, "neutral"),
        disabled: true,
        actionType: "noop",
      }
      devThrowIfDisabledWithoutReason(state)
      emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
      return state
    }
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_VIEW_ONLY,
      reason: R(STAKING_PASSIVE_TRON_VIEW_ONLY_MESSAGE, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (!isConnected) {
    const wcLocalKeys = snapshotWalletConnectStorageKeyCounts().local
    const restoringSession =
      isWithinAppKitHydrationGrace() &&
      (wcLocalKeys > 0 || getLastStakingConnectIntent() != null)
    if (restoringSession) {
      stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "RESTORING_WC_SESSION")
      const state: StakingCtaState = {
        label: STAKING_CTA_LABEL_LOADING,
        reason: R(STAKING_CTA_HINT_CONNECTING, "neutral"),
        disabled: true,
        actionType: "noop",
      }
      devThrowIfDisabledWithoutReason(state)
      emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
      return state
    }
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "NOT_CONNECTED")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_CONNECT,
      reason: null,
      disabled: false,
      actionType: "connect",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (applyWrongNetworkCtaBlocks && isWrongNetwork && isAttemptingNetworkSwitch) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "NETWORK_SWITCH_IN_PROGRESS")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_SWITCHING,
      reason: R(STAKING_CTA_HINT_CONFIRM_WALLET, "amber"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (applyWrongNetworkCtaBlocks && isWrongNetwork && !isAttemptingNetworkSwitch) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "WRONG_NETWORK")
    const state: StakingCtaState = {
      label: wrongNetworkLabel,
      reason: R(STAKING_CTA_HINT_WRONG_NETWORK, "amber"),
      disabled: false,
      actionType: "switch",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (awaitingSigner) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "AWAITING_SIGNER")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_LOADING,
      reason: R(STAKING_CTA_HINT_CONNECTING, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (input.txExecutionReady === false && txPhase === "idle") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_EXECUTION_NOT_READY")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_LOADING,
      reason: R(STAKING_CTA_HINT_RUNTIME_SETTLING, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (!termsAccepted) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TERMS_NOT_ACCEPTED")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_TERMS,
      reason: R(STAKING_CTA_HINT_TERMS, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (txPhase === "preview") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PREVIEW")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_REVIEW,
      reason: R(STAKING_CTA_HINT_REVIEW, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "preparing_transaction") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PREPARING")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_PREPARING,
      reason: R(STAKING_CTA_HINT_PREPARING_TX, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "approving") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PHASE_APPROVING")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_SIGN,
      reason: R(STAKING_CTA_HINT_APPROVE, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "depositing") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PHASE_DEPOSITING")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_SIGN,
      reason: R(STAKING_CTA_HINT_CONFIRM_STAKE, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "depositAfterApproval") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PHASE_DEPOSIT_AFTER_APPROVAL")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_FINALIZING,
      reason: R(STAKING_CTA_HINT_FINALIZING, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "withdrawing") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PHASE_WITHDRAWING")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_SIGN,
      reason: R(STAKING_CTA_HINT_CONFIRM_UNSTAKE, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "submitted") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PHASE_SUBMITTED")
    const detached = !input.txSnapshot.dialogOpen
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_SUBMITTED,
      reason: R(
        detached ? STAKING_CTA_HINT_DETACHED_TRACKING : STAKING_CTA_HINT_SUBMITTED,
        "neutral"
      ),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "confirming") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PHASE_CONFIRMING")
    const detached = !input.txSnapshot.dialogOpen
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_CONFIRMING,
      reason: R(
        detached ? STAKING_CTA_HINT_DETACHED_TRACKING : STAKING_CTA_HINT_CONFIRMING,
        "neutral"
      ),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "confirmed") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PHASE_CONFIRMED")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_DONE,
      reason: R(STAKING_CTA_HINT_DONE, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "failed") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PHASE_FAILED")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_RETRY,
      reason: R(STAKING_CTA_HINT_FAILED, "amber"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (txPhase === "cancelled") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "TX_PHASE_CANCELLED")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_CLOSING,
      reason: R(STAKING_CTA_HINT_CANCELLED, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (tokenMetaError === "RPC_ERROR") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "RPC_ERROR")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_ERROR,
      reason: R(STAKING_CTA_HINT_RPC, "amber"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (applyEvmNetworkAndGasCtaBlocks && nearZeroEth) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "GAS_NEAR_ZERO_ETH")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_NO_ETH,
      reason: R(STAKING_CTA_HINT_NO_ETH, "amber"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (applyEvmNetworkAndGasCtaBlocks && estimateSuccess && insufficientNative) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "GAS_INSUFFICIENT_NATIVE")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_NO_ETH,
      reason: R(STAKING_CTA_HINT_NO_ETH, "amber"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (trimmedAmount === "") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "NO_AMOUNT")
    const state: StakingCtaState = {
      label: STAKING_CTA_ENTER_AMOUNT_MESSAGE,
      reason: R(STAKING_CTA_ENTER_AMOUNT_MESSAGE, "red"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (hasInvalidAmount) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "INVALID_AMOUNT")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_INVALID_AMOUNT,
      reason: R(STAKING_CTA_LABEL_INVALID_AMOUNT, "red"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (!parsedWeiPositive) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "AMOUNT_NOT_POSITIVE")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_TOO_LOW,
      reason: R(STAKING_CTA_LABEL_TOO_LOW, "red"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (exceedsLimit) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "NO_BALANCE")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_NO_BALANCE,
      reason: R(STAKING_CTA_LABEL_NO_BALANCE, "red"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (scenario === "withdraw" && belowMinWithdrawal) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "BELOW_MIN_WITHDRAWAL")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_TOO_LOW,
      reason: R(STAKING_CTA_LABEL_TOO_LOW, "red"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (scenario === "deposit" && loading && txPhase === "idle") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "VAULT_TX_LOADING_DEPOSIT")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_LOADING,
      reason: R(STAKING_CTA_HINT_SYNC_BALANCE, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }
  if (scenario === "withdraw" && loading && txPhase === "idle") {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "VAULT_TX_LOADING_WITHDRAW")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_LOADING,
      reason: R(STAKING_CTA_HINT_SYNC_BALANCE, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (!vaultDataReady) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "VAULT_NOT_READY")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_LOADING,
      reason: R(STAKING_CTA_HINT_VAULT, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (scenario === "deposit" && depositFeeReady === false) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "DEPOSIT_FEE_NOT_READY")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_CALCULATING,
      reason: R(STAKING_CTA_MESSAGE_CALCULATING_NETWORK_FEE, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  if (scenario === "withdraw" && withdrawFeeReady === false) {
    stakingCtaWarnBlockedIfChanged(lastBlockedCodeRef, "WITHDRAW_FEE_NOT_READY")
    const state: StakingCtaState = {
      label: STAKING_CTA_LABEL_CALCULATING,
      reason: R(STAKING_CTA_MESSAGE_CALCULATING_NETWORK_FEE, "neutral"),
      disabled: true,
      actionType: "noop",
    }
    devThrowIfDisabledWithoutReason(state)
    emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
    return state
  }

  stakingCtaClearBlockedCode(lastBlockedCodeRef)

  const state: StakingCtaState = {
    label: defaultLabel,
    reason:
      scenario === "deposit"
        ? R(STAKING_CTA_MESSAGE_READY_TO_STAKE, "neutral")
        : R(STAKING_CTA_MESSAGE_READY_TO_WITHDRAW, "neutral"),
    disabled: false,
    actionType: "submit",
  }
  devThrowIfDisabledWithoutReason(state)
  emitCtaFinalIfChanged(lastFinalFpRef, input, state, txPhase)
  return state
}
