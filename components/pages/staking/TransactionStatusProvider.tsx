import { TransactionStatusContext } from "@/components/pages/staking/TransactionStatusContext"
import {
  createIdleTransactionStatusSnapshot,
  isTransactionStatusInFlightPhase,
  type MarkPostApprovalStakeWalletTerminalInput,
  type MarkUserRejectedInput,
  type OpenPendingInput,
  type RegisterReceiptCompletionInput,
  type SetFailedOptions,
  type SetSuccessInput,
  type SetSubmittedInput,
  type StakingApprovalMode,
  type SyncPreviewGasEstimateInput,
  type TransactionStatusContextValue,
  type TransactionStatusRetryRequest,
  type TransactionStatusScenario,
  type TransactionStatusSnapshot,
  type TransactionStatusUiPhase,
  type TransactionWireStepPhase,
} from "@/components/pages/staking/transactionStatusModel"
import { StakingAmbientTxPresentationProvider } from "@/components/pages/staking/StakingAmbientTxPresentationProvider"
import { TransactionStatusSurface } from "@/components/pages/staking/TransactionStatusSurface"
import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import {
  getExpectedChainId,
  isRuntimeChaosSuiteEnabled,
  isRuntimeTortureSuiteEnabled,
} from "@/staking/config"
import { STAKING_STABLECOIN_LABEL } from "@/constants/stakingVaultConfig"
import {
  STAKING_TX_UX_STAKE_CANCELLED_IN_WALLET,
  STAKING_TX_UX_STAKE_INSUFFICIENT_GAS,
  STAKING_TX_UX_WALLET_CONFIRMATION_CANCELLED,
} from "@/constants/stakingTransactionUxCopy"
import {
  buildRuntimeTelemetryEvent,
  emitRuntimeTelemetry,
  isRuntimeTelemetryEmitEnabled,
} from "@/lib/runtimeTelemetry/runtimeTelemetry"
import { deriveDepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import { stakingLifecycleTrace } from "@/staking/diagnostics"
import { requestEvmSignerHydrationRecovery } from "@/lib/wallet/evmSignerHydrationRecovery"
import {
  registerWalletConnectSignatureStallHandler,
} from "@/lib/wallet/walletConnectSignatureStallBridge"
import {
  isRecentBfCacheRestore,
  stakingMobileResumeStore,
} from "@/staking/orchestration"
import {
  isSignatureStallRecoveryStillApplicable,
  STAKING_TX_POST_RETURN_STALL_GRACE_MS,
} from "@/staking/diagnostics/useStakingTxSignatureStallWatchdog"
import { registerStakingTxWalletDispatchListener } from "@/staking/tx/stakingTxWalletDispatchBridge"
import { STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED } from "@/constants/stakingTransactionUxCopy"
import { tryRecoverStakingApprovalFromOnChainAllowance } from "@/staking/tx/stakingApprovalRecoveryFromSnapshot"
import {
  applyRecoveredWithdrawHashToSnapshot,
  tryRecoverWithdrawTxHashFromOnChain,
} from "@/staking/tx/stakingWithdrawRecoveryFromSnapshot"
import { traceWalletAccountIdentity } from "@/lib/wallet/walletAccountIdentityTelemetry"
import {
  bumpRecoveredWalletWaitGeneration,
  installRecoveredWalletHandoffListeners,
  isPreHashWalletWaitSnapshot,
  notifyRecoveredWalletWaitDetected,
  registerRecoveredWalletHandoffDeps,
  requestRecoveredWalletOpenOnGesture,
} from "@/staking/tx/stakingRecoveredWalletWaitHandoff"
import { blockStaleProviderTerminalUpdate } from "@/staking/tx/stakingTxStaleProviderUpdateGuard"
import { isPreBroadcastTxUiPhase } from "@/staking/tx/stakingTxLifecyclePhases"
import { registerStakingTxModalActivityProbe } from "@/staking/tx/stakingTxSessionRecoveryPolicy"
import { STAKING_TX_EXECUTION_NOT_READY_MESSAGE } from "@/staking/tx/stakingTxExecutionReadiness"
import {
  clearPersistedStakingTxSession,
  createPolledReceiptWait,
  deriveCurrentTxHashFromSnapshot,
  deriveReceiptErrorStageFromSnapshot,
  hasActiveStakingTxContinuity,
  isDetachedTerminalTxSnapshot,
  isDetachedTxAwaitingReceipt,
  isDetachedTxAwaitingWalletSignature,
  isDetachedTxWithProgressSurface,
  isPersistableTxSnapshot,
  isTransactionStatusTerminalUiPhase,
  isHydratablePersistedTxSession,
  readPersistedStakingTxSession,
  reviveSnapshotFromPersistence,
  sessionMatchesAccount,
  snapshotLooksIdle,
  snapshotMatchesReceiptHash,
  stakingTxContinuityIdleSnapshot,
  writePersistedStakingTxSession,
} from "@/staking/tx"
import type { StakingTxContinuityHealAction } from "@/staking/tx/stakingTxContinuityGuards"
import {
  claimStakingTxErrorAck,
  claimStakingTxSuccessAck,
  hasStakingTxErrorAck,
  hasStakingTxSuccessAck,
} from "@/staking/tx/stakingTxTerminalAck"
import { reconcilePersistedTxSnapshot } from "@/staking/tx"
import {
  buildPersistedStakeTerminalRow,
  clearPersistedStakingTxStakeTerminal,
  isPostApprovalStakeWalletWait,
  readPersistedStakingTxStakeTerminal,
  reviveSnapshotFromStakeTerminalRow,
  traceStakeWalletWaitTerminal,
  writePersistedStakingTxStakeTerminal,
} from "@/staking/tx/stakingStakeWalletWaitTerminal"
import {
  applyTerminalSnapshotBarrier,
  buildPersistedUserRejectionRow,
  clearPersistedStakingTxUserRejection,
  createActiveSubmissionTerminalFields,
  readPersistedStakingTxUserRejection,
  writePersistedStakingTxUserRejection,
} from "@/staking/tx/stakingTxSubmissionTerminal"
import {
  getStakingDeploymentRegistry,
  resolveStakingDeploymentForReconcile,
} from "@/staking/core/getStakingDeploymentRegistry"
import { getReceiptResolverForDeployment } from "@/staking/core/runtimeFamilyDispatch"
import { transactionRuntimeToReconcileContext } from "@/staking/core/persistenceTypes"
import { persistedTxReconcileContextFromRuntime } from "@/staking/core/defaultPersistedTxReconcileContext"
import {
  canRuntimeOperationCommitWithDevTrace,
  type RuntimeTransitionCoordinatorSnapshot,
} from "@/staking/orchestration"
import { resolveFrozenExecutionTarget } from "@/staking/core/persistenceTypes"
import {
  deriveRuntimeExecutionTarget,
  executionTargetEquals,
} from "@/staking/core/runtimeExecutionTarget"
import { useActiveRuntimeSelection } from "@/staking/core/runtimeSelectionContext"
import { useRuntimeTransitionSnapshot } from "@/staking/core/runtimeSelectionHooks"
import { registerRuntimeSwapTxModalSurfaceGetter } from "@/staking/orchestration"
import {
  devRegisterRuntimeStressTxSnapshotProbe,
  devRuntimeChaosShouldSkipHydrateReconcile,
  devRuntimeChaosSleepHydrateLag,
  recordRuntimeChaosHydrateForcedSkip,
  recordRuntimeTortureHydrateMs,
  recordRuntimeTortureReconcileMs,
  registerRuntimeTortureWalletContext,
  STAKING_RUNTIME_TORTURE_REHYDRATE_EVENT,
} from "@/staking/core/runtimeTransitionTelemetry"
import { buildTransactionRuntimeSnapshot } from "@/staking/core/runtimeTransition"
import {
  emptyStakingFeeCanonicalPair,
  mergeStakingFeeCanonicalPair,
  type StakingFeeCanonicalPair,
} from "@/staking/tx"
import { stakingTxExplorerUrlForFrozenRuntime } from "@/staking/execution"
import {
  completeStakingTxLifecycleToast,
  dismissDetachedTxProgressToastForSnapshot,
  dismissStakingTxLifecycleToast,
  dismissStakingTxWalletWaitProgressToast,
  setDetachedTxToastSuppressedReader,
  shouldEmitReceiptErrorSonnerToast,
  shouldEmitReceiptSuccessSonnerToast,
  syncStakingTxLifecycleProgressToast,
  syncStakingTxWalletWaitProgressToast,
} from "@/staking/notifications"
import { setStakingTxLifecycleToastActions } from "@/staking/notifications/stakingTxLifecycleToastActions"
import {
  createStakingToastDedupeKey,
  stakingToastError,
  stakingToastSuccess,
} from "@/staking/ui"
import {
  getStakingTransactionErrorMessage,
  isStakingWalletUserRejectedError,
} from "@/lib/stakingTransactionMessages"
import {
  captureStakingException,
  stakingSentryBreadcrumb,
  stakingSentryTagsFromDeployment,
} from "@/lib/stakingSentryObservability"
import { stakingTxLifecycleDev } from "@/staking/diagnostics"
import { stakingTxIntegrityDev } from "@/staking/diagnostics"
import {
  traceMobileStakingFlow,
  traceTxMobilePipeline,
  traceTxMobileSetSnapshotContext,
  useMobileStakingLanLogBootstrap,
  useStakingTxContinuityGuardsDev,
  useStakingTxSignatureStallWatchdog,
  useStakingVaultTxLoadingDesyncInvariantDev,
} from "@/staking/diagnostics"
import {
  traceTxLifecycleResetBlocked,
  traceTxModalCloseUiOnly,
  traceTxNoVisualOwnerIfNeeded,
  traceTxSnapshotCleared,
  traceTxSnapshotHydrated,
  traceTxSnapshotPersisted,
  traceTxVisualOwnerTransition,
} from "@/staking/diagnostics/txVisualOwnershipTrace"
import { useAppKitAccount } from "@reown/appkit/react"
import { abandonStakingVaultTxExecutionLoading } from "@/staking/tx/execution/stakingVaultTxExecutionOwnershipBridge"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

/** Epilogue duration after user dismisses during approve/deposit/confirm (read copy + motion). */
export const STAKING_TX_IN_FLIGHT_DISMISS_EPILOGUE_MS = 1320

/** One-frame deferral so `submitted` can paint before `confirming` (clearer handoff; chain timing unchanged). */
function snapshotAfterTerminalAck(
  s: TransactionStatusSnapshot,
  hash: string,
  ack: { success: Set<string>; error: Set<string> }
): TransactionStatusSnapshot {
  const acknowledged =
    hasStakingTxSuccessAck(ack.success, hash) ||
    hasStakingTxErrorAck(ack.error, hash)
  if (!acknowledged) return s
  const terminalModalOpen =
    s.dialogOpen &&
    (s.uiPhase === "confirmed" ||
      s.uiPhase === "success" ||
      s.uiPhase === "failed" ||
      s.uiPhase === "error")
  return terminalModalOpen ? s : createIdleTransactionStatusSnapshot()
}

function scheduleSubmittedToConfirmingHandoff(run: () => void) {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(run)
  } else {
    queueMicrotask(run)
  }
}

function syncDetachedProgressToastFromSnapshot(s: TransactionStatusSnapshot): void {
  if (!s.scenario || s.dialogOpen) return
  if (isDetachedTxAwaitingWalletSignature(s)) {
    syncStakingTxWalletWaitProgressToast(s)
    return
  }
  dismissStakingTxWalletWaitProgressToast(s.scenario, s.submissionId)
  const hash = deriveCurrentTxHashFromSnapshot(s)
  if (!hash?.trim()) return
  if (!isDetachedTxAwaitingReceipt(s)) return
  syncStakingTxLifecycleProgressToast(
    s.scenario,
    hash,
    s.uiPhase === "submitted" ? "submitted" : "confirming",
    { amountLabel: s.amountLabel, showView: true, submissionId: s.submissionId }
  )
}

/**
 * Restore after modal close — one sync after Sonner's internal mount tick.
 * (Sonner publishes toasts via setTimeout(0); immediate double-sync caused 4× custom/update.)
 */
let detachedLifecycleToastRestorePending = false

function scheduleDetachedLifecycleToastRestore(
  readSnapshot: () => TransactionStatusSnapshot
): void {
  if (detachedLifecycleToastRestorePending) return
  detachedLifecycleToastRestorePending = true
  const run = () => {
    detachedLifecycleToastRestorePending = false
    syncDetachedProgressToastFromSnapshot(readSnapshot())
  }
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      requestAnimationFrame(run)
    })
  } else {
    queueMicrotask(run)
  }
}

function snapshotDepositExecution(s: TransactionStatusSnapshot) {
  return deriveDepositApprovalExecution({
    needsApproval: s.needsApproval,
    depositApprovalKind: s.depositApprovalKind,
    approvalMode: s.approvalMode,
  })
}

function snapshotApprovalTrackSatisfied(s: TransactionStatusSnapshot): boolean {
  return (
    snapshotDepositExecution(s) === "skip" ||
    s.approveComplete ||
    Boolean(s.approveTxHash?.trim())
  )
}

function snapshotAwaitingDepositSignatureWithoutHash(
  s: TransactionStatusSnapshot
): boolean {
  if (s.scenario !== "deposit" || s.uiPhase !== "awaiting_signature") return false
  if (s.depositTxHash?.trim()) return false
  return snapshotApprovalTrackSatisfied(s)
}

function initialWiresFromSnapshot(
  s: TransactionStatusSnapshot
): Pick<
  TransactionStatusSnapshot,
  "approveWirePhase" | "depositWirePhase" | "withdrawWirePhase"
> {
  if (s.scenario === "withdraw") {
    return {
      approveWirePhase: "idle",
      depositWirePhase: "idle",
      withdrawWirePhase: "awaiting_signature",
    }
  }
  if (s.scenario === "deposit") {
    const execution = snapshotDepositExecution(s)
    if (execution === "skip") {
      return {
        approveWirePhase: "idle",
        depositWirePhase: "awaiting_signature",
        withdrawWirePhase: "idle",
      }
    }
    return {
      approveWirePhase: "awaiting_signature",
      depositWirePhase: "idle",
      withdrawWirePhase: "idle",
    }
  }
  return {
    approveWirePhase: "idle",
    depositWirePhase: "awaiting_signature",
    withdrawWirePhase: "idle",
  }
}

