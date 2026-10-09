/**
 * Detached tx lifecycle — compact glass banner on the **global** Sonner stack only.
 * One stable `id` per submission; same toast evolves (wallet wait → submitted → terminal).
 */

import { StakingTxLifecycleToastBanner } from "@/components/pages/staking/StakingTxLifecycleToastBanner"
import { buildStakingTxLifecycleToastClassName } from "@/components/ui/sonnerUtils"
import { STAKING_NOTIFICATION_DURATION_MS } from "@/constants/stakingNotificationSpec"
import type { TransactionStatusScenario } from "@/staking/tx/types/transactionStatusScenario"
import type { TransactionStatusUiPhase } from "@/staking/tx/types/transactionStatusUiPhase"
import { createStakingToastDedupeKey } from "@/staking/ui/stakingToast"
import { traceTxVisualOwnership } from "@/staking/diagnostics/txVisualOwnershipTrace"
import {
  createIdleTransactionStatusSnapshot,
  deriveCurrentTxHashFromSnapshot,
} from "@/staking/tx/transactionStatusSnapshotHelpers"
import { toast } from "sonner"
import {
  buildStakingTxLifecycleToastPresentation,
  deriveDetachedWalletWaitToastTitle,
  type StakingTxLifecycleToastPhase,
} from "@/staking/notifications/stakingTxLifecycleToastPresentation"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"

const LIFECYCLE_IN_FLIGHT_DURATION = Number.POSITIVE_INFINITY

/** Registered by TransactionStatusProvider — modal owns the surface while open. */
let readDetachedTxToastSuppressed: (() => boolean) | null = null

export function setDetachedTxToastSuppressedReader(
  reader: (() => boolean) | null
): void {
  readDetachedTxToastSuppressed = reader
}

function isDetachedTxToastSuppressed(): boolean {
  return readDetachedTxToastSuppressed?.() === true
}

function isInFlightDetachedToastPhase(
  phase: StakingTxLifecycleToastPhase
): boolean {
  return (
    phase === "wallet_wait" ||
    phase === "submitted" ||
    phase === "confirming"
  )
}

/** One Sonner id per submission — entire detached lifecycle shares a single toast node. */
export function stakingDetachedActiveTxToastId(
  scenario: TransactionStatusScenario,
  submissionId: number
): string {
  return createStakingToastDedupeKey(
    "tx_detached",
    "active",
    scenario,
    String(submissionId)
  )
}

/** @deprecated Legacy hash-scoped id — dismiss only when cleaning superseded mounts. */
export function stakingDetachedTxProgressToastId(
  scenario: TransactionStatusScenario,
  txHash: string
): string {
  return createStakingToastDedupeKey(
    "tx_detached",
    "lifecycle",
    scenario,
    txHash.trim().toLowerCase()
  )
}

function durationForPhase(phase: StakingTxLifecycleToastPhase): number {
  if (
    phase === "wallet_wait" ||
    phase === "submitted" ||
    phase === "confirming"
  ) {
    return LIFECYCLE_IN_FLIGHT_DURATION
  }
  if (phase === "success") {
    return STAKING_NOTIFICATION_DURATION_MS.success
  }
  return STAKING_NOTIFICATION_DURATION_MS.error
}

function parseWalletWaitSubmissionId(txHash: string): number | null {
  const m = /^submission:(\d+)$/.exec(txHash.trim())
  const submissionId = m ? Number(m[1]) : NaN
  return Number.isFinite(submissionId) && submissionId > 0 ? submissionId : null
}

function resolveSubmissionId(
  presentation: ReturnType<typeof buildStakingTxLifecycleToastPresentation>
): number | null {
  if (
    presentation.submissionId != null &&
    presentation.submissionId > 0
  ) {
    return presentation.submissionId
  }
  return parseWalletWaitSubmissionId(presentation.txHash)
}

