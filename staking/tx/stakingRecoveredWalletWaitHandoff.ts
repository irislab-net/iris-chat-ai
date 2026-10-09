import { deriveDepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import { attemptStakingTxWalletHandoff } from "@/lib/wallet/openStakingTxWalletHandoff"
import {
  deriveMobileStakingFlowStep,
  type MobileStakingFlowStep,
} from "@/staking/diagnostics/mobileStakingFlowStep"
import {
  traceMobileStakingFlow,
  updateMobileStakingLanContext,
} from "@/staking/diagnostics/mobileStakingLanLog"
import {
  deriveCurrentTxHashFromSnapshot,
  isDetachedTxAwaitingWalletSignature,
} from "@/staking/tx/transactionStatusSnapshotHelpers"
import type { TransactionStatusSnapshot } from "@/staking/tx/types/transactionStatusSnapshot"
import { isMobileWalletUserAgent } from "@/lib/wallet/evmSignerHydration"
import { isStakingTxWalletDispatchInFlight } from "@/staking/tx/stakingTxWalletDispatchBridge"

export type RecoveredWalletWaitStatus =
  | "idle"
  | "waiting_for_wallet"
  | "recovered_needs_wallet_open"
  | "wallet_open_prompt_requested"
  | "wallet_open_prompt_cancelled"
  | "wallet_open_prompt_opened"
  | "wallet_response_pending"

const NOT_ACCEPTED_GRACE_MS = 4_500
const OPENED_HIDDEN_WINDOW_MS = 12_000

type HandoffRuntimeDeps = Readonly<{
  readSnapshot: () => TransactionStatusSnapshot
  tryRecoverApproval: (source: string) => Promise<boolean>
  tryRecoverWithdraw: (source: string) => Promise<string | null>
  applyRecoveredWithdrawHash: (hash: string, source: string) => void
  signalDepositContinuation: (source: string) => void
  cancelPreHashWalletWait: (source: string) => void
  notifyManualOpenHintRequired: () => void
  appKitAccountStatus: string | null
  wcSessionTopic: string | null
}>

type PendingPromptWatch = Readonly<{
  submissionId: number
  flowStep: MobileStakingFlowStep | null
  recoveryGeneration: number
  requestedAt: number
  source: string
}>

let runtimeDeps: HandoffRuntimeDeps | null = null
let recoveryGeneration = 0
let walletWaitStatus: RecoveredWalletWaitStatus = "idle"
const promptAttemptedKeys = new Set<string>()
let pendingWatch: PendingPromptWatch | null = null
let notAcceptedTimer: ReturnType<typeof setTimeout> | null = null
let listenersInstalled = false
let lastDetectedSubmissionId: number | null = null
let manualOpenHintActive = false

export function isRecoveredWalletWaitManualOpenHintActive(): boolean {
  return manualOpenHintActive
}

function setManualOpenHintActive(active: boolean): void {
  manualOpenHintActive = active
}

function clearNotAcceptedTimer(): void {
  if (notAcceptedTimer != null) {
    clearTimeout(notAcceptedTimer)
    notAcceptedTimer = null
  }
}

function promptAttemptKey(
  submissionId: number,
  flowStep: MobileStakingFlowStep | null,
  generation: number
): string {
  return `${submissionId}:${flowStep ?? "unknown"}:${generation}`
}

function traceHandoff(
  snapshot: TransactionStatusSnapshot,
  event: string,
  detail: Record<string, unknown> = {}
): void {
  const flowStep = deriveMobileStakingFlowStep(snapshot)
  const inFlightWalletOp = deriveInFlightWalletOp(snapshot)
  const modalVisible = snapshot.dialogOpen
  const toastVisible = isDetachedTxAwaitingWalletSignature(snapshot)
  traceMobileStakingFlow(event, {
    submissionId: snapshot.submissionId,
    flowRunId: snapshot.runId,
    recoveryGeneration,
    walletWaitStatus,
    uiPhase: snapshot.uiPhase,
    flowStep,
    inFlightWalletOp,
    visualOwner: modalVisible ? "modal" : toastVisible ? "toast" : "none",
    modalVisible,
    toastVisible,
    approvalTxHash: snapshot.approveTxHash,
    depositTxHash: snapshot.depositTxHash,
    withdrawTxHash: snapshot.withdrawTxHash,
    ...detail,
  })
  updateMobileStakingLanContext({ inFlightWalletOp })
}

export function deriveInFlightWalletOp(
  snapshot: TransactionStatusSnapshot
): "approval" | "deposit" | "withdraw" | null {
  if (snapshot.scenario === "withdraw") return "withdraw"
  if (snapshot.scenario !== "deposit") return null
  const execution = deriveDepositApprovalExecution({
    needsApproval: snapshot.needsApproval,
    depositApprovalKind: snapshot.depositApprovalKind,
    approvalMode: snapshot.approvalMode,
  })
  if (
    execution !== "skip" &&
    !snapshot.approveComplete &&
    !snapshot.approveTxHash?.trim()
  ) {
    return "approval"
  }
  return "deposit"
}

export function snapshotCurrentStepHasNoTxHash(
  snapshot: TransactionStatusSnapshot
): boolean {
  if (snapshot.scenario === "withdraw") {
    return !snapshot.withdrawTxHash?.trim()
  }
  if (snapshot.scenario === "deposit") {
    const op = deriveInFlightWalletOp(snapshot)
    if (op === "approval") return !snapshot.approveTxHash?.trim()
    return !snapshot.depositTxHash?.trim()
  }
  return true
}

export function isPreHashWalletWaitSnapshot(
  snapshot: TransactionStatusSnapshot
): boolean {
  if (snapshot.scenario == null) return false
  if (snapshot.uiPhase !== "awaiting_signature" && snapshot.uiPhase !== "pending") {
    return false
  }
  if (snapshot.terminal) return false
  return snapshotCurrentStepHasNoTxHash(snapshot)
}

export function shouldOfferRecoveredWalletHandoff(
  snapshot: TransactionStatusSnapshot
): boolean {
  if (!isMobileWalletUserAgent()) return false
  if (!isPreHashWalletWaitSnapshot(snapshot)) return false
  if (snapshot.submissionId == null || snapshot.submissionId <= 0) return false
  if (
    snapshot.scenario === "withdraw" &&
    (snapshot.uiPhase === "confirmed" ||
      snapshot.uiPhase === "success" ||
      Boolean(snapshot.withdrawTxHash?.trim()))
  ) {
    return false
  }
  // WC send is still pending — do not swap to recovered "Go to wallet" UX.
  if (isStakingTxWalletDispatchInFlight()) return false
  return true
}

export function bumpRecoveredWalletWaitGeneration(reason: string): number {
  recoveryGeneration += 1
  walletWaitStatus = "idle"
  setManualOpenHintActive(false)
  traceMobileStakingFlow("recovered_wallet_wait_detected", {
    recoveryGeneration,
    reason,
    bumped: true,
  })
  return recoveryGeneration
}

export function registerRecoveredWalletHandoffDeps(
  deps: HandoffRuntimeDeps | null
): void {
  runtimeDeps = deps
}

export function notifyRecoveredWalletWaitDetected(
  snapshot: TransactionStatusSnapshot,
  reason: string
): void {
  if (!shouldOfferRecoveredWalletHandoff(snapshot)) {
    if (snapshot.scenario === "withdraw" && snapshot.withdrawTxHash?.trim()) {
      traceHandoff(snapshot, "withdraw_wallet_wait_not_recovered_hash_exists", {
        reason: "hash_exists",
        detectReason: reason,
      })
    }
    if (
      snapshot.scenario === "withdraw" &&
      (snapshot.uiPhase === "confirmed" || snapshot.uiPhase === "success")
    ) {
      traceHandoff(snapshot, "withdraw_wallet_wait_not_recovered_terminal_exists", {
        reason: "terminal_success",
        detectReason: reason,
      })
    }
    if (isPreHashWalletWaitSnapshot(snapshot) && deriveCurrentTxHashFromSnapshot(snapshot)) {
      traceHandoff(snapshot, "recovered_wallet_wait_prompt_not_shown_reason", {
        reason: "hash_exists",
        detectReason: reason,
      })
    }
    return
  }
  const sid = snapshot.submissionId
  if (sid != null && sid === lastDetectedSubmissionId && walletWaitStatus !== "idle") {
    return
  }
  lastDetectedSubmissionId = sid
  walletWaitStatus = "recovered_needs_wallet_open"
  traceHandoff(snapshot, "recovered_wallet_wait_detected", { reason })
  traceHandoff(snapshot, "recovered_wallet_wait_requires_prompt", { reason })
}

export function requestRecoveredWalletOpenOnGesture(
  snapshot: TransactionStatusSnapshot,
  source: string,
  options?: { rearmed?: boolean }
): void {
  void requestRecoveredWalletOpenOnGestureAsync(snapshot, source, options)
}

async function requestRecoveredWalletOpenOnGestureAsync(
  snapshot: TransactionStatusSnapshot,
  source: string,
  options?: { rearmed?: boolean }
): Promise<void> {
  if (!shouldOfferRecoveredWalletHandoff(snapshot)) {
    const hash = deriveCurrentTxHashFromSnapshot(snapshot)?.trim()
    traceHandoff(snapshot, "recovered_wallet_wait_prompt_not_shown_reason", {
      reason: hash ? "hash_exists" : "not_pre_hash_wallet_wait",
      source,
    })
    return
  }
  if (pendingWatch != null) {
    const sameSubmission =
      snapshot.submissionId != null &&
      pendingWatch.submissionId === snapshot.submissionId
    if (!options?.rearmed || !sameSubmission) {
      traceHandoff(snapshot, "wallet_open_prompt_suppressed_duplicate", {
        source,
        reason: "prompt_already_active",
      })
      return
    }
    clearPendingPromptWatch()
  }

  const submissionId = snapshot.submissionId!
  const flowStep = deriveMobileStakingFlowStep(snapshot)
  const key = promptAttemptKey(submissionId, flowStep, recoveryGeneration)

  if (!options?.rearmed && promptAttemptedKeys.has(key)) {
    traceHandoff(snapshot, "wallet_open_prompt_suppressed_duplicate", {
      source,
      reason: "generation_already_attempted",
    })
    return
  }

  if (options?.rearmed && promptAttemptedKeys.has(key)) {
    traceHandoff(snapshot, "recovered_wallet_wait_prompt_rearmed_by_user_action", {
      source,
    })
    promptAttemptedKeys.delete(key)
  }

  promptAttemptedKeys.add(key)

  const handoffSource = `recovered_wallet_wait:${source}`
  const outcome = await attemptStakingTxWalletHandoff(handoffSource)

  if (outcome.kind === "manual_hint_required") {
    walletWaitStatus = "recovered_needs_wallet_open"
    setManualOpenHintActive(true)
    runtimeDeps?.notifyManualOpenHintRequired()
    traceHandoff(snapshot, "recovered_wallet_wait_manual_open_hint_shown", {
      source,
      reason: outcome.reason,
    })
    return
  }

  walletWaitStatus = "wallet_open_prompt_requested"
  pendingWatch = {
    submissionId,
    flowStep,
    recoveryGeneration,
    requestedAt: Date.now(),
    source,
  }

  traceHandoff(snapshot, "wallet_open_prompt_requested", { source })

  clearNotAcceptedTimer()
  notAcceptedTimer = setTimeout(() => {
    void handleWalletOpenNotAccepted("visible_timeout")
  }, NOT_ACCEPTED_GRACE_MS)
}

async function handleWalletOpenNotAccepted(trigger: string): Promise<void> {
  const deps = runtimeDeps
  const watch = pendingWatch
  if (!deps || !watch) return

  const snapshot = deps.readSnapshot()
  if (snapshot.submissionId !== watch.submissionId) {
    clearPendingPromptWatch()
    return
  }

  traceHandoff(snapshot, "wallet_handoff_visible_timeout", { trigger })
  traceHandoff(snapshot, "wallet_open_prompt_not_accepted_or_cancelled", {
    trigger,
  })

  if (!isPreHashWalletWaitSnapshot(snapshot)) {
    clearPendingPromptWatch()
    return
  }

  const hash = deriveCurrentTxHashFromSnapshot(snapshot)?.trim()
  if (hash) {
    traceHandoff(snapshot, "recovered_wallet_wait_cancel_blocked_hash_exists", {
      hashPrefix: hash.slice(0, 18),
    })
    clearPendingPromptWatch()
    return
  }

  const inFlightOp = deriveInFlightWalletOp(snapshot)
  if (inFlightOp === "approval") {
    const recovered = await deps.tryRecoverApproval(
      `recovered_wallet_wait_not_accepted:${trigger}`
    )
    if (recovered) {
      traceHandoff(snapshot, "recovered_wallet_wait_cancel_blocked_on_chain_recovered", {
        trigger,
      })
      deps.signalDepositContinuation(`recovered_wallet_wait_not_accepted:${trigger}`)
      clearPendingPromptWatch()
      return
    }
  }

  if (inFlightOp === "withdraw") {
    const recoveredHash = await deps.tryRecoverWithdraw(
      `recovered_wallet_wait_not_accepted:${trigger}`
    )
    if (recoveredHash) {
      traceHandoff(snapshot, "recovered_wallet_wait_cancel_blocked_on_chain_recovered", {
        trigger,
        operation: "withdraw",
      })
      deps.applyRecoveredWithdrawHash(
        recoveredHash,
        `recovered_wallet_wait_not_accepted:${trigger}`
      )
      clearPendingPromptWatch()
      return
    }
  }

  walletWaitStatus = "wallet_open_prompt_cancelled"
  traceHandoff(snapshot, "recovered_wallet_wait_cancelled_pre_hash", { trigger })
  deps.cancelPreHashWalletWait(`recovered_wallet_wait_not_accepted:${trigger}`)
  clearPendingPromptWatch()
}

function clearPendingPromptWatch(): void {
  pendingWatch = null
  clearNotAcceptedTimer()
  if (walletWaitStatus === "wallet_open_prompt_requested") {
    walletWaitStatus = "recovered_needs_wallet_open"
  }
}

function onWalletHandoffPageHidden(): void {
  const watch = pendingWatch
  const deps = runtimeDeps
  if (!watch || !deps) return
  const elapsed = Date.now() - watch.requestedAt
  if (elapsed > OPENED_HIDDEN_WINDOW_MS) return

  const snapshot = deps.readSnapshot()
  if (snapshot.submissionId !== watch.submissionId) return

  walletWaitStatus = "wallet_open_prompt_opened"
  traceHandoff(snapshot, "wallet_handoff_hidden_detected", {
    elapsedMs: elapsed,
    source: watch.source,
  })
  traceHandoff(snapshot, "wallet_open_prompt_opened_inferred", {
    source: watch.source,
    elapsedMs: elapsed,
  })
  clearPendingPromptWatch()
}

export function installRecoveredWalletHandoffListeners(): () => void {
  if (listenersInstalled || typeof document === "undefined") {
    return () => {}
  }
  listenersInstalled = true

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      onWalletHandoffPageHidden()
      return
    }
    const deps = runtimeDeps
    if (!deps) return
    const snapshot = deps.readSnapshot()
    notifyRecoveredWalletWaitDetected(snapshot, "visibility_return")
  }
  const onPageHide = () => {
    onWalletHandoffPageHidden()
  }

  document.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("pagehide", onPageHide)

  return () => {
    document.removeEventListener("visibilitychange", onVisibility)
    window.removeEventListener("pagehide", onPageHide)
    listenersInstalled = false
    clearPendingPromptWatch()
  }
}

export function getRecoveredWalletWaitStatus(): RecoveredWalletWaitStatus {
  return walletWaitStatus
}