/** Builds snapshot-shaped fragment used by `openAwaitingSignature` / `confirmPreview`. */
function pendingInputToSnapshotFields(input: OpenPendingInput): Pick<
  TransactionStatusSnapshot,
  | "scenario"
  | "needsApproval"
  | "depositApprovalKind"
  | "approvalMode"
  | "amountLabel"
  | "feeLine"
  | "previewGasEstimateReady"
  | "feeCanonical"
  | "preparingTransaction"
> {
  const feeSeed: StakingFeeCanonicalPair = mergeStakingFeeCanonicalPair(
    emptyStakingFeeCanonicalPair(),
    {
      maxWeiHex: input.feeCanonicalMaxWeiHex ?? null,
      displayLine: input.feeLine,
    }
  )
  return {
    scenario: input.scenario,
    needsApproval: input.needsApproval,
    depositApprovalKind:
      input.scenario === "deposit" && input.needsApproval
        ? input.depositApprovalKind ?? null
        : null,
    approvalMode: input.approvalMode ?? "limited",
    amountLabel: input.amountLabel,
    feeLine: input.feeLine,
    previewGasEstimateReady: input.previewGasEstimateReady ?? false,
    feeCanonical: feeSeed,
    preparingTransaction: false,
  }
}

function allowsHashMutation(phase: TransactionStatusUiPhase | null): boolean {
  return isTransactionStatusInFlightPhase(phase) || phase === "pending"
}

/** Phase 29–35 — receipt terminal UI: frozen rows use execution-target equality; legacy uses coordinator commit gate; runtime swaps blocked while modal non-terminal + frozen runtime (policy). */
function receiptRuntimeTerminalCommitAllowed(
  s: TransactionStatusSnapshot,
  activeExecutionTarget: ReturnType<typeof deriveRuntimeExecutionTarget>,
  registerTimeCoordinator: RuntimeTransitionCoordinatorSnapshot,
  latestCoordinatorSnapshotRef: {
    current: RuntimeTransitionCoordinatorSnapshot
  }
): boolean {
  if (s.transactionRuntime != null) {
    return executionTargetEquals(
      resolveFrozenExecutionTarget(s.transactionRuntime),
      activeExecutionTarget
    )
  }
  return canRuntimeOperationCommitWithDevTrace(
    "TransactionStatusProvider:receiptTerminal_legacyCommit",
    registerTimeCoordinator,
    latestCoordinatorSnapshotRef.current
  )
}