function resolveLifecycleToastId(
  presentation: ReturnType<typeof buildStakingTxLifecycleToastPresentation>
): string | number {
  const submissionId = resolveSubmissionId(presentation)
  if (submissionId != null) {
    return stakingDetachedActiveTxToastId(presentation.scenario, submissionId)
  }
  return stakingDetachedTxProgressToastId(
    presentation.scenario,
    presentation.txHash
  )
}

/** Remove legacy per-hash / wallet-wait ids so Sonner never stacks two detached surfaces. */
function dismissSupersededDetachedTxToasts(
  presentation: ReturnType<typeof buildStakingTxLifecycleToastPresentation>
): void {
  const scenario = presentation.scenario
  const submissionId = resolveSubmissionId(presentation)
  if (submissionId != null) {
    dismissStakingTxWalletWaitProgressToast(scenario, submissionId)
  }
  const h = presentation.txHash.trim()
  if (h && !h.startsWith("submission:")) {
    toast.dismiss(stakingDetachedTxProgressToastId(scenario, h))
  }
}

function txLifecycleToastRootClassName(
  phase: StakingTxLifecycleToastPhase
): string {
  const inFlight =
    phase === "wallet_wait" || phase === "submitted" || phase === "confirming"
  return buildStakingTxLifecycleToastClassName({
    shine: inFlight,
    success: phase === "success",
    failed: phase === "failed",
  })
}

function emitStakingTxLifecycleToast(
  presentation: ReturnType<typeof buildStakingTxLifecycleToastPresentation>
): string | number {
  const id = resolveLifecycleToastId(presentation)
  if (
    isInFlightDetachedToastPhase(presentation.phase) &&
    isDetachedTxToastSuppressed()
  ) {
    return id
  }

  dismissSupersededDetachedTxToasts(presentation)
  const toastOptions = {
    id,
    duration: durationForPhase(presentation.phase),
    position: "top-center" as const,
    closeButton: false,
    className: txLifecycleToastRootClassName(presentation.phase),
  }

  const toastId = toast.custom(
    () => <StakingTxLifecycleToastBanner presentation={presentation} />,
    toastOptions
  )
  const progressPhase =
    presentation.phase === "wallet_wait" ||
    presentation.phase === "submitted" ||
    presentation.phase === "confirming"
  traceTxVisualOwnership(
    progressPhase ? "tx_progress_toast_shown" : "tx_terminal_toast_shown",
    createIdleTransactionStatusSnapshot(),
    {
      toastId: String(toastId),
      toastPhase: presentation.phase,
      scenario: presentation.scenario,
      txHash: presentation.txHash,
      submissionId: resolveSubmissionId(presentation),
    }
  )
  return toastId
}

/** Hide all detached progress toasts while the modal owns the transaction surface. */
export function dismissDetachedTxProgressToastForSnapshot(
  snapshot: TransactionStatusSnapshot
): void {
  const scenario = snapshot.scenario
  if (!scenario) return
  const submissionId = snapshot.submissionId
  const hash = deriveCurrentTxHashFromSnapshot(snapshot)
  const dismissKey =
    hash?.trim() ||
    (submissionId != null && submissionId > 0
      ? walletWaitToastKey(submissionId)
      : "")
  if (dismissKey) {
    dismissStakingTxLifecycleToast(scenario, dismissKey, submissionId)
  } else if (submissionId != null && submissionId > 0) {
    toast.dismiss(stakingDetachedActiveTxToastId(scenario, submissionId))
  }
  dismissStakingTxWalletWaitProgressToast(scenario, submissionId)
}