export function TransactionStatusProvider({ children }: { children: ReactNode }) {
  const vault = useStakingVault()
  const {
    executionConnected,
    executionAddress,
    executionChainId,
    stakingOwnerAddress,
    runtimeWalletAddress,
  } = vault
  const activeRuntimeSelection = useActiveRuntimeSelection()
  const transition = useRuntimeTransitionSnapshot()
  const [snapshot, setSnapshotState] = useState<TransactionStatusSnapshot>(() =>
    createIdleTransactionStatusSnapshot()
  )
  const [walletWaitManualHintRevision, setWalletWaitManualHintRevision] =
    useState(0)
  const setSnapshot = useCallback(
    (
      update:
        | TransactionStatusSnapshot
        | ((prev: TransactionStatusSnapshot) => TransactionStatusSnapshot)
    ) => {
      setSnapshotState(prev => {
        const next = typeof update === "function" ? update(prev) : update
        return applyTerminalSnapshotBarrier(prev, next)
      })
    },
    []
  )
  const snapshotTelemetryRef = useRef(snapshot)
  snapshotTelemetryRef.current = snapshot

  const { status: appKitAccountStatus } = useAppKitAccount({ namespace: "eip155" })
  useMobileStakingLanLogBootstrap({
    walletAddress: executionAddress ?? runtimeWalletAddress,
    chainId: executionChainId,
    appKitAccountStatus: appKitAccountStatus ?? null,
    snapshot,
  })

  useEffect(() => {
    traceTxMobileSetSnapshotContext({
      uiPhase: snapshot.uiPhase,
      dialogOpen: snapshot.dialogOpen,
    })
  }, [snapshot.uiPhase, snapshot.dialogOpen])

  useStakingTxSignatureStallWatchdog({
    readSnapshot: () => snapshotTelemetryRef.current,
    executionConnected,
    executionAddress,
    awaitingSigner: vault.awaitingSigner,
    canTransact: vault.canTransact,
    loading: vault.loading,
  })

  useStakingVaultTxLoadingDesyncInvariantDev({
    vaultLoading: vault.loading,
    snapshot,
    executionConnected,
  })

  const [retryRequest, setRetryRequest] = useState<TransactionStatusRetryRequest>({
    nonce: 0,
    scenario: null,
  })
  const retryTapGuardMsRef = useRef(0)
  const markPostApprovalStakeWalletTerminalRef = useRef<
    (input: MarkPostApprovalStakeWalletTerminalInput) => void
  >(() => {})
  const previewConfirmLockRef = useRef(false)
  const [previewConfirmLocked, setPreviewConfirmLocked] = useState(false)
  const releasePreviewConfirmLock = useCallback((reason: string) => {
    if (previewConfirmLockRef.current) {
      previewConfirmLockRef.current = false
      setPreviewConfirmLocked(false)
      traceTxMobilePipeline("preview_confirm_lock_released", { reason })
    }
  }, [])
  const [tortureHydrateNonce, setTortureHydrateNonce] = useState(0)
  const dismissEpilogueTimerRef = useRef<number | null>(null)
  const persistTimerRef = useRef<number | null>(null)
  const restoredPersistedRef = useRef(false)
  /** Supersede stale `reconcilePersistedTxSnapshot` results (StrictMode + overlapping runs). */
  const persistedHydrateGenRef = useRef(0)
  const walletIdentityRef = useRef<{
    addr: string | null
    chain: number | null
  }>({ addr: null, chain: null })
  /** Dedupes Sonner success for the same final tx hash (reload / double resolve). */
  const receiptSuccessToastShownRef = useRef<Set<string>>(new Set())
  /** Dedupes Sonner error continuation / modal ack for the same final tx hash. */
  const receiptErrorToastShownRef = useRef<Set<string>>(new Set())
  /** One in-flight `registerReceiptCompletion` handler per final tx hash. */
  const receiptHandlerRegisteredRef = useRef<Set<string>>(new Set())
  /** DEV guard: detached terminal finalize must be one owner per hash. */
  const detachedTerminalFinalizedRef = useRef<Set<string>>(new Set())
  const modalOpenedPerfRef = useRef<number | null>(null)
  const uiPhaseEnteredPerfRef = useRef<number>(0)
  const lastUiPhaseWatchRef = useRef<TransactionStatusUiPhase | null>(null)
  const prevDialogOpenForToastRef = useRef(false)

  useLayoutEffect(() => {
    if (!(process.env.NODE_ENV !== 'production') || !isRuntimeTortureSuiteEnabled()) return () => {}
    return registerRuntimeTortureWalletContext(() => {
      const addr = runtimeWalletAddress?.trim()
      if (!addr || executionChainId == null) return null
      return { address: addr, chainId: executionChainId }
    })
  }, [runtimeWalletAddress, executionChainId])

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production') || !isRuntimeTortureSuiteEnabled()) return
    const on = () => {
      restoredPersistedRef.current = false
      setTortureHydrateNonce(n => n + 1)
    }
    window.addEventListener(STAKING_RUNTIME_TORTURE_REHYDRATE_EVENT, on)
    return () => window.removeEventListener(STAKING_RUNTIME_TORTURE_REHYDRATE_EVENT, on)
  }, [])

  /** Phase 35 — runtime swap policy reads latest modal snapshot (no picker UI). */
  useLayoutEffect(() => {
    registerRuntimeSwapTxModalSurfaceGetter(() => ({
      dialogOpen: snapshot.dialogOpen,
      transactionRuntime: snapshot.transactionRuntime,
      uiPhase: snapshot.uiPhase,
    }))
    return () => {
      registerRuntimeSwapTxModalSurfaceGetter(null)
    }
  }, [snapshot.dialogOpen, snapshot.transactionRuntime, snapshot.uiPhase])

  useLayoutEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    return devRegisterRuntimeStressTxSnapshotProbe(() => ({
      dialogOpen: snapshot.dialogOpen,
      uiPhase: snapshot.uiPhase,
      hasFrozenRuntime: snapshot.transactionRuntime != null,
    }))
  }, [snapshot.dialogOpen, snapshot.transactionRuntime, snapshot.uiPhase])

  const clearDismissEpilogueTimer = useCallback(() => {
    if (dismissEpilogueTimerRef.current !== null) {
      window.clearTimeout(dismissEpilogueTimerRef.current)
      dismissEpilogueTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearDismissEpilogueTimer()
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
    }
  }, [clearDismissEpilogueTimer])

  useEffect(() => {
    stakingMobileResumeStore.install()
  }, [])

  useEffect(() => {
    registerStakingTxModalActivityProbe(() => ({
      dialogOpen: snapshotTelemetryRef.current.dialogOpen,
      uiPhase: snapshotTelemetryRef.current.uiPhase,
    }))
    return () => registerStakingTxModalActivityProbe(null)
  }, [])

  useEffect(() => {
    const snap = snapshotTelemetryRef.current
    if (!snap.dialogOpen || snap.scenario == null) return

    const phase = snap.uiPhase
    const txNeedsSigner =
      vault.awaitingSigner ||
      (!vault.txExecutionReady &&
        (snap.preparingTransaction ||
          phase === "preview" ||
          phase === "awaiting_signature" ||
          phase === "pending"))
    if (!txNeedsSigner) return

    return stakingMobileResumeStore.subscribe(() => {
      const mobile = stakingMobileResumeStore.getSnapshot()
      if (mobile.visibilityState !== "visible") return
      const live = snapshotTelemetryRef.current
      if (!live.dialogOpen || live.scenario == null) return
      requestEvmSignerHydrationRecovery(
        `tx_modal_signer_resume:${live.uiPhase ?? "unknown"}`
      )
    })
  }, [
    vault.awaitingSigner,
    vault.txExecutionReady,
    snapshot.dialogOpen,
    snapshot.uiPhase,
    snapshot.scenario,
    snapshot.preparingTransaction,
  ])

  const clearPersistedTransactionState = useCallback(() => {
    stakingLifecycleTrace("persistence", "clearPersistedTransactionState", {})
    clearPersistedStakingTxSession("api_clearPersistedTransactionState")
    clearPersistedStakingTxUserRejection("api_clearPersistedTransactionState")
  }, [])

  const dismissDetachedProgressForSnapshot = useCallback(
    (s: TransactionStatusSnapshot) => {
      dismissDetachedTxProgressToastForSnapshot(s)
    },
    []
  )

  const resetTransactionLifecycle = useCallback(() => {
    const live = snapshotTelemetryRef.current
    if (hasActiveStakingTxContinuity(live) && !isTransactionStatusTerminalUiPhase(live.uiPhase)) {
      traceTxLifecycleResetBlocked(live, "reset_transaction_lifecycle")
    }
    stakingLifecycleTrace("tx-dialog", "resetTransactionLifecycle", {})
    traceMobileStakingFlow("tx_lifecycle_reset", {
      uiPhase: snapshotTelemetryRef.current.uiPhase,
      submissionId: snapshotTelemetryRef.current.submissionId,
      scenario: snapshotTelemetryRef.current.scenario,
    })
    abandonStakingVaultTxExecutionLoading("reset_transaction_lifecycle")
    clearDismissEpilogueTimer()
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current)
      persistTimerRef.current = null
    }
    setSnapshot(s => {
      dismissDetachedProgressForSnapshot(s)
      return createIdleTransactionStatusSnapshot()
    })
    clearPersistedStakingTxSession("reset_transaction_lifecycle")
    traceTxSnapshotCleared(snapshotTelemetryRef.current, "reset_transaction_lifecycle")
    clearPersistedStakingTxUserRejection("reset_transaction_lifecycle")
    releasePreviewConfirmLock("reset_transaction_lifecycle")
    receiptSuccessToastShownRef.current.clear()
    receiptErrorToastShownRef.current.clear()
    receiptHandlerRegisteredRef.current.clear()
    detachedTerminalFinalizedRef.current.clear()
    setRetryRequest({ nonce: 0, scenario: null })
  }, [clearDismissEpilogueTimer, dismissDetachedProgressForSnapshot, releasePreviewConfirmLock])

  const close = useCallback(() => {
    const live = snapshotTelemetryRef.current
    if (hasActiveStakingTxContinuity(live) && !isTransactionStatusTerminalUiPhase(live.uiPhase)) {
      traceTxLifecycleResetBlocked(live, "close_idle")
    }
    stakingTxLifecycleDev("close")
    traceMobileStakingFlow("tx_modal_closed", {
      source: "close_idle",
      uiPhase: snapshotTelemetryRef.current.uiPhase,
      submissionId: snapshotTelemetryRef.current.submissionId,
      scenario: snapshotTelemetryRef.current.scenario,
    })
    abandonStakingVaultTxExecutionLoading("close_idle")
    clearDismissEpilogueTimer()
    releasePreviewConfirmLock("close")
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current)
      persistTimerRef.current = null
    }
    setSnapshot(s => {
      dismissDetachedProgressForSnapshot(s)
      return createIdleTransactionStatusSnapshot()
    })
    clearPersistedStakingTxSession("close_idle")
    traceTxSnapshotCleared(snapshotTelemetryRef.current, "close_idle")
    receiptSuccessToastShownRef.current.clear()
    receiptErrorToastShownRef.current.clear()
    receiptHandlerRegisteredRef.current.clear()
    detachedTerminalFinalizedRef.current.clear()
  }, [clearDismissEpilogueTimer, dismissDetachedProgressForSnapshot, releasePreviewConfirmLock])

  const finalizeDetachedTerminalSnapshot = useCallback(() => {
    const s = snapshotTelemetryRef.current
    if (!isDetachedTerminalTxSnapshot(s) || !s.scenario) return

    const scenario = s.scenario
    const hash = deriveCurrentTxHashFromSnapshot(s)?.trim() ?? ""
    if (hash) {
      if (detachedTerminalFinalizedRef.current.has(hash)) {
        stakingTxIntegrityDev("duplicate_detached_terminal_finalize", {
          scenario,
          hash,
          uiPhase: s.uiPhase,
        })
      }
      detachedTerminalFinalizedRef.current.add(hash)
    } else {
      stakingTxIntegrityDev("detached_terminal_finalize_without_hash", {
        scenario,
        uiPhase: s.uiPhase,
      })
    }

    if (s.uiPhase === "confirmed" || s.uiPhase === "success") {
      if (hash && claimStakingTxSuccessAck(receiptSuccessToastShownRef.current, hash)) {
        const amountLabel = (s.successAmountLabel || s.amountLabel).trim()
        queueMicrotask(() => {
          completeStakingTxLifecycleToast(scenario, hash, "success", {
            amountLabel: amountLabel !== "" ? amountLabel : undefined,
            submissionId: s.submissionId,
          })
        })
      }
    } else if (s.uiPhase === "failed" || s.uiPhase === "error") {
      if (hash && claimStakingTxErrorAck(receiptErrorToastShownRef.current, hash)) {
        queueMicrotask(() => {
          completeStakingTxLifecycleToast(scenario, hash, "failed", {
            amountLabel: s.errorMessage.trim() || undefined,
            submissionId: s.submissionId,
          })
        })
      }
    } else if (hash) {
      dismissStakingTxLifecycleToast(scenario, hash, s.submissionId)
    }

    if (hash) receiptHandlerRegisteredRef.current.delete(hash)
    clearPersistedStakingTxSession("detached_terminal_finalize")
    traceMobileStakingFlow("tx_lifecycle_reset", {
      source: "detached_terminal_finalize",
      uiPhase: snapshotTelemetryRef.current.uiPhase,
      submissionId: snapshotTelemetryRef.current.submissionId,
    })
    setSnapshot(createIdleTransactionStatusSnapshot())
    setRetryRequest({ nonce: 0, scenario: null })
  }, [])

  useEffect(() => {
    if (!isDetachedTerminalTxSnapshot(snapshotTelemetryRef.current)) return
    finalizeDetachedTerminalSnapshot()
  }, [
    snapshot.dialogOpen,
    snapshot.uiPhase,
    snapshot.scenario,
    finalizeDetachedTerminalSnapshot,
  ])

  const healStakingTxContinuity = useCallback(
    (action: StakingTxContinuityHealAction) => {
      if (action === "finalize_detached_terminal") {
        finalizeDetachedTerminalSnapshot()
        return
      }
      if (action === "reset_idle_modal_open") {
        stakingTxIntegrityDev("continuity_heal_idle_modal_open", {})
        traceMobileStakingFlow("tx_lifecycle_reset", {
          source: "continuity_heal_idle_modal_open",
          uiPhase: snapshotTelemetryRef.current.uiPhase,
          submissionId: snapshotTelemetryRef.current.submissionId,
        })
        setSnapshot(stakingTxContinuityIdleSnapshot())
        clearPersistedStakingTxSession("continuity_heal_idle_modal_open")
        return
      }
      if (action === "reset_orphan_detached_inflight") {
        stakingTxIntegrityDev("continuity_heal_orphan_detached", {})
        traceMobileStakingFlow("tx_lifecycle_reset", {
          source: "continuity_heal_orphan_detached",
          uiPhase: snapshotTelemetryRef.current.uiPhase,
          submissionId: snapshotTelemetryRef.current.submissionId,
        })
        dismissDetachedProgressForSnapshot(snapshotTelemetryRef.current)
        setSnapshot(stakingTxContinuityIdleSnapshot())
        clearPersistedStakingTxSession("continuity_heal_orphan_detached")
        setRetryRequest({ nonce: 0, scenario: null })
        detachedTerminalFinalizedRef.current.clear()
      }
    },
    [finalizeDetachedTerminalSnapshot, dismissDetachedProgressForSnapshot]
  )

  useStakingTxContinuityGuardsDev({
    snapshot,
    onHeal: healStakingTxContinuity,
  })

  const dismissSubmittedModal = useCallback(() => {
    const live = snapshotTelemetryRef.current
    stakingTxLifecycleDev("dismissSubmittedModal")
    traceTxModalCloseUiOnly(live, "dismiss_submitted_modal")
    traceMobileStakingFlow("tx_modal_closed", {
      source: "dismiss_submitted_modal",
      uiPhase: snapshotTelemetryRef.current.uiPhase,
      submissionId: snapshotTelemetryRef.current.submissionId,
      scenario: snapshotTelemetryRef.current.scenario,
    })
    clearDismissEpilogueTimer()
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current)
      persistTimerRef.current = null
    }
    setSnapshot(s => {
      if (s.uiPhase !== "submitted" && s.uiPhase !== "confirming") {
        return s
      }
      return { ...s, dialogOpen: false }
    })
  }, [clearDismissEpilogueTimer])

  const dismissInFlightModalUiOnly = useCallback(() => {
    const live = snapshotTelemetryRef.current
    stakingTxLifecycleDev("dismissInFlightModalUiOnly")
    traceTxModalCloseUiOnly(live, "dismiss_in_flight_modal_ui_only")
    traceMobileStakingFlow("tx_modal_closed", {
      source: "dismiss_in_flight_modal_ui_only",
      uiPhase: live.uiPhase,
      submissionId: live.submissionId,
      scenario: live.scenario,
    })
    clearDismissEpilogueTimer()
    setSnapshot(s => {
      const uiOnlyDismissable =
        s.uiPhase === "pending" ||
        s.uiPhase === "awaiting_signature" ||
        (s.uiPhase === "preview" && s.preparingTransaction)
      if (!uiOnlyDismissable) return s
      return { ...s, dialogOpen: false }
    })
  }, [clearDismissEpilogueTimer])

  const reopenDetachedTransactionModal = useCallback(() => {
    const live = snapshotTelemetryRef.current
    stakingTxLifecycleDev("reopenDetachedTransactionModal")
    traceTxVisualOwnerTransition(live, "reopen_detached_modal")
    setSnapshot(s => {
      if (!isDetachedTxWithProgressSurface(s)) return s
      return { ...s, dialogOpen: true }
    })
    notifyRecoveredWalletWaitDetected(live, "reopen_detached_modal")
  }, [])

  const cancelRecoveredPreHashWalletWait = useCallback((source: string) => {
    const live = snapshotTelemetryRef.current
    if (
      isPostApprovalStakeWalletWait(live) &&
      live.submissionId != null &&
      live.submissionId > 0
    ) {
      markPostApprovalStakeWalletTerminalRef.current({
        submissionId: live.submissionId,
        kind: "user_rejected",
        source,
        flowRunId: live.runId ?? undefined,
      })
      return
    }
    stakingTxLifecycleDev("cancelRecoveredPreHashWalletWait", { source })
    clearPersistedStakingTxSession(source)
    if (live.scenario) {
      dismissStakingTxWalletWaitProgressToast(live.scenario, live.submissionId)
    }
    setSnapshot(s => {
      if (!isPreHashWalletWaitSnapshot(s)) return s
      return {
        ...s,
        uiPhase: "cancelled",
        dialogOpen: false,
        preparingTransaction: false,
        errorMessage: STAKING_TX_UX_WALLET_CONFIRMATION_CANCELLED,
        terminal: true,
        terminalReason: "user_rejected",
      }
    })
  }, [])

  const requestRecoveredWalletHandoff = useCallback((source: string) => {
    requestRecoveredWalletOpenOnGesture(snapshotTelemetryRef.current, source, {
      rearmed: true,
    })
  }, [])

  useEffect(() => {
    setDetachedTxToastSuppressedReader(() => {
      const s = snapshotTelemetryRef.current
      return s.dialogOpen && s.scenario != null
    })
    return () => setDetachedTxToastSuppressedReader(null)
  }, [])

  useEffect(() => {
    setStakingTxLifecycleToastActions({
      reopenModal: reopenDetachedTransactionModal,
      requestRecoveredWalletHandoff,
    })
    return () => setStakingTxLifecycleToastActions(null)
  }, [reopenDetachedTransactionModal, requestRecoveredWalletHandoff])

  useEffect(() => installRecoveredWalletHandoffListeners(), [])

  const registerReceiptCompletion = useCallback(
    (input: RegisterReceiptCompletionInput) => {
      const h = input.txHash.trim()
      if (!h) return
      if (
        hasStakingTxSuccessAck(receiptSuccessToastShownRef.current, h) ||
        hasStakingTxErrorAck(receiptErrorToastShownRef.current, h)
      ) {
        stakingTxLifecycleDev("registerReceiptCompletion_skip_terminal_ack", {
          hash: h,
        })
        return
      }
      if (receiptHandlerRegisteredRef.current.has(h)) {
        stakingTxLifecycleDev("registerReceiptCompletion_deduped", { hash: h })
        return
      }
      receiptHandlerRegisteredRef.current.add(h)
      const registerTimeCoordinator = transition.coordinatorSnapshot
      const receiptEventPrefix =
        input.errorStage === "approval"
          ? "approval"
          : input.scenario === "withdraw"
            ? "withdraw"
            : "stake"
      traceMobileStakingFlow(`${receiptEventPrefix}_receipt_wait_start` as "approval_receipt_wait_start", {
        hashPrefix: h.slice(0, 18),
        scenario: input.scenario,
        errorStage: input.errorStage,
      })

      void input.receiptWait.then(
        () => {
          traceMobileStakingFlow(`${receiptEventPrefix}_receipt_wait_resolved` as "approval_receipt_wait_resolved", {
            hashPrefix: h.slice(0, 18),
            scenario: input.scenario,
            errorStage: input.errorStage,
          })
          const activeExecutionTarget = deriveRuntimeExecutionTarget(
            activeRuntimeSelection
          )
          setSnapshot(s => {
            if (hasStakingTxSuccessAck(receiptSuccessToastShownRef.current, h)) {
              return snapshotAfterTerminalAck(s, h, {
                success: receiptSuccessToastShownRef.current,
                error: receiptErrorToastShownRef.current,
              })
            }

            const scenario = input.scenario
            const successDedupeId = createStakingToastDedupeKey(
              "tx_modal",
              "receipt_success",
              scenario,
              h.toLowerCase()
            )
            const successTitle =
              scenario === "deposit" ? "Deposit confirmed" : "Withdraw confirmed"
            const successDescription =
              input.amountLabel.trim() !== "" ? input.amountLabel.trim() : undefined

            if (s.dialogOpen) {
              dismissStakingTxLifecycleToast(scenario, h, s.submissionId)
              const hLower = h.toLowerCase()
              if (scenario === "deposit") {
                if (input.errorStage === "approval") {
                  const approveHash = s.approveTxHash?.trim().toLowerCase() ?? ""
                  if (!approveHash || approveHash !== hLower || s.approveComplete) {
                    stakingTxIntegrityDev("receipt_success_approval_stage_ownership_mismatch", {
                      hash: h,
                      approveHash,
                      approveComplete: s.approveComplete,
                      uiPhase: s.uiPhase,
                    })
                    return s
                  }
                } else {
                  const depositHash = s.depositTxHash?.trim().toLowerCase() ?? ""
                  if (!depositHash || depositHash !== hLower) {
                    stakingTxIntegrityDev("receipt_success_deposit_stage_ownership_mismatch", {
                      hash: h,
                      depositHash,
                      errorStage: input.errorStage,
                      uiPhase: s.uiPhase,
                    })
                    return s
                  }
                }
              }
              if (s.uiPhase === "confirmed" || s.uiPhase === "success") {
                if (snapshotMatchesReceiptHash(s, h)) {
                  claimStakingTxSuccessAck(receiptSuccessToastShownRef.current, h)
                }
                return s
              }
              if (!snapshotMatchesReceiptHash(s, h)) {
                stakingTxIntegrityDev("receipt_completion_hash_mismatch", {
                  hash: h,
                  scenario,
                  uiPhase: s.uiPhase,
                })
                return s
              }
              if (s.uiPhase !== "submitted" && s.uiPhase !== "confirming") {
                stakingTxIntegrityDev("receipt_completion_phase_skew", {
                  hash: h,
                  scenario,
                  uiPhase: s.uiPhase,
                })
                return s
              }
              if (
                !receiptRuntimeTerminalCommitAllowed(
                  s,
                  activeExecutionTarget,
                  registerTimeCoordinator,
                  transition.latestCoordinatorSnapshotRef
                )
              ) {
                stakingTxIntegrityDev("receipt_completion_execution_target_skew", {
                  hash: h,
                  scenario,
                })
                return s
              }

              if (!claimStakingTxSuccessAck(receiptSuccessToastShownRef.current, h)) {
                return s
              }
              receiptHandlerRegisteredRef.current.delete(h)
              stakingSentryBreadcrumb("tx_confirmed", {
                scenario,
                has_tx_hash: true,
              })
              if (scenario === "withdraw") {
                traceMobileStakingFlow("withdraw_confirmed", {
                  hashPrefix: h.slice(0, 18),
                  submissionId: s.submissionId,
                  flowRunId: s.runId,
                })
                traceMobileStakingFlow("withdraw_success_terminal_applied", {
                  hashPrefix: h.slice(0, 18),
                  submissionId: s.submissionId,
                  flowRunId: s.runId,
                  visualOwner: s.dialogOpen ? "modal" : "toast",
                  modalVisible: s.dialogOpen,
                })
              }

              const explorerUrl = stakingTxExplorerUrlForFrozenRuntime(
                s.transactionRuntime,
                h,
                s.transactionRuntime == null ? executionChainId ?? null : null
              )

              const mergedFee = mergeStakingFeeCanonicalPair(s.feeCanonical, {
                maxWeiHex: input.feeMaxWeiHex ?? null,
                displayLine: input.feeLine,
              })
              const successFeeLine =
                mergedFee.displayLine.trim() !== ""
                  ? mergedFee.displayLine
                  : input.feeLine

              return {
                ...s,
                uiPhase: "confirmed",
                dialogOpen: true,
                successAmountLabel: input.amountLabel,
                successFeeLine: successFeeLine,
                successExplorerUrl: explorerUrl,
                errorMessage: "",
                feeCanonical: mergedFee,
                preparingTransaction: false,
                approveWirePhase: "done" as TransactionWireStepPhase,
                depositWirePhase: "done" as TransactionWireStepPhase,
                withdrawWirePhase: "done" as TransactionWireStepPhase,
              }
            }

            stakingTxIntegrityDev("receipt_success_dialog_closed", {
              hash: h,
              uiPhase: s.uiPhase,
            })

            if (!claimStakingTxSuccessAck(receiptSuccessToastShownRef.current, h)) {
              return snapshotAfterTerminalAck(s, h, {
                success: receiptSuccessToastShownRef.current,
                error: receiptErrorToastShownRef.current,
              })
            }
            receiptHandlerRegisteredRef.current.delete(h)

            if (
              shouldEmitReceiptSuccessSonnerToast({
                receiptSuccessAlreadyAcknowledgedForHash: false,
                modalSurfacesReceiptSuccess: false,
              })
            ) {
              queueMicrotask(() => {
                if (isDetachedTxAwaitingReceipt(s)) {
                  completeStakingTxLifecycleToast(scenario, h, "success", {
                    amountLabel: successDescription,
                    submissionId: s.submissionId,
                  })
                } else {
                  stakingToastSuccess(successTitle, {
                    dedupeId: successDedupeId,
                    description: successDescription,
                  })
                }
              })
            }

            return createIdleTransactionStatusSnapshot()
          })
        },
        receiptErr => {
          traceMobileStakingFlow(`${receiptEventPrefix}_receipt_wait_rejected` as "approval_receipt_wait_rejected", {
            hashPrefix: h.slice(0, 18),
            scenario: input.scenario,
            errorStage: input.errorStage,
          }, receiptErr)
          if (isStakingWalletUserRejectedError(receiptErr)) {
            receiptHandlerRegisteredRef.current.delete(h)
            setSnapshot(s => {
              if (!isDetachedTxAwaitingReceipt(s)) return s
              dismissStakingTxLifecycleToast(input.scenario, h, s.submissionId)
              return createIdleTransactionStatusSnapshot()
            })
            return
          }
          const sentryTags = stakingSentryTagsFromDeployment({
            deploymentId: activeRuntimeSelection.deployment.id,
            chainFamily: activeRuntimeSelection.deployment.chainFamily,
          })
          stakingSentryBreadcrumb("tx_failed", {
            scenario: input.scenario,
            has_tx_hash: h.length > 0,
          })
          captureStakingException(receiptErr, {
            ...sentryTags,
            txPhase: input.scenario,
            extra: {
              tx_hash_present: h.length > 0,
              error_stage: input.errorStage,
            },
          })
          const activeExecutionTarget = deriveRuntimeExecutionTarget(
            activeRuntimeSelection
          )
          const message = getStakingTransactionErrorMessage(
            receiptErr,
            input.errorStage,
          )
          const errLine = message.description?.trim()
            ? `${message.title}\n${message.description}`
            : message.title

          const scenario = input.scenario
          const errDedupeId = createStakingToastDedupeKey(
            "tx_modal",
            "receipt_error",
            scenario,
            h.toLowerCase()
          )

          setSnapshot(s => {
            if (hasStakingTxErrorAck(receiptErrorToastShownRef.current, h)) {
              return snapshotAfterTerminalAck(s, h, {
                success: receiptSuccessToastShownRef.current,
                error: receiptErrorToastShownRef.current,
              })
            }

            if (s.dialogOpen) {
              dismissStakingTxLifecycleToast(scenario, h, s.submissionId)
              const hLower = h.toLowerCase()
              if (scenario === "deposit") {
                if (input.errorStage === "approval") {
                  const approveHash = s.approveTxHash?.trim().toLowerCase() ?? ""
                  if (!approveHash || approveHash !== hLower || s.approveComplete) {
                    stakingTxIntegrityDev("receipt_error_approval_stage_ownership_mismatch", {
                      hash: h,
                      approveHash,
                      approveComplete: s.approveComplete,
                      uiPhase: s.uiPhase,
                    })
                    return s
                  }
                } else {
                  const depositHash = s.depositTxHash?.trim().toLowerCase() ?? ""
                  if (!depositHash || depositHash !== hLower) {
                    stakingTxIntegrityDev("receipt_error_deposit_stage_ownership_mismatch", {
                      hash: h,
                      depositHash,
                      errorStage: input.errorStage,
                      uiPhase: s.uiPhase,
                    })
                    return s
                  }
                }
              }
              if (s.uiPhase === "failed" || s.uiPhase === "error") {
                if (snapshotMatchesReceiptHash(s, h)) {
                  claimStakingTxErrorAck(receiptErrorToastShownRef.current, h)
                }
                return s
              }
              if (!snapshotMatchesReceiptHash(s, h)) {
                stakingTxIntegrityDev("receipt_error_hash_mismatch", {
                  hash: h,
                  scenario,
                  uiPhase: s.uiPhase,
                })
                return s
              }
              if (s.uiPhase !== "submitted" && s.uiPhase !== "confirming") {
                stakingTxIntegrityDev("receipt_error_phase_skew", {
                  hash: h,
                  scenario,
                  uiPhase: s.uiPhase,
                })
                return s
              }
              if (
                !receiptRuntimeTerminalCommitAllowed(
                  s,
                  activeExecutionTarget,
                  registerTimeCoordinator,
                  transition.latestCoordinatorSnapshotRef
                )
              ) {
                stakingTxIntegrityDev("receipt_error_execution_target_skew", {
                  hash: h,
                  scenario,
                })
                return s
              }

              if (!claimStakingTxErrorAck(receiptErrorToastShownRef.current, h)) {
                return s
              }
              receiptHandlerRegisteredRef.current.delete(h)

              const next: TransactionStatusSnapshot = {
                ...s,
                uiPhase: "failed",
                dialogOpen: true,
                preparingTransaction: false,
                errorMessage: errLine,
              }
              if (scenario === "withdraw") {
                const w = s.withdrawWirePhase
                if (w !== "idle" && w !== "done") {
                  next.withdrawWirePhase = "failed"
                }
              } else {
                const d = s.depositWirePhase
                if (d !== "idle" && d !== "done") {
                  next.depositWirePhase = "failed"
                }
              }
              return next
            }

            stakingTxIntegrityDev("receipt_error_dialog_closed", {
              hash: h,
              uiPhase: s.uiPhase,
            })

            if (!claimStakingTxErrorAck(receiptErrorToastShownRef.current, h)) {
              return snapshotAfterTerminalAck(s, h, {
                success: receiptSuccessToastShownRef.current,
                error: receiptErrorToastShownRef.current,
              })
            }
            receiptHandlerRegisteredRef.current.delete(h)

            if (
              shouldEmitReceiptErrorSonnerToast({
                receiptErrorAlreadyAcknowledgedForHash: false,
                modalSurfacesReceiptError: false,
              })
            ) {
              queueMicrotask(() => {
                if (isDetachedTxAwaitingReceipt(s)) {
                  completeStakingTxLifecycleToast(scenario, h, "failed", {
                    amountLabel: message.description ?? undefined,
                    submissionId: s.submissionId,
                  })
                } else {
                  stakingToastError(message.title, {
                    description: message.description ?? undefined,
                    dedupeId: errDedupeId,
                  })
                }
              })
            }

            return createIdleTransactionStatusSnapshot()
          })
        },
      )
    },
    [executionChainId, activeRuntimeSelection, transition],
  )

  const postBroadcastHash = useMemo(() => {
    const s = snapshot
    if (s.uiPhase !== "submitted" && s.uiPhase !== "confirming") return null
    return deriveCurrentTxHashFromSnapshot(s)?.trim() ?? null
  }, [snapshot])

  useEffect(() => {
    if (!postBroadcastHash) return
  }, [postBroadcastHash, snapshot.uiPhase, snapshot.scenario, snapshot.approveComplete, snapshot.approveTxHash, snapshot.depositTxHash, snapshot.dialogOpen])

  /** Re-attach receipt ownership when broadcast `receiptWait` was lost (reload / BFCache). */
  useEffect(() => {
    const s = snapshotTelemetryRef.current
    const hash = postBroadcastHash
    const scenario = s.scenario
    if (!hash || !scenario) return
    const approvalExecution =
      scenario === "deposit"
        ? deriveDepositApprovalExecution({
            needsApproval: s.needsApproval,
            depositApprovalKind: s.depositApprovalKind,
            approvalMode: s.approvalMode,
          })
        : "skip"
    const isIntermediateApprovalOwnership =
      scenario === "deposit" &&
      approvalExecution !== "skip" &&
      !s.approveComplete &&
      (s.approveTxHash?.trim() ?? "") === hash &&
      !(s.depositTxHash?.trim())
    if (isIntermediateApprovalOwnership) {
      return
    }
    if (
      hasStakingTxSuccessAck(receiptSuccessToastShownRef.current, hash) ||
      hasStakingTxErrorAck(receiptErrorToastShownRef.current, hash)
    ) {
      return
    }
    if (receiptHandlerRegisteredRef.current.has(hash)) {
      stakingTxIntegrityDev("orphan_receipt_poll_overlap", {
        hash,
        scenario,
        uiPhase: s.uiPhase,
      })
      return
    }

    const reconcileContext =
      s.transactionRuntime != null
        ? transactionRuntimeToReconcileContext(s.transactionRuntime)
        : persistedTxReconcileContextFromRuntime(activeRuntimeSelection)
    const deployment = resolveStakingDeploymentForReconcile(
      getStakingDeploymentRegistry(),
      reconcileContext.deploymentId
    )
    const resolver = getReceiptResolverForDeployment(deployment)
    const ac = new AbortController()
    const feeLine =
      s.successFeeLine.trim() !== "" ? s.successFeeLine : s.feeLine

    registerReceiptCompletion({
      receiptWait: createPolledReceiptWait(resolver, hash, ac.signal),
      scenario,
      amountLabel: s.amountLabel,
      feeLine,
      feeMaxWeiHex: s.feeCanonical.maxWeiHex,
      txHash: hash,
      errorStage: deriveReceiptErrorStageFromSnapshot(s),
    })

    return () => {
      ac.abort()
    }
  }, [postBroadcastHash, activeRuntimeSelection, registerReceiptCompletion])

  /**
   * Modal ↔ detached lifecycle toast handoff (presentation only).
   * Open transition → dismiss; close while in-flight → restore same Sonner id (deferred once).
   */
  useLayoutEffect(() => {
    const s = snapshot
    const wasOpen = prevDialogOpenForToastRef.current
    const isOpen = s.dialogOpen
    const hash = deriveCurrentTxHashFromSnapshot(s)
    const detachedReceipt = isDetachedTxAwaitingReceipt(s)
    const detachedWalletWait = isDetachedTxAwaitingWalletSignature(s)

    prevDialogOpenForToastRef.current = isOpen

    if (!s.scenario) return

    if (isOpen) {
      dismissDetachedTxProgressToastForSnapshot(s)
      return
    }

    if (wasOpen && !isOpen && (detachedReceipt || detachedWalletWait)) {
      scheduleDetachedLifecycleToastRestore(() => snapshotTelemetryRef.current)
      return
    }

    if (detachedWalletWait) {
      syncStakingTxWalletWaitProgressToast(s)
      return
    }

    if (detachedReceipt && hash?.trim()) {
      syncDetachedProgressToastFromSnapshot(s)
      return
    }

    if (hash?.trim()) {
      dismissStakingTxWalletWaitProgressToast(s.scenario, s.submissionId)
    }
  }, [
    snapshot.dialogOpen,
    snapshot.uiPhase,
    snapshot.scenario,
    snapshot.submissionId,
    snapshot.preparingTransaction,
    snapshot.approveTxHash,
    snapshot.depositTxHash,
    snapshot.withdrawTxHash,
    snapshot.txHash,
    snapshot.needsApproval,
    snapshot.approveComplete,
    snapshot.approveWirePhase,
    snapshot.depositWirePhase,
  ])

  /** Visual ownership audit — detect modal/toast gaps without changing behavior. */
  useEffect(() => {
    const s = snapshotTelemetryRef.current
    traceTxVisualOwnerTransition(s, "snapshot_change")
    traceTxNoVisualOwnerIfNeeded(s, "snapshot_change")
  }, [
    snapshot.dialogOpen,
    snapshot.uiPhase,
    snapshot.scenario,
    snapshot.submissionId,
    snapshot.approveTxHash,
    snapshot.depositTxHash,
    snapshot.withdrawTxHash,
  ])

  /** sessionStorage rehydrate: reload / WebView restore / BFCache resume */
  useEffect(() => {
    if (restoredPersistedRef.current) return

    const row = readPersistedStakingTxSession()
    const rejectionRow = readPersistedStakingTxUserRejection()
    if (
      rejectionRow &&
      sessionMatchesAccount(
        {
          v: 1,
          updatedAt: rejectionRow.updatedAt,
          walletAddress: rejectionRow.walletAddress,
          chainId: rejectionRow.chainId,
          snapshot: createIdleTransactionStatusSnapshot(),
        },
        activeRuntimeSelection.deployment.chainFamily === "tron"
          ? stakingOwnerAddress
          : executionAddress,
        executionChainId
      )
    ) {
      clearPersistedStakingTxSession("hydrate_block_user_rejection_marker")
      restoredPersistedRef.current = true
      return
    }

    const isTronSurface = activeRuntimeSelection.deployment.chainFamily === "tron"
    const hydrateWalletReady = isTronSurface
      ? Boolean(stakingOwnerAddress?.trim())
      : executionConnected &&
        Boolean(executionAddress?.trim()) &&
        executionChainId != null

    if (hydrateWalletReady) {
      const stakeTerminalRow = readPersistedStakingTxStakeTerminal()
      if (
        stakeTerminalRow &&
        sessionMatchesAccount(
          {
            v: 1,
            updatedAt: stakeTerminalRow.updatedAt,
            walletAddress: stakeTerminalRow.walletAddress,
            chainId: stakeTerminalRow.chainId,
            snapshot: createIdleTransactionStatusSnapshot(),
          },
          isTronSurface ? stakingOwnerAddress : executionAddress,
          executionChainId
        )
      ) {
        restoredPersistedRef.current = true
        clearPersistedStakingTxSession("hydrate_stake_terminal_marker")
        const revived = reviveSnapshotFromStakeTerminalRow(stakeTerminalRow)
        traceStakeWalletWaitTerminal({
          event: "stake_awaiting_signature_hydrated_with_terminal_error",
          snapshot: revived,
          source: "persisted_stake_terminal",
          terminalKind: stakeTerminalRow.terminalKind,
        })
        setSnapshot(revived)
        traceTxSnapshotHydrated(revived, "stake_terminal_hydrate")
        stakingLifecycleTrace("persistence", "hydrate_stake_terminal_restored", {
          phase: revived.uiPhase,
          terminalKind: stakeTerminalRow.terminalKind,
        })
        return
      }
    }

    if (!row) {
      restoredPersistedRef.current = true
      return
    }

    if (!hydrateWalletReady) {
      return
    }

    if (
      row.walletAddress?.trim() &&
      executionAddress?.trim() &&
      !sessionMatchesAccount(row, executionAddress, executionChainId)
    ) {
      traceWalletAccountIdentity("account_restore_mismatch_detected", {
        persistedAddress: row.walletAddress,
        liveAppKitAddress: executionAddress,
        chainId: executionChainId,
        source: "persisted_hydrate_precheck",
      })
      clearPersistedStakingTxSession("persisted_wallet_mismatch_on_restore")
    }

    const persistedPhaseEarly = row.snapshot.uiPhase
    if (
      !isTronSurface &&
      isPreBroadcastTxUiPhase(persistedPhaseEarly) &&
      !vault.txExecutionReady
    ) {
      return
    }

    // EVM-only: persisted `chainId` is the AppKit / wallet chain. On Tron staking it may still reflect
    // an unrelated EVM session and must not clear a valid Tron modal session (BFCache / resume QA).
    const expected = getExpectedChainId()
    if (
      !isTronSurface &&
      row.chainId != null &&
      Number(row.chainId) !== expected
    ) {
      clearPersistedStakingTxSession("persisted_chain_mismatch_expected")
      restoredPersistedRef.current = true
      return
    }

    // Identity: account-aware when row carries v2 `hydratedSessionAccountId`; else legacy wallet+chain.
    if (
      !sessionMatchesAccount(
        row,
        isTronSurface ? stakingOwnerAddress : executionAddress,
        executionChainId
      )
    ) {
      clearPersistedStakingTxSession("persisted_wallet_mismatch_on_restore")
      restoredPersistedRef.current = true
      return
    }

    if (!isHydratablePersistedTxSession(row)) {
      clearPersistedStakingTxSession("hydrate_block_user_rejected_snapshot")
      restoredPersistedRef.current = true
      return
    }

    const persistedPhase = row.snapshot.uiPhase
    if (isTransactionStatusTerminalUiPhase(persistedPhase)) {
      clearPersistedStakingTxSession("hydrate_skip_terminal_persisted")
      restoredPersistedRef.current = true
      return
    }

    if (isPreBroadcastTxUiPhase(persistedPhase)) {
      if (!snapshotLooksIdle(snapshotTelemetryRef.current)) {
        clearPersistedStakingTxSession("hydrate_skip_over_active_snapshot")
        restoredPersistedRef.current = true
        return
      }
      if (isRecentBfCacheRestore()) {
        clearPersistedStakingTxSession("hydrate_skip_bfcache_pre_broadcast")
        restoredPersistedRef.current = true
        return
      }
    }

    const gen = ++persistedHydrateGenRef.current
    const revived = reviveSnapshotFromPersistence(row)
    const hydrateCoordinator = transition.coordinatorSnapshot
    const hydrateWallClock = performance.now()
    const recStart = performance.now()
    void (async () => {
      await devRuntimeChaosSleepHydrateLag()
      if (devRuntimeChaosShouldSkipHydrateReconcile()) {
        recordRuntimeChaosHydrateForcedSkip()
        return
      }
      let revivedForReconcile = revived
      if (
        revived.scenario === "withdraw" &&
        !revived.withdrawTxHash?.trim() &&
        (revived.uiPhase === "awaiting_signature" || revived.uiPhase === "pending")
      ) {
        const recoveredHash = await tryRecoverWithdrawTxHashFromOnChain({
          snapshot: revived,
          deployment: activeRuntimeSelection.deployment,
          tokenDecimals: vault.tokenDecimals ?? null,
          ownerAddress: executionAddress,
          source: "persisted_hydrate",
        })
        if (recoveredHash) {
          revivedForReconcile = applyRecoveredWithdrawHashToSnapshot(revived, recoveredHash)
        }
      }
      stakingSentryBreadcrumb("runtime_reconcile", {
        source: "persisted_hydrate",
        deployment_id: activeRuntimeSelection.deployment.id,
        chain_family: activeRuntimeSelection.deployment.chainFamily,
      })
      void reconcilePersistedTxSnapshot(
        revivedForReconcile,
        revivedForReconcile.transactionRuntime == null
          ? persistedTxReconcileContextFromRuntime(activeRuntimeSelection)
          : undefined
      )
        .then(next => {
          if (
            (process.env.NODE_ENV !== 'production') &&
            (isRuntimeTortureSuiteEnabled() || isRuntimeChaosSuiteEnabled())
          ) {
            recordRuntimeTortureReconcileMs(performance.now() - recStart)
            recordRuntimeTortureHydrateMs(performance.now() - hydrateWallClock)
          }
          if (
            !canRuntimeOperationCommitWithDevTrace(
              "TransactionStatusProvider:persistedHydrate",
              hydrateCoordinator,
              transition.latestCoordinatorSnapshotRef.current
            )
          ) {
            if (isRuntimeTelemetryEmitEnabled()) {
              const t = transition.latestCoordinatorSnapshotRef.current
              const rt = activeRuntimeSelection
              emitRuntimeTelemetry(
                buildRuntimeTelemetryEvent("hydrate_reconcile_failure", "warning", {
                  runtimeKey: rt.runtimeKey,
                  deploymentId: rt.deployment.id,
                  chainFamily: rt.deployment.chainFamily,
                  lifecycle: t.lifecycle,
                  sequenceStage: t.sequenceStage,
                  uiPhase: next.uiPhase,
                  transitionGeneration: Number(t.transitionGeneration),
                  chainId: executionChainId ?? null,
                  reasonToken: "hydrate_commit_gate",
                })
              )
            }
            return
          }
          if (gen !== persistedHydrateGenRef.current) return
          restoredPersistedRef.current = true
          setSnapshot(next)
          traceTxSnapshotHydrated(next, "persisted_hydrate")
          if (
            next.scenario === "withdraw" &&
            (next.uiPhase === "confirmed" || next.uiPhase === "success")
          ) {
            traceMobileStakingFlow("withdraw_terminal_hydrated", {
              submissionId: next.submissionId,
              flowRunId: next.runId,
              uiPhase: next.uiPhase,
              withdrawTxHash: next.withdrawTxHash,
              txHash: next.txHash,
              source: "persisted_hydrate",
            })
          }
          bumpRecoveredWalletWaitGeneration("persisted_hydrate")
          notifyRecoveredWalletWaitDetected(next, "persisted_hydrate")
          stakingLifecycleTrace("persistence", "hydrate_restored", {
            phase: next.uiPhase,
          })
        })
        .catch(err => {
          captureStakingException(err, {
            ...stakingSentryTagsFromDeployment({
              deploymentId: activeRuntimeSelection.deployment.id,
              chainFamily: activeRuntimeSelection.deployment.chainFamily,
            }),
            runtimeReconcile: "reconcile_throw",
            extra: {
              source: "persisted_hydrate",
              chain_id: executionChainId ?? null,
            },
          })
          if (isRuntimeTelemetryEmitEnabled()) {
            const t = transition.latestCoordinatorSnapshotRef.current
            const rt = activeRuntimeSelection
            emitRuntimeTelemetry(
              buildRuntimeTelemetryEvent("hydrate_reconcile_failure", "error", {
                runtimeKey: rt.runtimeKey,
                deploymentId: rt.deployment.id,
                chainFamily: rt.deployment.chainFamily,
                lifecycle: t.lifecycle,
                sequenceStage: t.sequenceStage,
                transitionGeneration: Number(t.transitionGeneration),
                chainId: executionChainId ?? null,
                reasonToken: "reconcile_throw",
              })
            )
          }
        })
    })()
  }, [
    executionConnected,
    executionAddress,
    stakingOwnerAddress,
    executionChainId,
    executionAddress,
    vault.tokenDecimals,
    vault.txExecutionReady,
    activeRuntimeSelection,
    transition,
    tortureHydrateNonce,
  ])

  /** Debounced persistence of active modal flows */
  useEffect(() => {
    if (snapshotLooksIdle(snapshot)) {
      const pendingPersisted = readPersistedStakingTxSession()
      if (
        !restoredPersistedRef.current &&
        pendingPersisted &&
        pendingPersisted.snapshot.uiPhase !== null &&
        !isTransactionStatusTerminalUiPhase(pendingPersisted.snapshot.uiPhase)
      ) {
        return
      }
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
      if (pendingPersisted !== null) {
        clearPersistedStakingTxSession("snapshot_idle")
      }
      return
    }

    if (!isPersistableTxSnapshot(snapshot)) {
      if (isTransactionStatusTerminalUiPhase(snapshot.uiPhase)) {
        const pendingPersisted = readPersistedStakingTxSession()
        if (pendingPersisted !== null) {
          clearPersistedStakingTxSession("terminal_snapshot_not_persistable")
        }
      }
      return
    }

    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current)
    }
    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null
      const isTronSurface = activeRuntimeSelection.deployment.chainFamily === "tron"
      writePersistedStakingTxSession({
        v: 1,
        updatedAt: Date.now(),
        walletAddress: isTronSurface
          ? stakingOwnerAddress ?? null
          : executionAddress ?? null,
        chainId: executionChainId ?? null,
        snapshot,
      })
      traceTxSnapshotPersisted(snapshot, "debounced_persist")
    }, 140)

    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
    }
  }, [
    snapshot,
    executionAddress,
    executionChainId,
    stakingOwnerAddress,
    activeRuntimeSelection.deployment.chainFamily,
  ])

  /** Coherent reset when account or chain actually changes during an open tx flow */
  useEffect(() => {
    const isTronSurface = activeRuntimeSelection.deployment.chainFamily === "tron"
    const identityAddr = isTronSurface
      ? stakingOwnerAddress?.trim() || null
      : executionAddress?.toLowerCase() ?? null
    const chain = executionChainId ?? null
    const prev = walletIdentityRef.current
    const liveSnapshot = snapshotTelemetryRef.current

    const activeTxContinuity = hasActiveStakingTxContinuity(liveSnapshot)
    if (activeTxContinuity && prev.addr !== null && identityAddr !== null && prev.addr !== identityAddr) {
      traceMobileStakingFlow("active_tx_account_mismatch_detected", {
        previousAddress: prev.addr,
        liveAppKitAddress: identityAddr,
        submissionId: liveSnapshot.submissionId,
        uiPhase: liveSnapshot.uiPhase,
        source: "identity_address_shift",
      })
      walletIdentityRef.current = { addr: prev.addr, chain: prev.chain ?? chain }
      return
    } else if (
      activeTxContinuity &&
      prev.chain !== null &&
      chain !== null &&
      prev.chain !== chain
    ) {
      if (snapshotTelemetryRef.current.transactionRuntime != null) {
        stakingLifecycleTrace("wallet", "identity_chain_shift_ignored_frozen_tx", {
          from: prev.chain,
          to: chain,
        })
      } else {
        stakingLifecycleTrace("wallet", "identity_chain_shift_reset", {
          from: prev.chain,
          to: chain,
        })
        resetTransactionLifecycle()
      }
    }

    walletIdentityRef.current = { addr: identityAddr, chain }
  }, [
    executionAddress,
    stakingOwnerAddress,
    executionChainId,
    activeRuntimeSelection.deployment.chainFamily,
    resetTransactionLifecycle,
  ])

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    const idle = snapshotLooksIdle(snapshot)
    if (idle) return
    if (!vault.awaitingSigner) return
    if (!snapshot.dialogOpen) return
    stakingLifecycleTrace("tx-dialog", "dev_modal_open_awaiting_signer", {
      phase: snapshot.uiPhase,
    })
  }, [snapshot, vault.awaitingSigner])

  useEffect(() => {
    if (snapshot.dialogOpen && !snapshotLooksIdle(snapshot)) {
      if (modalOpenedPerfRef.current == null) {
        modalOpenedPerfRef.current = performance.now()
      }
    } else {
      modalOpenedPerfRef.current = null
    }
  }, [snapshot.dialogOpen, snapshot])

  useEffect(() => {
    if (!snapshot.dialogOpen) return
    if (lastUiPhaseWatchRef.current !== snapshot.uiPhase) {
      lastUiPhaseWatchRef.current = snapshot.uiPhase
      uiPhaseEnteredPerfRef.current = performance.now()
    }
  }, [snapshot.dialogOpen, snapshot.uiPhase])

  useEffect(() => {
    if (!isRuntimeTelemetryEmitEnabled()) return
    const id = window.setInterval(() => {
      const s = snapshotTelemetryRef.current
      if (!s.dialogOpen || snapshotLooksIdle(s)) return
      const t = transition.latestCoordinatorSnapshotRef.current
      const rt = activeRuntimeSelection
      const base = {
        runtimeKey: rt.runtimeKey,
        deploymentId: rt.deployment.id,
        chainFamily: rt.deployment.chainFamily,
        lifecycle: t.lifecycle,
        sequenceStage: t.sequenceStage,
        uiPhase: s.uiPhase,
        transitionGeneration: Number(t.transitionGeneration),
        chainId: executionChainId ?? null,
      }
      const terminal = isTransactionStatusTerminalUiPhase(s.uiPhase)
      if (!terminal && modalOpenedPerfRef.current != null) {
        if (performance.now() - modalOpenedPerfRef.current > 25 * 60 * 1000) {
          emitRuntimeTelemetry(
            buildRuntimeTelemetryEvent("modal_non_terminal_timeout", "warning", base)
          )
        }
      }
      const phase = s.uiPhase
      const entered = uiPhaseEnteredPerfRef.current
      if (phase === "awaiting_signature" && performance.now() - entered > 4 * 60 * 1000) {
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent("modal_phase_stall", "warning", {
            ...base,
            reasonToken: "signature_stall",
          })
        )
      }
      if (phase === "confirming" && performance.now() - entered > 12 * 60 * 1000) {
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent("modal_phase_stall", "warning", {
            ...base,
            reasonToken: "confirming_stall",
          })
        )
      }
      if (phase === "submitted" && performance.now() - entered > 8 * 60 * 1000) {
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent("modal_phase_stall", "warning", {
            ...base,
            reasonToken: "submitted_stall",
          })
        )
      }
      if (phase === "preview" && performance.now() - entered > 5 * 60 * 1000) {
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent("modal_phase_stall", "warning", {
            ...base,
            reasonToken: "preview_stall",
          })
        )
      }
      if (phase === "pending" && performance.now() - entered > 3 * 60 * 1000) {
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent("modal_phase_stall", "warning", {
            ...base,
            reasonToken: "pending_stall",
          })
        )
      }
    }, 45_000)
    return () => clearInterval(id)
  }, [activeRuntimeSelection, executionChainId, transition])

  const openPreview = useCallback((input: OpenPendingInput) => {
    traceTxMobilePipeline("preview_open", {
      scenario: input.scenario,
      needsApproval: input.needsApproval,
    })
    if (input.needsApproval) {
      traceMobileStakingFlow("approval_required", {
        scenario: input.scenario,
        depositApprovalKind: input.depositApprovalKind,
        approvalMode: input.approvalMode,
        submissionId: input.submissionId,
      })
    }
    const pendingFields = pendingInputToSnapshotFields(input)
    const transactionRuntime = buildTransactionRuntimeSnapshot(
      activeRuntimeSelection
    )
    const frozenVaultTokenSymbol =
      vault.tokenSymbol?.trim() || STAKING_STABLECOIN_LABEL
    clearPersistedStakingTxUserRejection("open_preview_new_submission")
    releasePreviewConfirmLock("open_preview")
    setSnapshot({
      dialogOpen: true,
      uiPhase: "preview",
      ...pendingFields,
      transactionRuntime,
      frozenVaultTokenSymbol,
      ...createActiveSubmissionTerminalFields(input.submissionId ?? null),
      approveComplete: false,
      approveTxHash: null,
      depositTxHash: null,
      withdrawTxHash: null,
      approveWirePhase: "idle",
      depositWirePhase: "idle",
      withdrawWirePhase: "idle",
      txHash: null,
      submittedAt: null,
      confirmations: null,
      successAmountLabel: "",
      successFeeLine: "",
      successExplorerUrl: null,
      errorMessage: "",
    })
  }, [activeRuntimeSelection, vault.tokenSymbol, releasePreviewConfirmLock])

  const confirmPreview = useCallback(() => {
    if (previewConfirmLockRef.current) {
      traceTxMobilePipeline("preview_confirm_duplicate_ignored", {
        scenario: snapshot.scenario ?? "unknown",
      })
      return
    }
    previewConfirmLockRef.current = true
    setPreviewConfirmLocked(true)
    traceTxMobilePipeline("preview_confirm_lock_acquired", {
      scenario: snapshot.scenario ?? "unknown",
    })
    if (!vault.txExecutionReady) {
      releasePreviewConfirmLock("preview_confirm_not_ready")
      traceTxMobilePipeline("preview_confirm_blocked_not_ready", {
        scenario: snapshot.scenario ?? "unknown",
      })
      setSnapshot(s => {
        if (!s.dialogOpen || s.uiPhase !== "preview") return s
        return {
          ...s,
          uiPhase: "failed",
          preparingTransaction: false,
          errorMessage: STAKING_TX_EXECUTION_NOT_READY_MESSAGE,
        }
      })
      return
    }
    const live = snapshotTelemetryRef.current
    if (live.uiPhase !== "preview" || !live.scenario) {
      releasePreviewConfirmLock("preview_confirm_invalid_phase")
      return
    }
    setSnapshot(s => {
      if (s.uiPhase !== "preview" || !s.scenario) return s
      traceTxMobilePipeline("preview_confirm_click", { scenario: s.scenario })
      traceMobileStakingFlow("preview_confirm_tapped", {
        scenario: s.scenario,
        submissionId: s.submissionId,
      })
      traceTxMobilePipeline("tx_execution_armed", {
        scenario: s.scenario,
        source: "confirmPreview",
      })
      traceTxMobilePipeline("begin_preparing_transaction", { scenario: s.scenario })
      return { ...s, preparingTransaction: true }
    })
  }, [
    snapshot.scenario,
    snapshot.uiPhase,
    snapshot.preparingTransaction,
    snapshot.submissionId,
    vault.txExecutionReady,
    releasePreviewConfirmLock,
  ])

  const beginAwaitingWalletSignature = useCallback(() => {
    releasePreviewConfirmLock("awaiting_signature_enter")
    setSnapshot(s => {
      if (!s.dialogOpen || !s.scenario) return s
      if (s.uiPhase === "awaiting_signature") return s
      if (s.uiPhase !== "preview") return s
      const wires = initialWiresFromSnapshot(s)
      traceTxMobilePipeline("awaiting_signature_enter", {
        scenario: s.scenario,
        source: "beginAwaitingWalletSignature",
      })
      return {
        ...s,
        uiPhase: "awaiting_signature",
        preparingTransaction: false,
        ...wires,
      }
    })
  }, [releasePreviewConfirmLock])

  useEffect(() => {
    return registerStakingTxWalletDispatchListener(() => {
      beginAwaitingWalletSignature()
    })
  }, [beginAwaitingWalletSignature])

  const openAwaitingSignature = useCallback((input: OpenPendingInput) => {
    traceTxMobilePipeline("tx_execution_armed", {
      scenario: input.scenario,
      source: "openAwaitingSignature",
      direct: true,
    })
    const pendingFields = pendingInputToSnapshotFields(input)
    const transactionRuntime = buildTransactionRuntimeSnapshot(
      activeRuntimeSelection
    )
    const frozenVaultTokenSymbol =
      vault.tokenSymbol?.trim() || STAKING_STABLECOIN_LABEL
    clearPersistedStakingTxUserRejection("open_awaiting_signature_new_submission")
    releasePreviewConfirmLock("open_awaiting_signature")
    setSnapshot({
      dialogOpen: true,
      uiPhase: "preview",
      ...pendingFields,
      preparingTransaction: true,
      transactionRuntime,
      frozenVaultTokenSymbol,
      ...createActiveSubmissionTerminalFields(input.submissionId ?? null),
      approveComplete: false,
      approveTxHash: null,
      depositTxHash: null,
      withdrawTxHash: null,
      approveWirePhase: "idle",
      depositWirePhase: "idle",
      withdrawWirePhase: "idle",
      txHash: null,
      submittedAt: null,
      confirmations: null,
      successAmountLabel: "",
      successFeeLine: "",
      successExplorerUrl: null,
      errorMessage: "",
    })
  }, [activeRuntimeSelection, vault.tokenSymbol, releasePreviewConfirmLock])

  const openPending = useCallback(
    (input: OpenPendingInput) => {
      openAwaitingSignature(input)
    },
    [openAwaitingSignature]
  )

  const setDepositApprovalMode = useCallback((mode: StakingApprovalMode) => {
    setSnapshot(s => {
      if (
        s.uiPhase !== "preview" ||
        s.scenario !== "deposit" ||
        !s.needsApproval
      ) {
        return s
      }
      return { ...s, approvalMode: mode }
    })
  }, [])

  const syncPreviewGasEstimate = useCallback((input: SyncPreviewGasEstimateInput) => {
    setSnapshot(s => {
      if (s.uiPhase !== "preview") return s
      const nextCanon = mergeStakingFeeCanonicalPair(s.feeCanonical, {
        maxWeiHex: input.feeCanonicalMaxWeiHex ?? null,
        displayLine: input.feeLine,
      })
      if (
        s.feeLine === input.feeLine &&
        s.previewGasEstimateReady === input.previewGasEstimateReady &&
        s.feeCanonical.displayLine === nextCanon.displayLine &&
        s.feeCanonical.maxWeiHex === nextCanon.maxWeiHex
      ) {
        return s
      }
      return {
        ...s,
        feeLine: input.feeLine,
        previewGasEstimateReady: input.previewGasEstimateReady,
        feeCanonical: nextCanon,
      }
    })
  }, [])

  const setSubmitted = useCallback((input: SetSubmittedInput) => {
    const t = Date.now()
    const trimmedHash = input.hash.trim()
    setSnapshot(s => {
      const allowLateDepositRecovery =
        input.step === "deposit" &&
        s.scenario === "deposit" &&
        s.approveComplete &&
        (s.uiPhase === "failed" || s.uiPhase === "cancelled")
      if (!allowsHashMutation(s.uiPhase) && !allowLateDepositRecovery) return s
      if (!trimmedHash) return s

      const wireForStep =
        input.step === "approve"
          ? s.approveWirePhase
          : input.step === "deposit"
            ? s.depositWirePhase
            : s.withdrawWirePhase
      const hashForStep =
        input.step === "approve"
          ? (s.approveTxHash?.trim() ?? "")
          : input.step === "deposit"
            ? (s.depositTxHash?.trim() ?? "")
            : (s.withdrawTxHash?.trim() ?? "")
      /** Wallet resume / double callbacks: avoid resetting `submittedAt` or re-entering submitted from confirming. */
      if (
        hashForStep === trimmedHash &&
        (wireForStep === "submitted" || wireForStep === "confirming")
      ) {
        stakingTxIntegrityDev("duplicate_broadcast_noop", {
          step: input.step,
          hash: trimmedHash,
          uiPhase: s.uiPhase,
        })
        return s
      }

      if (input.step === "approve") {
        const prev = s.approveTxHash?.trim()
        if (prev && prev === trimmedHash) {
          stakingTxIntegrityDev("duplicate_broadcast", {
            step: "approve",
            hash: trimmedHash,
          })
        }
      } else if (input.step === "deposit") {
        const prev = s.depositTxHash?.trim()
        if (prev && prev === trimmedHash) {
          stakingTxIntegrityDev("duplicate_broadcast", {
            step: "deposit",
            hash: trimmedHash,
          })
        }
      } else {
        const prev = s.withdrawTxHash?.trim()
        if (prev && prev === trimmedHash) {
          stakingTxIntegrityDev("duplicate_broadcast", {
            step: "withdraw",
            hash: trimmedHash,
          })
        }
      }
      const next: TransactionStatusSnapshot = {
        ...s,
        uiPhase: "submitted",
        submittedAt: t,
        txHash: input.hash,
        preparingTransaction: false,
      }
      if (input.step === "approve") {
        next.approveTxHash = input.hash
        next.approveWirePhase = "submitted"
      } else if (input.step === "deposit") {
        next.depositTxHash = input.hash
        next.depositWirePhase = "submitted"
      } else {
        next.withdrawTxHash = input.hash
        next.withdrawWirePhase = "submitted"
      }
      return next
    })
  }, [])

  const setConfirming = useCallback(() => {
    setSnapshot(s => {
      if (s.uiPhase === "confirming") return s
      if (s.uiPhase !== "submitted") {
        if ((process.env.NODE_ENV !== 'production')) {
          stakingLifecycleTrace("tx-dialog", "setConfirming_skipped", {
            uiPhase: s.uiPhase,
          })
          stakingTxIntegrityDev("setConfirming_skipped", { uiPhase: s.uiPhase })
        }
        return s
      }
      const next: TransactionStatusSnapshot = {
        ...s,
        uiPhase: "confirming",
        preparingTransaction: false,
      }
      if (s.scenario === "withdraw") {
        next.withdrawWirePhase =
          s.withdrawWirePhase === "idle" ? s.withdrawWirePhase : "confirming"
      } else if (s.scenario === "deposit") {
        const execution = snapshotDepositExecution(s)
        if (
          execution !== "skip" &&
          !s.approveComplete &&
          s.approveTxHash
        ) {
          next.approveWirePhase = "confirming"
        } else {
          next.depositWirePhase = "confirming"
        }
      }
      traceTxMobilePipeline("set_confirming", { scenario: s.scenario })
      stakingTxLifecycleDev("setConfirming", { scenario: s.scenario })
      return next
    })
  }, [])

  const publishTxBroadcast = useCallback(
    (input: SetSubmittedInput) => {
      traceTxMobilePipeline("publish_tx_broadcast", {
        step: input.step,
        hash: input.hash?.trim().slice(0, 18) ?? "",
      })
      traceTxMobilePipeline("tx_hash_received", {
        step: input.step,
        hashPresent: Boolean(input.hash?.trim()),
      })
      if (input.step === "approve") {
        traceMobileStakingFlow("approval_tx_hash_received", {
          hashPrefix: input.hash?.trim().slice(0, 18) ?? "",
        })
      } else if (input.step === "deposit") {
        traceMobileStakingFlow("stake_tx_hash_received", {
          hashPrefix: input.hash?.trim().slice(0, 18) ?? "",
        })
      } else if (input.step === "withdraw") {
        traceMobileStakingFlow("withdraw_tx_hash_received", {
          hashPrefix: input.hash?.trim().slice(0, 18) ?? "",
        })
      }
      setSubmitted(input)
      scheduleSubmittedToConfirmingHandoff(() => {
        setConfirming()
      })
    },
    [setSubmitted, setConfirming]
  )

  const mergeFeeCanonicalFromPair = useCallback((pair: StakingFeeCanonicalPair) => {
    setSnapshot(s => ({
      ...s,
      feeCanonical: mergeStakingFeeCanonicalPair(s.feeCanonical, pair),
    }))
  }, [])

  const beginPreparingTransaction = useCallback(() => {
    setSnapshot(s => {
      if (!s.dialogOpen || s.scenario === null) return s
      traceTxMobilePipeline("begin_preparing_transaction", { scenario: s.scenario })
      stakingTxLifecycleDev("beginPreparingTransaction", { scenario: s.scenario })
      return { ...s, preparingTransaction: true }
    })
  }, [])

  const endPreparingTransaction = useCallback(() => {
    setSnapshot(s => {
      traceTxMobilePipeline("end_preparing_transaction", { scenario: s.scenario })
      return { ...s, preparingTransaction: false }
    })
  }, [])

  const setConfirmed = useCallback((input: SetSuccessInput) => {
    stakingTxLifecycleDev("setConfirmed", {
      amountLabel: input.amountLabel,
      feeLine: input.feeLine?.slice?.(0, 80),
    })
    setSnapshot(s => {
      if (!s.dialogOpen) return s
      return {
        ...s,
        uiPhase: "confirmed",
        dialogOpen: true,
        successAmountLabel: input.amountLabel,
        successFeeLine: input.feeLine,
        successExplorerUrl: input.explorerUrl,
        errorMessage: "",
        approveWirePhase: "done" as TransactionWireStepPhase,
        depositWirePhase: "done" as TransactionWireStepPhase,
        withdrawWirePhase: "done" as TransactionWireStepPhase,
      }
    })
  }, [])

  const setSuccess = useCallback(
    (input: SetSuccessInput) => {
      setConfirmed(input)
    },
    [setConfirmed]
  )

  const markUserRejected = useCallback(
    (input: MarkUserRejectedInput) => {
      const live = snapshotTelemetryRef.current
      if (
        blockStaleProviderTerminalUpdate({
          expectedSubmissionId: input.submissionId,
          expectedFlowRunId: input.flowRunId ?? String(input.submissionId),
          liveSubmissionId: live.submissionId,
          liveFlowRunId: live.runId,
          source: input.source ?? "markUserRejected",
          operation: "markUserRejected",
        })
      ) {
        return
      }
      const isTronSurface =
        activeRuntimeSelection.deployment.chainFamily === "tron"
      const walletAddress = isTronSurface
        ? stakingOwnerAddress?.trim() ?? null
        : executionAddress?.trim() ?? null
      const chainId = executionChainId ?? null

      setSnapshot(s => {
        if (!s.dialogOpen || !s.scenario) return s
        traceMobileStakingFlow("ui_marked_user_cancelled", {
          rejectedStage: input.rejectedStage,
          submissionId: input.submissionId,
        })
        const rejectedAt = Date.now()
        const stakeCancelledAfterApproval =
          input.rejectedStage === "depositAfterApproval"
        const next: TransactionStatusSnapshot = {
          ...s,
          uiPhase: "cancelled",
          preparingTransaction: false,
          terminal: true,
          terminalReason: "user_rejected",
          submissionId: input.submissionId,
          runId: String(input.submissionId),
          rejectedAt,
          rejectedStage: input.rejectedStage,
          canAutoResume: false,
          canAutoDispatch: false,
          errorMessage:
            input.message?.trim() ||
            (stakeCancelledAfterApproval
              ? STAKING_TX_UX_STAKE_CANCELLED_IN_WALLET
              : STAKING_TX_UX_HEADER_TRANSACTION_CANCELLED),
          approveWirePhase:
            input.rejectedStage === "approval" ? "idle" : s.approveWirePhase,
          depositWirePhase:
            input.rejectedStage === "deposit"
              ? "idle"
              : stakeCancelledAfterApproval
                ? "idle"
                : s.depositWirePhase,
        }
        return next
      })

      clearPersistedStakingTxSession("user_rejected")
      const rejectionRow = buildPersistedUserRejectionRow({
        walletAddress,
        chainId,
        snapshot: snapshotTelemetryRef.current,
        submissionId: input.submissionId,
        rejectedStage: input.rejectedStage,
      })
      writePersistedStakingTxUserRejection(rejectionRow)
      releasePreviewConfirmLock("user_rejected")
      abandonStakingVaultTxExecutionLoading("user_rejected")
    },
    [
      activeRuntimeSelection.deployment.chainFamily,
      executionAddress,
      executionChainId,
      stakingOwnerAddress,
      releasePreviewConfirmLock,
    ]
  )

  const markPostApprovalStakeWalletTerminal = useCallback(
    (input: MarkPostApprovalStakeWalletTerminalInput) => {
      const live = snapshotTelemetryRef.current
      if (
        blockStaleProviderTerminalUpdate({
          expectedSubmissionId: input.submissionId,
          expectedFlowRunId: input.flowRunId ?? String(input.submissionId),
          liveSubmissionId: live.submissionId,
          liveFlowRunId: live.runId,
          source: input.source,
          operation: "markPostApprovalStakeWalletTerminal",
        })
      ) {
        return
      }
      if (live.depositTxHash?.trim()) return

      const isTronSurface =
        activeRuntimeSelection.deployment.chainFamily === "tron"
      const walletAddress = isTronSurface
        ? stakingOwnerAddress?.trim() ?? null
        : executionAddress?.trim() ?? null
      const chainId = executionChainId ?? null
      const message =
        input.kind === "insufficient_gas"
          ? STAKING_TX_UX_STAKE_INSUFFICIENT_GAS
          : STAKING_TX_UX_STAKE_CANCELLED_IN_WALLET

      traceStakeWalletWaitTerminal({
        event:
          input.kind === "insufficient_gas"
            ? "stake_wallet_wait_failed_insufficient_gas"
            : "stake_wallet_wait_cancelled_pre_hash",
        snapshot: live,
        source: input.source,
        terminalKind: input.kind,
        error: input.error,
      })
      traceStakeWalletWaitTerminal({
        event:
          input.kind === "insufficient_gas"
            ? "stake_insufficient_gas_detected"
            : "stake_user_rejected_in_wallet",
        snapshot: live,
        source: input.source,
        terminalKind: input.kind,
        error: input.error,
      })

      releasePreviewConfirmLock("post_approval_stake_terminal")
      abandonStakingVaultTxExecutionLoading(`post_approval_stake_terminal:${input.source}`)
      if (live.scenario) {
        dismissStakingTxWalletWaitProgressToast(live.scenario, live.submissionId)
      }
      clearPersistedStakingTxSession(input.source)

      setSnapshot(s => {
        if (!s.scenario || s.scenario !== "deposit") return s
        if (s.depositTxHash?.trim()) return s
        const rejectedAt = input.kind === "user_rejected" ? Date.now() : null
        return {
          ...s,
          dialogOpen: true,
          uiPhase: input.kind === "insufficient_gas" ? "failed" : "cancelled",
          preparingTransaction: false,
          terminal: true,
          terminalReason:
            input.kind === "user_rejected" ? "user_rejected" : null,
          submissionId: input.submissionId,
          runId: String(input.submissionId),
          rejectedAt,
          rejectedStage: "depositAfterApproval",
          canAutoResume: false,
          canAutoDispatch: false,
          errorMessage: message,
          approveComplete: true,
          approveWirePhase: "done",
          depositWirePhase:
            input.kind === "insufficient_gas" ? "failed" : "idle",
        }
      })

      writePersistedStakingTxStakeTerminal(
        buildPersistedStakeTerminalRow({
          walletAddress,
          chainId,
          snapshot: {
            ...live,
            approveComplete: true,
            approveWirePhase: "done",
          },
          submissionId: input.submissionId,
          terminalKind: input.kind,
        })
      )
    },
    [
      activeRuntimeSelection.deployment.chainFamily,
      executionAddress,
      executionChainId,
      stakingOwnerAddress,
      releasePreviewConfirmLock,
    ]
  )

  markPostApprovalStakeWalletTerminalRef.current =
    markPostApprovalStakeWalletTerminal

  const setFailed = useCallback((message: string, options?: SetFailedOptions) => {
    const live = snapshotTelemetryRef.current
    if (
      blockStaleProviderTerminalUpdate({
        expectedSubmissionId: options?.submissionId,
        expectedFlowRunId:
          options?.flowRunId ??
          (options?.submissionId != null ? String(options.submissionId) : null),
        liveSubmissionId: live.submissionId,
        liveFlowRunId: live.runId,
        source: options?.source ?? "setFailed",
        operation: "setFailed",
      })
    ) {
      return
    }
    traceTxMobilePipeline("set_failed", {
      messageHead: message.trim().slice(0, 120),
      submissionId: options?.submissionId ?? live.submissionId,
    })
    stakingTxLifecycleDev("setFailed", {
      messageHead: message.trim().slice(0, 120),
    })
    const msg = message.trim()
    const sessionExpired =
      /session expired|disconnected|reconnect/i.test(msg)
    const approvalFailed =
      live.scenario === "deposit" &&
      deriveDepositApprovalExecution({
        needsApproval: live.needsApproval,
        depositApprovalKind: live.depositApprovalKind,
        approvalMode: live.approvalMode,
      }) !== "skip" &&
      !live.approveComplete
    const stakeGasFailed =
      live.scenario === "deposit" &&
      live.approveComplete &&
      /not enough eth for network fee/i.test(msg)
    if (sessionExpired) {
      traceMobileStakingFlow("ui_marked_wallet_disconnected", {
        messageHead: msg.slice(0, 120),
      })
    } else if (approvalFailed) {
      traceMobileStakingFlow("ui_marked_approval_failed", {
        messageHead: msg.slice(0, 120),
        approveTxHash: live.approveTxHash,
      })
    } else if (stakeGasFailed) {
      traceMobileStakingFlow("stake_wallet_wait_failed_insufficient_gas", {
        messageHead: msg.slice(0, 120),
        submissionId: live.submissionId,
        approvalTxHash: live.approveTxHash,
      })
    } else {
      traceMobileStakingFlow("ui_marked_unknown_wallet_error", {
        messageHead: msg.slice(0, 120),
      })
    }
    releasePreviewConfirmLock("set_failed")
    clearPersistedStakingTxSession("set_failed")
    setSnapshot(s => {
      if (!s.dialogOpen) return s
      const next: TransactionStatusSnapshot = {
        ...s,
        uiPhase: "failed",
        dialogOpen: true,
        preparingTransaction: false,
        errorMessage: message,
      }
      if (s.scenario === "withdraw") {
        const w = s.withdrawWirePhase
        if (w !== "idle" && w !== "done") {
          next.withdrawWirePhase = "failed"
        }
      } else if (s.scenario === "deposit") {
        const execution = snapshotDepositExecution(s)
        if (
          execution !== "skip" &&
          !s.approveComplete &&
          s.approveWirePhase !== "idle" &&
          s.approveWirePhase !== "done"
        ) {
          next.approveWirePhase = "failed"
        } else {
          const d = s.depositWirePhase
          if (d !== "idle" && d !== "done") {
            next.depositWirePhase = "failed"
          }
        }
      }
      return next
    })
  }, [releasePreviewConfirmLock])

  const setError = useCallback(
    (message: string, options?: SetFailedOptions) => {
      setFailed(message, options)
    },
    [setFailed]
  )

  const setApproveTxHash = useCallback((hash: string) => {
    setSnapshot(s =>
      allowsHashMutation(s.uiPhase)
        ? { ...s, approveTxHash: hash, txHash: hash }
        : s
    )
  }, [])

  const markApproveBroadcast = useCallback(
    (hash: string) => {
      const trimmed = hash.trim()
      if (!trimmed) return
      setSnapshot(s => {
        if (!allowsHashMutation(s.uiPhase)) return s
        if (
          s.approveTxHash?.trim() === trimmed &&
          (s.approveWirePhase === "submitted" ||
            s.approveWirePhase === "confirming" ||
            s.uiPhase === "confirming")
        ) {
          stakingTxIntegrityDev("duplicate_broadcast_noop", {
            step: "approve",
            hash: trimmed,
            source: "markApproveBroadcast",
            uiPhase: s.uiPhase,
          })
          return s
        }
        if (s.approveTxHash?.trim() === trimmed && trimmed) {
          stakingTxIntegrityDev("duplicate_broadcast", {
            step: "approve",
            hash: trimmed,
            source: "markApproveBroadcast",
          })
        }
        traceMobileStakingFlow("approval_tx_hash_received", {
          hashPrefix: trimmed.slice(0, 18),
          source: "markApproveBroadcast",
        })
        return {
          ...s,
          uiPhase: "submitted",
          submittedAt: Date.now(),
          approveTxHash: trimmed,
          txHash: trimmed,
          approveWirePhase: "submitted",
          preparingTransaction: false,
        }
      })
      scheduleSubmittedToConfirmingHandoff(() => {
        setConfirming()
      })
    },
    [setConfirming]
  )

  const markApproveComplete = useCallback(() => {
    setSnapshot(s => {
      if (!(allowsHashMutation(s.uiPhase) || s.uiPhase === "confirming")) return s
      return {
        ...s,
        approveComplete: true,
        approveWirePhase: "done",
        depositWirePhase:
          s.scenario === "deposit" &&
          snapshotDepositExecution(s) !== "skip"
            ? "awaiting_signature"
            : s.depositWirePhase,
        uiPhase:
          s.scenario === "deposit" &&
          snapshotDepositExecution(s) !== "skip"
            ? "awaiting_signature"
            : s.uiPhase,
      }
    })
  }, [])

  const resumeDepositAfterRecoveredApproval = useCallback(() => {
    clearPersistedStakingTxUserRejection("deposit_continuation_resume")
    clearPersistedStakingTxStakeTerminal("deposit_continuation_resume")
    releasePreviewConfirmLock("deposit_continuation_resume")
    setSnapshot(s => {
      if (s.scenario !== "deposit") return s
      traceMobileStakingFlow("deposit_continuation_resumed", {
        submissionId: s.submissionId,
        priorPhase: s.uiPhase,
        priorTerminal: s.terminalReason,
      })
      return {
        ...s,
        dialogOpen: true,
        uiPhase: "awaiting_signature",
        terminal: false,
        terminalReason: null,
        preparingTransaction: false,
        errorMessage: "",
        rejectedAt: null,
        rejectedStage: null,
        canAutoResume: false,
        canAutoDispatch: false,
        approveComplete: true,
        approveWirePhase: "done",
        depositWirePhase: "awaiting_signature",
        depositTxHash: null,
        txHash: null,
        submittedAt: null,
      }
    })
  }, [releasePreviewConfirmLock])

  const signalDepositContinuationRetry = useCallback(
    (source: string, options?: { depositOnly?: boolean }) => {
      abandonStakingVaultTxExecutionLoading(`deposit_continuation_${source}`)
      traceMobileStakingFlow("deposit_continuation_retry_signaled", {
        source,
        submissionId: snapshotTelemetryRef.current.submissionId,
        depositOnly: options?.depositOnly ?? true,
      })
      setRetryRequest(prev => ({
        nonce: prev.nonce + 1,
        scenario: "deposit",
        depositOnly: options?.depositOnly ?? true,
      }))
    },
    []
  )

  useEffect(() => {
    registerRecoveredWalletHandoffDeps({
      readSnapshot: () => snapshotTelemetryRef.current,
      tryRecoverApproval: source =>
        tryRecoverStakingApprovalFromOnChainAllowance({
          snapshot: snapshotTelemetryRef.current,
          deployment: activeRuntimeSelection.deployment,
          tokenAddress: vault.tokenAddress ?? null,
          tokenDecimals: vault.tokenDecimals ?? null,
          ownerAddress: executionAddress,
          source,
        }),
      tryRecoverWithdraw: source =>
        tryRecoverWithdrawTxHashFromOnChain({
          snapshot: snapshotTelemetryRef.current,
          deployment: activeRuntimeSelection.deployment,
          tokenDecimals: vault.tokenDecimals ?? null,
          ownerAddress: executionAddress,
          source,
        }),
      applyRecoveredWithdrawHash: (hash, source) => {
        publishTxBroadcast({ step: "withdraw", hash })
        traceMobileStakingFlow("withdraw_stale_wallet_wait_cleared_after_success", {
          hashPrefix: hash.slice(0, 18),
          source,
        })
      },
      signalDepositContinuation: signalDepositContinuationRetry,
      cancelPreHashWalletWait: cancelRecoveredPreHashWalletWait,
      notifyManualOpenHintRequired: () => {
        setWalletWaitManualHintRevision(n => n + 1)
        const live = snapshotTelemetryRef.current
        if (!live.dialogOpen && live.scenario) {
          syncStakingTxWalletWaitProgressToast(live)
        }
      },
      appKitAccountStatus: appKitAccountStatus ?? null,
      wcSessionTopic: null,
    })
    return () => registerRecoveredWalletHandoffDeps(null)
  }, [
    activeRuntimeSelection.deployment,
    vault.tokenAddress,
    vault.tokenDecimals,
    executionAddress,
    appKitAccountStatus,
    signalDepositContinuationRetry,
    cancelRecoveredPreHashWalletWait,
    publishTxBroadcast,
  ])

  useEffect(() => {
    registerWalletConnectSignatureStallHandler(detail => {
      void (async () => {
        const live = snapshotTelemetryRef.current
        if (
          !isSignatureStallRecoveryStillApplicable({
            snapshot: live,
            vaultLoading: vault.loading,
          })
        ) {
          return
        }
        if (
          detail.walletLeftPage &&
          executionConnected &&
          detail.durationMs < STAKING_TX_POST_RETURN_STALL_GRACE_MS + 2_000
        ) {
          traceMobileStakingFlow("signature_stall_suppressed_premature", {
            durationMs: detail.durationMs,
            submissionId: live.submissionId,
          })
          return
        }

        const stallSubmissionId = live.submissionId
        const stallFlowRunId = live.runId

        const recovered = await tryRecoverStakingApprovalFromOnChainAllowance({
          snapshot: live,
          deployment: activeRuntimeSelection.deployment,
          tokenAddress: vault.tokenAddress ?? null,
          tokenDecimals: vault.tokenDecimals ?? null,
          ownerAddress: executionAddress,
          source: "signature_stall_handler",
        })
        if (recovered) {
          traceMobileStakingFlow("approval_recovered_on_chain_before_stall_fail", {
            submissionId: live.submissionId,
          })
          signalDepositContinuationRetry("approval_recovered_on_chain")
          return
        }

        const liveAfterApproval = snapshotTelemetryRef.current
        if (
          liveAfterApproval.scenario === "withdraw" &&
          liveAfterApproval.uiPhase === "awaiting_signature" &&
          !liveAfterApproval.withdrawTxHash?.trim()
        ) {
          const recoveredWithdrawHash = await tryRecoverWithdrawTxHashFromOnChain({
            snapshot: liveAfterApproval,
            deployment: activeRuntimeSelection.deployment,
            tokenDecimals: vault.tokenDecimals ?? null,
            ownerAddress: executionAddress,
            source: "signature_stall_handler",
          })
          if (recoveredWithdrawHash) {
            publishTxBroadcast({ step: "withdraw", hash: recoveredWithdrawHash })
            return
          }
        }

        const liveAfterCheck = snapshotTelemetryRef.current
        const awaitingDepositSignature =
          snapshotAwaitingDepositSignatureWithoutHash(liveAfterCheck)
        if (executionConnected && awaitingDepositSignature) {
          if (
            liveAfterCheck.approveComplete &&
            liveAfterCheck.submissionId != null &&
            liveAfterCheck.submissionId > 0
          ) {
            markPostApprovalStakeWalletTerminalRef.current({
              submissionId: liveAfterCheck.submissionId,
              kind: "user_rejected",
              source: "signature_stall_post_approval",
              flowRunId: liveAfterCheck.runId ?? undefined,
            })
            return
          }
          signalDepositContinuationRetry("deposit_stall_connected")
          return
        }

        abandonStakingVaultTxExecutionLoading("wallet_request_timeout")
        const approvalStillPending =
          liveAfterCheck.scenario === "deposit" &&
          deriveDepositApprovalExecution({
            needsApproval: liveAfterCheck.needsApproval,
            depositApprovalKind: liveAfterCheck.depositApprovalKind,
            approvalMode: liveAfterCheck.approvalMode,
          }) !== "skip" &&
          !liveAfterCheck.approveComplete &&
          !liveAfterCheck.approveTxHash?.trim()
        if (executionConnected && approvalStillPending) {
          signalDepositContinuationRetry("approval_stall_connected", {
            depositOnly: false,
          })
          return
        }
        if (
          blockStaleProviderTerminalUpdate({
            expectedSubmissionId: stallSubmissionId,
            expectedFlowRunId: stallFlowRunId,
            liveSubmissionId: liveAfterCheck.submissionId,
            liveFlowRunId: liveAfterCheck.runId,
            source: "signature_stall_handler",
            operation: "setFailed",
          })
        ) {
          return
        }
        setFailed(
          !executionConnected && detail.walletLeftPage
            ? "Wallet session expired. Reconnect wallet to continue."
            : awaitingDepositSignature || liveAfterCheck.approveComplete
              ? "Deposit signing did not complete. Tap Retry to open your wallet and continue."
              : executionConnected
                ? "Approval could not be confirmed. Return to your wallet or tap Retry to continue."
                : "Wallet did not open for signing. Tap Retry to connect your wallet and try again.",
          {
            submissionId: stallSubmissionId ?? undefined,
            flowRunId: stallFlowRunId ?? undefined,
            source: "signature_stall_handler",
          }
        )
      })()
    })
    return () => registerWalletConnectSignatureStallHandler(null)
  }, [
    setFailed,
    vault.loading,
    vault.tokenAddress,
    vault.tokenDecimals,
    executionConnected,
    executionAddress,
    activeRuntimeSelection.deployment,
    markApproveComplete,
    signalDepositContinuationRetry,
    publishTxBroadcast,
  ])

  const setDepositTxHash = useCallback((hash: string) => {
    setSnapshot(s =>
      allowsHashMutation(s.uiPhase)
        ? { ...s, depositTxHash: hash, txHash: hash }
        : s
    )
  }, [])

  const setWithdrawTxHash = useCallback((hash: string) => {
    setSnapshot(s =>
      allowsHashMutation(s.uiPhase)
        ? { ...s, withdrawTxHash: hash, txHash: hash }
        : s
    )
  }, [])

  const beginInFlightDismissal = useCallback(() => {
    const live = snapshotTelemetryRef.current
    stakingTxLifecycleDev("beginInFlightDismissal")
    traceMobileStakingFlow("tx_modal_close_clicked", {
      source: "begin_in_flight_dismissal",
      uiPhase: live.uiPhase,
      submissionId: live.submissionId,
      path: "cancel_epilogue_not_ui_only",
    })
    traceMobileStakingFlow("tx_modal_closed", {
      source: "begin_in_flight_dismissal",
      uiPhase: snapshotTelemetryRef.current.uiPhase,
      submissionId: snapshotTelemetryRef.current.submissionId,
      scenario: snapshotTelemetryRef.current.scenario,
    })
    abandonStakingVaultTxExecutionLoading("begin_in_flight_dismissal")
    setSnapshot(s => {
      /** Post-broadcast; use `dismissSubmittedModal` (no cancelled epilogue). */
      if (s.uiPhase === "submitted" || s.uiPhase === "confirming") return s
      if (!isTransactionStatusInFlightPhase(s.uiPhase)) return s
      return { ...s, uiPhase: "cancelled", preparingTransaction: false }
    })
  }, [])

  const retryLastTerminalFlow = useCallback(() => {
    const now = Date.now()
    if (now - retryTapGuardMsRef.current < 700) {
      stakingTxIntegrityDev("duplicate_retry_activation", {
        uiPhase: snapshot.uiPhase,
        scenario: snapshot.scenario,
      })
      return
    }
    retryTapGuardMsRef.current = now

    const scenario: TransactionStatusScenario | null = snapshot.scenario
    if (!scenario) return
    if (snapshot.uiPhase === "confirmed" || snapshot.uiPhase === "success") {
      stakingTxIntegrityDev("retry_after_success", { uiPhase: snapshot.uiPhase })
      return
    }
    const terminal =
      snapshot.uiPhase === "failed" ||
      snapshot.uiPhase === "error" ||
      snapshot.uiPhase === "cancelled"
    if (!terminal) {
      stakingTxIntegrityDev("retry_non_terminal", { uiPhase: snapshot.uiPhase })
      return
    }

    stakingTxIntegrityDev("retry_from_terminal", {
      scenario,
      fromPhase: snapshot.uiPhase,
    })

    abandonStakingVaultTxExecutionLoading("terminal_flow_retry")
    clearPersistedStakingTxUserRejection("explicit_retry")
    clearPersistedStakingTxStakeTerminal("explicit_retry")
    releasePreviewConfirmLock("retry")
    receiptSuccessToastShownRef.current.clear()
    receiptErrorToastShownRef.current.clear()
    receiptHandlerRegisteredRef.current.clear()
    clearDismissEpilogueTimer()
    traceTxMobilePipeline("retry_requested", {
      scenario,
      fromPhase: snapshot.uiPhase,
    })
    traceMobileStakingFlow("retry_clicked", {
      scenario,
      fromPhase: snapshot.uiPhase,
      submissionId: snapshot.submissionId,
    })
    const depositOnlyRetry =
      scenario === "deposit" &&
      snapshot.approveComplete &&
      Boolean(snapshot.approveTxHash?.trim())
    if (depositOnlyRetry) {
      traceMobileStakingFlow("stake_retry_deposit_only_after_approval", {
        submissionId: snapshot.submissionId,
        fromPhase: snapshot.uiPhase,
      })
    }
    setRetryRequest(prev => {
      const nextNonce = prev.nonce + 1
      if (isRuntimeTelemetryEmitEnabled() && nextNonce >= 5) {
        const t = transition.latestCoordinatorSnapshotRef.current
        const rt = activeRuntimeSelection
        emitRuntimeTelemetry(
          buildRuntimeTelemetryEvent(
            "tx_retry_loop_excessive",
            "warning",
            {
              runtimeKey: rt.runtimeKey,
              deploymentId: rt.deployment.id,
              chainFamily: rt.deployment.chainFamily,
              lifecycle: t.lifecycle,
              sequenceStage: t.sequenceStage,
              uiPhase: snapshot.uiPhase,
              transitionGeneration: Number(t.transitionGeneration),
              chainId: executionChainId ?? null,
              reasonToken: "terminal_retry",
            },
            nextNonce
          )
        )
      }
      return { nonce: nextNonce, scenario, depositOnly: depositOnlyRetry }
    })
    /** Preview / preparing are armed only when the form accepts retry (direct launch). */
  }, [
    snapshot,
    clearDismissEpilogueTimer,
    activeRuntimeSelection,
    transition,
    executionChainId,
    releasePreviewConfirmLock,
  ])

  const prevUiPhaseRef = useRef<TransactionStatusUiPhase | null>(null)
  useEffect(() => {
    const prev = prevUiPhaseRef.current
    const next = snapshot.uiPhase
    if (prev !== next) {
      stakingTxLifecycleDev("uiPhase_transition", { from: prev, to: next })
      if (
        prev !== null &&
        next === "confirming" &&
        prev !== "submitted"
      ) {
        stakingTxIntegrityDev("confirming_unexpected_prior", {
          prev,
          next,
        })
      }
    }
    prevUiPhaseRef.current = next
  }, [snapshot.uiPhase])

  useEffect(() => {
    if (snapshot.uiPhase !== "cancelled") return
    if (snapshot.terminalReason === "user_rejected") return
    clearDismissEpilogueTimer()
    dismissEpilogueTimerRef.current = window.setTimeout(() => {
      dismissEpilogueTimerRef.current = null
      close()
    }, STAKING_TX_IN_FLIGHT_DISMISS_EPILOGUE_MS)
    return () => clearDismissEpilogueTimer()
  }, [snapshot.uiPhase, snapshot.terminalReason, close, clearDismissEpilogueTimer])

  const value = useMemo<TransactionStatusContextValue>(
    () => ({
      openPreview,
      confirmPreview,
      openAwaitingSignature,
      beginAwaitingWalletSignature,
      setDepositApprovalMode,
      syncPreviewGasEstimate,
      setSubmitted,
      publishTxBroadcast,
      setConfirming,
      beginPreparingTransaction,
      endPreparingTransaction,
      mergeFeeCanonicalFromPair,
      setConfirmed,
      setFailed,
      markUserRejected,
      markPostApprovalStakeWalletTerminal,
      openPending,
      setApproveTxHash,
      markApproveBroadcast,
      markApproveComplete,
      setDepositTxHash,
      setWithdrawTxHash,
      setSuccess,
      setError,
      close,
      closeUser: close,
      clearPersistedTransactionState,
      resetTransactionLifecycle,
      beginInFlightDismissal,
      dismissInFlightModalUiOnly,
      dismissSubmittedModal,
      reopenDetachedTransactionModal,
      requestRecoveredWalletHandoff,
      registerReceiptCompletion,
      retryLastTerminalFlow,
      retryRequest,
      signalDepositContinuationRetry,
      resumeDepositAfterRecoveredApproval,
      previewConfirmLocked,
      snapshot,
      walletWaitManualHintRevision,
    }),
    [
      snapshot,
      walletWaitManualHintRevision,
      previewConfirmLocked,
      openPreview,
      confirmPreview,
      openAwaitingSignature,
      beginAwaitingWalletSignature,
      setDepositApprovalMode,
      syncPreviewGasEstimate,
      setSubmitted,
      publishTxBroadcast,
      setConfirming,
      beginPreparingTransaction,
      endPreparingTransaction,
      mergeFeeCanonicalFromPair,
      setConfirmed,
      setFailed,
      markUserRejected,
      markPostApprovalStakeWalletTerminal,
      openPending,
      setApproveTxHash,
      markApproveBroadcast,
      markApproveComplete,
      setDepositTxHash,
      setWithdrawTxHash,
      setSuccess,
      setError,
      close,
      clearPersistedTransactionState,
      resetTransactionLifecycle,
      beginInFlightDismissal,
      dismissInFlightModalUiOnly,
      dismissSubmittedModal,
      reopenDetachedTransactionModal,
      requestRecoveredWalletHandoff,
      registerReceiptCompletion,
      retryLastTerminalFlow,
      retryRequest,
      signalDepositContinuationRetry,
      resumeDepositAfterRecoveredApproval,
    ]
  )

  return (
    <TransactionStatusContext.Provider value={value}>
      <StakingAmbientTxPresentationProvider>
        {children}
        <TransactionStatusSurface />
      </StakingAmbientTxPresentationProvider>
    </TransactionStatusContext.Provider>
  )
}