/** Hide lifecycle toast while the modal owns the surface. */
export function dismissStakingTxLifecycleToast(
  scenario: TransactionStatusScenario,
  txHash: string,
  submissionId?: number | null
): void {
  const h = txHash.trim()
  if (submissionId != null && submissionId > 0) {
    const activeToastId = stakingDetachedActiveTxToastId(scenario, submissionId)
    toast.dismiss(activeToastId)
    dismissStakingTxWalletWaitProgressToast(scenario, submissionId)
    traceTxVisualOwnership(
      "tx_progress_toast_dismissed",
      createIdleTransactionStatusSnapshot(),
      { toastId: activeToastId, scenario, submissionId }
    )
  }
  if (!h || h.startsWith("submission:")) return
  const legacyToastId = stakingDetachedTxProgressToastId(scenario, h)
  toast.dismiss(legacyToastId)
  traceTxVisualOwnership(
    "tx_progress_toast_dismissed",
    createIdleTransactionStatusSnapshot(),
    { toastId: legacyToastId, scenario, txHash: h }
  )
}

/** Stable Sonner id per submission while awaiting wallet (pre-hash). */
export function stakingDetachedWalletWaitToastId(
  scenario: TransactionStatusScenario,
  submissionId: number
): string {
  return createStakingToastDedupeKey(
    "tx_detached",
    "wallet_wait",
    scenario,
    String(submissionId)
  )
}

function walletWaitToastKey(submissionId: number): string {
  return `submission:${submissionId}`
}

/** Hide wallet-wait lifecycle toast while the modal owns the surface. */
export function dismissStakingTxWalletWaitProgressToast(
  scenario: TransactionStatusScenario,
  submissionId: number | null | undefined
): void {
  if (submissionId == null || submissionId <= 0) return
  const toastId = stakingDetachedWalletWaitToastId(scenario, submissionId)
  toast.dismiss(toastId)
  traceTxVisualOwnership(
    "tx_progress_toast_dismissed",
    createIdleTransactionStatusSnapshot(),
    { toastId, scenario, submissionId, kind: "wallet_wait" }
  )
}

export function syncStakingTxWalletWaitProgressToast(
  snapshot: TransactionStatusSnapshot
): void {
  if (snapshot.dialogOpen) return
  const scenario = snapshot.scenario
  const submissionId = snapshot.submissionId
  if (!scenario || submissionId == null || submissionId <= 0) return
  emitStakingTxLifecycleToast(
    buildStakingTxLifecycleToastPresentation({
      scenario,
      txHash: walletWaitToastKey(submissionId),
      phase: "wallet_wait",
      amountLabel: snapshot.amountLabel,
      showView: true,
      title: deriveDetachedWalletWaitToastTitle(snapshot),
      submissionId,
    })
  )
}

/** @deprecated Alias */
export const dismissDetachedTxProgressToast = dismissStakingTxLifecycleToast

export function syncStakingTxLifecycleProgressToast(
  scenario: TransactionStatusScenario,
  txHash: string,
  phase: Extract<TransactionStatusUiPhase, "submitted" | "confirming">,
  options?: { amountLabel?: string; showView?: boolean; submissionId?: number | null }
): void {
  const h = txHash.trim()
  if (!h) return
  emitStakingTxLifecycleToast(
    buildStakingTxLifecycleToastPresentation({
      scenario,
      txHash: h,
      phase,
      amountLabel: options?.amountLabel,
      showView: options?.showView ?? true,
      submissionId: options?.submissionId ?? null,
    })
  )
}

/** @deprecated Alias */
export const showDetachedTxProgressToast = syncStakingTxLifecycleProgressToast

export function completeStakingTxLifecycleToast(
  scenario: TransactionStatusScenario,
  txHash: string,
  outcome: "success" | "failed",
  options?: { amountLabel?: string; submissionId?: number | null }
): void {
  const h = txHash.trim()
  if (!h) return
  const phase: StakingTxLifecycleToastPhase =
    outcome === "success" ? "success" : "failed"
  emitStakingTxLifecycleToast(
    buildStakingTxLifecycleToastPresentation({
      scenario,
      txHash: h,
      phase,
      amountLabel: options?.amountLabel,
      showView: false,
      submissionId: options?.submissionId ?? null,
    })
  )
}
