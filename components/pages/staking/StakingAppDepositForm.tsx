import { useTransactionStatus } from "@/components/pages/staking/TransactionStatusContext"
import type { TransactionStatusSnapshot } from "@/components/pages/staking/transactionStatusModel"
import { StakingFormLayout } from "@/components/pages/staking/StakingFormLayout"
import { StakingFormBalanceMetaRow } from "@/components/pages/staking/StakingFormBalanceMetaRow"
import {
  STAKING_PASSIVE_PRIMARY_CTA_BUTTON_CLASS,
  STAKING_PRIMARY_CTA_BUTTON_CLASS,
  STAKING_FORM_SLOT_BODY_CLASS,
  StakingFormSlotAmount,
  StakingFormSlotAsset,
  StakingFormSlotFeeRows,
  STAKING_FORM_SLIDER_LABEL_ROW_CLASS,
  StakingFormSlotMeta,
  StakingFormSlotSlider,
  StakingFormSlotSliderInner,
} from "@/components/pages/staking/stakingFormSlots"
import { StakingFormActionSummaryDeposit } from "@/components/pages/staking/StakingFormActionSummary"
import { StakingCtaReason } from "@/components/pages/staking/StakingCtaReason"
import { deriveStakingFeeHint } from "@/lib/stakingFeeRowHint"
import {
  deriveStakingUiPhase,
  deriveTxUiPhaseFromTxPhase,
  getStakingPrimaryDisabled,
  getStakingPrimaryLabel,
  selectStakingInlineCtaReason,
} from "@/lib/stakingUiPhase"
import { StakingCtaEllipsisLabel } from "@/components/pages/staking/StakingCtaEllipsisLabel"
import {
  shouldAnimateStakingPrimaryEllipsis,
  shouldAnimateStakingReasonEllipsis,
} from "@/staking/cta"
import { useStakingTermsConsent } from "@/components/pages/staking/useStakingTermsConsent"
import { useStakingVault } from "@/components/pages/staking/stakingVaultContext"
import { useAppKitReady } from "@/hooks/useAppKitReady"
import {
  isWalletConnectStaleSessionError,
  isWalletConnectTxDispatchUnreachableError,
} from "@/lib/wallet/walletConnectSessionRecovery"
import GlowingButton from "@/components/common/glowingButton"
import { StakingDepositAssetSelect } from "@/components/pages/staking/StakingAssetSelectSubtree"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  STAKING_AMOUNT_SLIDER_RANGE_CLASSNAME,
  STAKING_AMOUNT_SLIDER_ROOT_CLASSNAME,
  STAKING_AMOUNT_SLIDER_THUMB_CLASSNAME,
  STAKING_AMOUNT_SLIDER_TRACK_CLASSNAME,
} from "@/staking/ui"
import {
  STAKING_APPKIT_NETWORK,
  STAKING_STABLECOIN_LABEL,
} from "@/constants/stakingVaultConfig"
import {
  classifyStakeWalletError,
  getStakingTransactionErrorMessage,
  isStakingInsufficientGasError,
  isStakingWalletUserRejectedError,
  type StakingTransactionStage,
} from "@/lib/stakingTransactionMessages"
import { stakingSentryBreadcrumb } from "@/lib/stakingSentryObservability"
import { stakingTxIntegrityDev } from "@/staking/diagnostics"
import {
  stakingTxLifecycleDev,
  traceMobileStakingFlow,
  traceTxMobilePipeline,
  traceTxMobileSetAttemptContext,
  updateMobileStakingLanContext,
} from "@/staking/diagnostics"
import { wasMobileWalletReturnWithinMs } from "@/staking/diagnostics/mobileStakingLanLog"
import { isMobileWalletUserAgent } from "@/lib/wallet/evmSignerHydration"
import { abandonStakingVaultTxExecutionLoading } from "@/staking/tx/execution/stakingVaultTxExecutionOwnershipBridge"
import { releaseFormExecutionOwnershipForRetry } from "@/staking/tx/retryFormExecutionArm"
import {
  startStakingFormFlowRunnerDirect,
  tryStartStakingFormFlowRunnerFromLayout,
} from "@/staking/tx/stakingFormFlowRunnerStart"
import { STAKING_TX_EXECUTION_NOT_READY_MESSAGE } from "@/staking/tx/stakingTxExecutionReadiness"
import {
  snapshotNeedsApprovalRecoveryCheck,
  tryRecoverStakingApprovalFromOnChainAllowance,
} from "@/staking/tx/stakingApprovalRecoveryFromSnapshot"
import {
  filterStakingDecimalInput,
  normalizeDecimalAmountInput,
  tryParseAmountWei,
} from "@/lib/stakingAmountInput"
import { publicTokenSymbolLabel } from "@/lib/publicTokenDisplay"
import { vaultMerchantShareSymbol } from "@/lib/stakingTokenVisuals"
import { stakingGasFeeZeroDisplayLine } from "@/staking/execution"
import { allowanceExceedsLimitedCap, isUnlimitedErc20Allowance } from "@/lib/stakingAllowanceLimits"
import type { DepositApprovalKind } from "@/lib/stakingDepositApprovalExecution"
import { deriveDepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import { networkFeeRowRightDisplayValue } from "@/lib/stakingNetworkFeeDisplay"
import {
  STAKING_AMOUNT_FIELD_INPUT,
  STAKING_AMOUNT_FIELD_SHELL,
  STAKING_INPUT_ERROR,
  STAKING_INPUT_VIEW_ONLY,
} from "@/staking/ui"
import {
  isPassiveTronStakingRuntime,
  passiveTronWrongNetworkCtaLabel,
} from "@/staking/identity"
import { DEBUG_LOGS } from "@/staking/config"
import { STAKING_DEPOSIT_CTA_REASON_UI_SUPPRESSED } from "@/constants/stakingCtaMessages"
import { logger } from "@/lib/logger"
import { cn, removeTrailingZeros } from "@/lib/utils"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useProfitManagerStatus } from "@/hooks/useProfitManagerStatus"
import { useStakingCtaState } from "@/hooks/useStakingCtaState"
import { useStakingFeeDisplaySmoothing } from "@/hooks/useStakingFeeDisplaySmoothing"
import { useStakingFormLifecycle } from "@/hooks/useStakingFormLifecycle"
import { useStakingGasToastDedupe } from "@/staking/execution"
import {
  getStakingGasTuning,
  useStakingGasMetrics,
} from "@/lib/stakingGasMetrics"
import { resolveFrozenExecutionTarget } from "@/staking/core/persistenceTypes"
import { useActiveRuntimeSelection } from "@/staking/core/runtimeSelectionContext"
import { useRuntimeTransitionSnapshot } from "@/staking/core/runtimeSelectionHooks"
import {
  createStakingToastDedupeKey,
  stakingToastDedupeFingerprint,
  stakingToastError,
} from "@/staking/ui"
import { isNearZeroNativeBalance } from "@/staking/execution"
import { formatEther, formatUnits } from "ethers"
import { Loader2 } from "lucide-react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

import { deriveStakingCtaTxPhaseFromSnapshot } from "@/staking/cta"
import { resolveStakingFormInlinePresentation } from "@/staking/cta"
import {
  clearPersistedStakingTxUserRejection,
  isPostApprovalStakeWalletWait,
  snapshotAllowsAutoDispatch,
  isTransactionStatusTerminalUiPhase,
} from "@/staking/tx"

function isNegativeAmountInput(value: string) {
  return value.trim().startsWith("-")
}

const ZERO_AMOUNT_DISPLAY = "0.000000"

type StakingFormNetworkDraft = Readonly<{
  amount: string
  slider: number[]
}>

function StakingAppDepositForm({
  focusAmountRequest = 0,
}: {
  focusAmountRequest?: number
}) {
  const {
    executionAddress,
    executionConnected,
    executionChainId,
    openWallet,
    canTransact,
    txExecutionReady,
    awaitingSigner,
    vaultDataReady,
    loading,
    isWrongNetwork,
    isAttemptingNetworkSwitch,
    requestNetworkSwitch,
    tokenMetaError,
    allowance,
    tokenSymbol,
    tokenDecimals,
    walletBalance,
    maxStakeWei,
    approveStakeAmount,
    deposit,
    stakingOwnerAddress,
    tokenAddress,
    runtimeWallet,
  } = useStakingVault()
  const activeRuntimeSelection = useActiveRuntimeSelection()
  const applyEvmNetworkAndGasCtaBlocks =
    activeRuntimeSelection.deployment.chainFamily === "evm"
  const isPassiveTronRuntime = isPassiveTronStakingRuntime(
    activeRuntimeSelection.deployment
  )
  const transition = useRuntimeTransitionSnapshot()
  const ctaRuntimeTransitionSettling =
    transition.sequenceStage !== "idle" &&
    transition.sequenceStage !== "settled"
  const ctaIdentityConnected = applyEvmNetworkAndGasCtaBlocks
    ? executionConnected
    : runtimeWallet.hasAccount
  const { data: profitStatus } = useProfitManagerStatus()
  const appKitReady = useAppKitReady()
  const { ensureAcceptedOrPrompt, ready, accepted, dialogOpen } =
    useStakingTermsConsent()
  const lastTermsDiagSigRef = useRef("")
  const lastDevModalBusySigRef = useRef("")

  useEffect(() => {
    if (!DEBUG_LOGS) return
    const sig = `${ready}|${accepted}|${dialogOpen}`
    if (sig === lastTermsDiagSigRef.current) return
    lastTermsDiagSigRef.current = sig
    logger.log("[TERMS STATE]", { ready, accepted, dialogOpen })
    if (!ready) logger.warn("[CTA BLOCKED BY]", "TERMS_NOT_READY")
  }, [ready, accepted, dialogOpen])

  const safeMaxStakeWei = maxStakeWei ?? 0n

  const displayAvailableToStake = useMemo(() => {
    if (tokenDecimals === null) return ZERO_AMOUNT_DISPLAY
    try {
      return removeTrailingZeros(formatUnits(safeMaxStakeWei, tokenDecimals))
    } catch {
      return ZERO_AMOUNT_DISPLAY
    }
  }, [safeMaxStakeWei, tokenDecimals])

  const [amount, setAmount] = useState("")
  const [sliderValue, setSliderValue] = useState([0])
  const depositDraftByDeploymentRef = useRef(new Map<string, StakingFormNetworkDraft>())
  const lastDepositDeploymentIdRef = useRef<string | null>(null)
  const amountDraftSyncRef = useRef(amount)
  const sliderDraftSyncRef = useRef(sliderValue)
  amountDraftSyncRef.current = amount
  sliderDraftSyncRef.current = sliderValue
  const [amountFocusHighlight, setAmountFocusHighlight] = useState(false)
  const submitInFlightRef = useRef(false)
  /** Immediate button disable (refs alone don’t re-render). */
  const [submitUiLocked, setSubmitUiLocked] = useState(false)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const lastHandledFocusRequest = useRef(0)

  const trimmedAmount = amount.trim()

  // §19.11: adaptive debounce.
  useStakingGasMetrics()
  const { debounceMs } = getStakingGasTuning()
  const debouncedTrimmed = useDebouncedValue(trimmedAmount, debounceMs)

  const parsedDebounced = useMemo(
    () =>
      tryParseAmountWei(
        normalizeDecimalAmountInput(debouncedTrimmed),
        tokenDecimals
      ),
    [debouncedTrimmed, tokenDecimals]
  )
  const parsedWei = useMemo(
    () => tryParseAmountWei(trimmedAmount, tokenDecimals),
    [trimmedAmount, tokenDecimals]
  )

  const hasInvalidAmount = trimmedAmount !== "" && parsedWei === null
  const exceedsBalance = parsedWei !== null && parsedWei > maxStakeWei

  const needsApproval = Boolean(
    applyEvmNetworkAndGasCtaBlocks &&
      executionConnected &&
      !isWrongNetwork &&
      vaultDataReady &&
      canTransact &&
      parsedWei !== null &&
      parsedWei > 0n &&
      !exceedsBalance &&
      tokenDecimals !== null &&
      (allowance < parsedWei ||
        allowanceExceedsLimitedCap(allowance, tokenDecimals))
  )

  const depositApprovalKindResolved = useMemo((): DepositApprovalKind | null => {
    if (!needsApproval || parsedWei === null || tokenDecimals === null)
      return null
    if (allowance < parsedWei) return "insufficient"
    return "downgrade_only"
  }, [needsApproval, allowance, parsedWei, tokenDecimals])

  const depositApprovalChainMode = useMemo(
    (): "limited" | "unlimited" =>
      isUnlimitedErc20Allowance(allowance) ? "unlimited" : "limited",
    [allowance]
  )

  const depositApprovalExecutionDefault = useMemo(
    () =>
      deriveDepositApprovalExecution({
        needsApproval,
        depositApprovalKind: depositApprovalKindResolved,
        approvalMode: depositApprovalChainMode,
      }),
    [needsApproval, depositApprovalKindResolved, depositApprovalChainMode]
  )

  const txStatus = useTransactionStatus()
  const resetTxLifecycleRef = useRef(txStatus.resetTransactionLifecycle)
  resetTxLifecycleRef.current = txStatus.resetTransactionLifecycle
  const ctaTxPhase = useMemo(
    () => deriveStakingCtaTxPhaseFromSnapshot("deposit", txStatus.snapshot),
    [txStatus.snapshot]
  )
  const amountLifecyclePhase =
    txStatus.snapshot.preparingTransaction ||
    ctaTxPhase === "approving" ||
    ctaTxPhase === "depositing" ||
    ctaTxPhase === "depositAfterApproval" ||
    ctaTxPhase === "withdrawing" ||
    ctaTxPhase === "preparing_transaction" ||
    ctaTxPhase === "submitted" ||
    ctaTxPhase === "confirming"
      ? "busy"
      : "idle"
  const txSnapshotRef = useRef(txStatus.snapshot)
  txSnapshotRef.current = txStatus.snapshot
  const txExecutionReadyRef = useRef(txExecutionReady)
  txExecutionReadyRef.current = txExecutionReady

  const handleApproveAndDepositRef = useRef<
    (
      launchMode?: "preview" | "direct",
      options?: { depositContinuation?: boolean }
    ) => void
  >(() => {})

  const depositApprovalExecutionForGas = useMemo(() => {
    const snap = txStatus.snapshot
    if (
      snap.scenario === "deposit" &&
      snap.needsApproval &&
      snap.dialogOpen
    ) {
      return deriveDepositApprovalExecution({
        needsApproval: snap.needsApproval,
        depositApprovalKind: snap.depositApprovalKind,
        approvalMode: snap.approvalMode,
      })
    }
    return depositApprovalExecutionDefault
  }, [txStatus.snapshot, depositApprovalExecutionDefault])

  /** Matches `useStakingGasEstimate` two-step preview (incl. open deposit modal). */
  const showSplitGasFeeRows = depositApprovalExecutionForGas !== "skip"

  const sliderDraggingRef = useRef(false)
  /** Re-render while dragging so fee hint / fee row stay hidden during slider movement. */
  const [sliderActive, setSliderActive] = useState(false)
  const [gasStableWei, setGasStableWei] = useState<bigint | null>(null)

  useEffect(() => {
    if (sliderDraggingRef.current) return
    setGasStableWei(parsedDebounced)
  }, [parsedDebounced])

  const gasEnabled = Boolean(
    applyEvmNetworkAndGasCtaBlocks &&
      executionConnected &&
      vaultDataReady &&
      !isWrongNetwork &&
      canTransact &&
      tokenAddress &&
      executionAddress
  )

  const {
    feeDisplayLine,
    ethUsdPresentation,
    isEstimating,
    isRevalidating,
    hasEstimate,
    estimateSuccess,
    insufficientNative,
    nearZeroEth,
    feeSpikeWarning,
    highCongestionWarning,
    prepareSubmit,
    endSubmitPhase,
    flushEstimate,
    gasFirstStepMaxFeeWei,
    gasSecondStepMaxFeeWei,
    depositSecondPreviewUnavailable,
    nativeBalanceWei,
  } = useStakingFeeDisplaySmoothing({
    scenario: "deposit",
    depositApprovalExecution: depositApprovalExecutionForGas,
    stableAmountWei: gasStableWei,
    tokenAddress: tokenAddress ?? null,
    userAddress: executionAddress ?? null,
    chainId: executionChainId,
    showDepositStep2Preview: depositApprovalExecutionForGas !== "skip",
    enabled: gasEnabled,
    expectedExecutionTarget:
      txStatus.snapshot.transactionRuntime != null
        ? resolveFrozenExecutionTarget(txStatus.snapshot.transactionRuntime)
        : undefined,
  })

  const gasAmountValidForFee = Boolean(
    parsedWei !== null && parsedWei > 0n && !exceedsBalance
  )
  const gasUiActive = Boolean(
    applyEvmNetworkAndGasCtaBlocks &&
      executionConnected &&
      vaultDataReady &&
      !isWrongNetwork
  )

  /** Usable for CTA + preview: last successful estimate still shown (not optimistic). */
  const hasUsableDepositGasEstimate = useMemo(
    () =>
      Boolean(
        estimateSuccess &&
          hasEstimate &&
          feeDisplayLine.trim() !== "" &&
          (!showSplitGasFeeRows ||
            gasSecondStepMaxFeeWei !== null ||
            depositSecondPreviewUnavailable)
      ),
    [
      estimateSuccess,
      hasEstimate,
      feeDisplayLine,
      showSplitGasFeeRows,
      gasSecondStepMaxFeeWei,
      depositSecondPreviewUnavailable,
    ]
  )

  /**
   * Approve+deposit (split gas): first-step approval fee is enough to unblock the primary CTA.
   * Deposit-step preview may still be in flight; `prepareSubmit` refreshes gas at submit time.
   */
  const hasUsableApprovalFlowEstimate = useMemo(
    () =>
      Boolean(
        showSplitGasFeeRows &&
          estimateSuccess &&
          hasEstimate &&
          gasFirstStepMaxFeeWei !== null &&
          feeDisplayLine.trim() !== ""
      ),
    [
      showSplitGasFeeRows,
      estimateSuccess,
      hasEstimate,
      gasFirstStepMaxFeeWei,
      feeDisplayLine,
    ]
  )

  /** Modal preview / initial fee line: same readiness as CTA fee gate (approval-first when split). */
  const previewGasEstimateReady = useMemo(
    () =>
      Boolean(
        gasAmountValidForFee &&
          (showSplitGasFeeRows
            ? hasUsableApprovalFlowEstimate
            : hasUsableDepositGasEstimate)
      ),
    [
      gasAmountValidForFee,
      showSplitGasFeeRows,
      hasUsableApprovalFlowEstimate,
      hasUsableDepositGasEstimate,
    ]
  )

  /**
   * Fee readiness for primary CTA: block only on initial load or hard-fail (no usable line),
   * not on periodic background revalidation while a prior good estimate remains.
   */
  const depositFeeReady = useMemo(() => {
    if (!gasAmountValidForFee || !gasEnabled) return true

    if (!showSplitGasFeeRows) {
      if (hasUsableDepositGasEstimate && isRevalidating) return true
      if (isEstimating || isRevalidating) return false
      return hasUsableDepositGasEstimate
    }

    // Split (limited / unlimited approve path): do not wait for deposit-step preview.
    if (hasUsableApprovalFlowEstimate && isRevalidating) return true
    if (hasUsableApprovalFlowEstimate) return true
    if (isEstimating || isRevalidating) return false
    return hasUsableDepositGasEstimate
  }, [
    gasAmountValidForFee,
    gasEnabled,
    showSplitGasFeeRows,
    hasUsableDepositGasEstimate,
    hasUsableApprovalFlowEstimate,
    isEstimating,
    isRevalidating,
  ])

  const previewFeeCanonicalMaxWeiHex = useMemo(() => {
    const a = gasFirstStepMaxFeeWei
    const b = gasSecondStepMaxFeeWei
    if (depositApprovalExecutionForGas === "skip") {
      return a != null ? `0x${a.toString(16)}` : null
    }
    if (a != null && b != null) return `0x${(a + b).toString(16)}`
    if (a != null) return `0x${a.toString(16)}`
    if (b != null) return `0x${b.toString(16)}`
    return null
  }, [
    depositApprovalExecutionForGas,
    gasFirstStepMaxFeeWei,
    gasSecondStepMaxFeeWei,
  ])

  useEffect(() => {
    const s = txStatus.snapshot
    if (!s.dialogOpen || s.uiPhase !== "preview") return
    if (s.scenario !== "deposit") return

    const ready = previewGasEstimateReady
    txStatus.syncPreviewGasEstimate({
      feeLine: ready ? feeDisplayLine : "",
      previewGasEstimateReady: ready,
      feeCanonicalMaxWeiHex: ready ? previewFeeCanonicalMaxWeiHex : null,
    })
  }, [
    txStatus.snapshot.dialogOpen,
    txStatus.snapshot.uiPhase,
    txStatus.snapshot.scenario,
    txStatus.syncPreviewGasEstimate,
    previewGasEstimateReady,
    feeDisplayLine,
    previewFeeCanonicalMaxWeiHex,
  ])

  // STEP 6 - rising-edge gas toasts.
  useStakingGasToastDedupe({
    enabled: applyEvmNetworkAndGasCtaBlocks,
    isConnected: executionConnected,
    vaultDataReady,
    isWrongNetwork,
    nearZeroEth,
    estimateSuccess,
    insufficientNative,
    txInFlight: ctaTxPhase !== "idle",
  })

  // STEP 10 - lifecycle resets.
  const onWalletDisconnect = useCallback(() => {
    const snap = txSnapshotRef.current
    const approvalTrack =
      snap.scenario === "deposit" &&
      snap.dialogOpen &&
      (snap.uiPhase === "awaiting_signature" ||
        snap.uiPhase === "submitted" ||
        snap.uiPhase === "confirming") &&
      deriveDepositApprovalExecution({
        needsApproval: snap.needsApproval,
        depositApprovalKind: snap.depositApprovalKind,
        approvalMode: snap.approvalMode,
      }) !== "skip" &&
      !snap.approveComplete &&
      !snap.approveTxHash?.trim()
    const depositSignatureTrack =
      snap.scenario === "deposit" &&
      snap.dialogOpen &&
      (snap.uiPhase === "awaiting_signature" ||
        snap.uiPhase === "submitted" ||
        snap.uiPhase === "confirming") &&
      !snap.depositTxHash?.trim() &&
      (snap.approveComplete ||
        Boolean(snap.approveTxHash?.trim()) ||
        deriveDepositApprovalExecution({
          needsApproval: snap.needsApproval,
          depositApprovalKind: snap.depositApprovalKind,
          approvalMode: snap.approvalMode,
        }) === "skip")
    if (approvalTrack || depositSignatureTrack) {
      traceMobileStakingFlow("wallet_disconnect_reset_deferred", {
        form: "deposit",
        uiPhase: snap.uiPhase,
        submissionId: snap.submissionId,
        track: approvalTrack ? "approval" : "deposit_signature",
      })
      stakingTxLifecycleDev("wallet_disconnect_reset_deferred", {
        form: "deposit",
        uiPhase: snap.uiPhase,
      })
      return
    }
    stakingTxLifecycleDev("wallet_disconnect", { form: "deposit" })
    txStatus.resetTransactionLifecycle()
    depositDraftByDeploymentRef.current.clear()
    lastDepositDeploymentIdRef.current = null
    setAmount("")
    setSliderValue([0])
  }, [txStatus, amount, ctaIdentityConnected, executionAddress, executionChainId])

  useEffect(() => {
    if (amount.trim() !== "") return
    const s = txStatus.snapshot
    if (s.scenario !== "deposit") return
    if (s.terminalReason === "user_rejected") return
    if (s.uiPhase === null || isTransactionStatusTerminalUiPhase(s.uiPhase)) return
    const m = /^([0-9]+(?:[.,][0-9]+)?)/.exec(s.amountLabel.trim())
    const restored = m?.[1]?.replace(",", ".") ?? ""
    if (!restored) return
    setAmount(restored)
  }, [txStatus.snapshot, amount])
  const onNetworkChange = useCallback(() => {
    txStatus.resetTransactionLifecycle()
  }, [txStatus])
  const onAmountChangeIdle = useCallback(() => {}, [])

  useStakingFormLifecycle({
    isConnected: ctaIdentityConnected,
    address: applyEvmNetworkAndGasCtaBlocks
      ? executionAddress ?? null
      : stakingOwnerAddress ?? null,
    passiveAccountKey: isPassiveTronRuntime ? stakingOwnerAddress ?? null : undefined,
    chainId: applyEvmNetworkAndGasCtaBlocks ? executionChainId : null,
    isWrongNetwork,
    amount,
    txPhase: amountLifecyclePhase,
    isPassiveTronRuntime,
    onWalletDisconnect,
    onNetworkChange,
    onAmountChangeIdle,
  })

  useLayoutEffect(() => {
    const depId = activeRuntimeSelection.deployment.id.trim()
    const prev = lastDepositDeploymentIdRef.current

    if (prev !== null && prev !== depId) {
      depositDraftByDeploymentRef.current.set(prev, {
        amount: amountDraftSyncRef.current,
        slider: [...sliderDraftSyncRef.current],
      })
      resetTxLifecycleRef.current()
    }

    lastDepositDeploymentIdRef.current = depId

    const restored = depositDraftByDeploymentRef.current.get(depId)
    if (restored) {
      setAmount(restored.amount)
      setSliderValue([...restored.slider])
    } else if (prev !== null && prev !== depId) {
      setAmount("")
      setSliderValue([0])
    }
  }, [activeRuntimeSelection.deployment.id])

  useEffect(() => {
    if (focusAmountRequest === 0) return
    if (focusAmountRequest <= lastHandledFocusRequest.current) return
    lastHandledFocusRequest.current = focusAmountRequest
    const timeoutIds: number[] = []
    const focusAmountInput = () => {
      const input = amountInputRef.current
      if (!input) return

      const isMobileViewport = window.matchMedia("(max-width: 767px)").matches
      input.scrollIntoView({
        behavior: "smooth",
        block: isMobileViewport ? "center" : "nearest",
        inline: "nearest",
      })

      input.focus({ preventScroll: true })
      setAmountFocusHighlight(true)
    }

    const rafId = requestAnimationFrame(() => {
      focusAmountInput()
      timeoutIds.push(window.setTimeout(focusAmountInput, 120))
      timeoutIds.push(window.setTimeout(focusAmountInput, 280))
    })

    return () => {
      cancelAnimationFrame(rafId)
      timeoutIds.forEach(window.clearTimeout)
    }
  }, [focusAmountRequest])

  const formNumericLoading =
    applyEvmNetworkAndGasCtaBlocks
      ? executionConnected && !isWrongNetwork && !vaultDataReady
      : !vaultDataReady

  const displayNativeGasAmount = useMemo(() => {
    if (nativeBalanceWei === null) return null
    const s = formatEther(nativeBalanceWei)
    const dot = s.indexOf(".")
    if (dot === -1) return s
    const intPart = s.slice(0, dot)
    const frac = s.slice(dot + 1, dot + 1 + 6)
    return removeTrailingZeros(frac.length > 0 ? `${intPart}.${frac}` : intPart)
  }, [nativeBalanceWei])

  const stakingAssetBalanceNumericIsZero =
    !formNumericLoading && safeMaxStakeWei === 0n
  const nativeGasBalanceIsZero =
    applyEvmNetworkAndGasCtaBlocks &&
    nativeBalanceWei !== null &&
    nativeBalanceWei === 0n
  const nativeGasBalanceWarn =
    applyEvmNetworkAndGasCtaBlocks &&
    nativeBalanceWei !== null &&
    nativeBalanceWei > 0n &&
    isNearZeroNativeBalance(nativeBalanceWei)

  const needsApprovalForPrimaryCta = useMemo(() => {
    const snap = txStatus.snapshot
    if (
      snap.dialogOpen &&
      snap.scenario === "deposit" &&
      snap.needsApproval
    ) {
      return (
        deriveDepositApprovalExecution({
          needsApproval: snap.needsApproval,
          depositApprovalKind: snap.depositApprovalKind,
          approvalMode: snap.approvalMode,
        }) !== "skip"
      )
    }
    return depositApprovalExecutionDefault !== "skip"
  }, [txStatus.snapshot, depositApprovalExecutionDefault])

  const cta = useStakingCtaState({
    scenario: "deposit",
    isConnected: ctaIdentityConnected,
    awaitingSigner,
    vaultDataReady,
    loading: loading || ctaRuntimeTransitionSettling,
    isWrongNetwork,
    isAttemptingNetworkSwitch,
    tokenMetaError,
    txSnapshot: txStatus.snapshot,
    txExecutionReady,
    termsAccepted: accepted,
    trimmedAmount,
    hasInvalidAmount,
    parsedWeiPositive: parsedWei !== null && parsedWei > 0n,
    exceedsLimit: exceedsBalance,
    belowMinWithdrawal: false,
    needsApproval: needsApprovalForPrimaryCta,
    nearZeroEth,
    insufficientNative,
    estimateSuccess,
    depositFeeReady,
    applyEvmNetworkAndGasCtaBlocks,
    applyWrongNetworkCtaBlocks: isPassiveTronRuntime,
    wrongNetworkLabel: isPassiveTronRuntime
      ? passiveTronWrongNetworkCtaLabel(activeRuntimeSelection.deployment.caip2)
      : undefined,
    passiveRuntimeViewOnly: isPassiveTronRuntime && !isWrongNetwork,
  })

  const [successLockActive, setSuccessLockActive] = useState(false)
  const successTimerRef = useRef<number | null>(null)
  const [submitIntentActive, setSubmitIntentActive] = useState(false)
  const intentStartedAtRef = useRef(0)
  /** Bumped only at wallet-hint thresholds (3s / 8s) so inline reason updates without 300ms full-tree rerenders. */
  const [intentWalletHintEpoch, setIntentWalletHintEpoch] = useState(0)
  const submissionIdRef = useRef(0)
  const lastHandledRetryNonceRef = useRef(0)
  /** Dedupes React 18 StrictMode double effect passes for the same idle snapshot. */
  const idleUnlockHandledForSnapshotRef = useRef<TransactionStatusSnapshot | null>(
    null
  )
  const mountedRef = useRef(true)
  const [clickCooldown, setClickCooldown] = useState(false)
  const clickCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const [isFlowArmed, setIsFlowArmed] = useState(false)
  const depositFlowRunnerRef = useRef<(() => void) | null>(null)
  const depositFlowRunnerStartedRef = useRef(false)
  const walletFlowStartedRef = useRef(false)
  const dismissedPanelDuringWalletRef = useRef(false)

  const preSignatureWalletSessionReady = useCallback(
    () => {
      const ready = Boolean(
        appKitReady &&
          ctaIdentityConnected &&
          executionConnected &&
          !isWrongNetwork &&
          canTransact &&
          txExecutionReadyRef.current &&
          executionAddress &&
          executionChainId != null &&
          !awaitingSigner
      )
      if (ready) return true
      const sid = submissionIdRef.current
      txStatus.setFailed("Wallet session expired. Reconnect wallet to continue.", {
        submissionId: sid > 0 ? sid : undefined,
        source: "pre_signature_wallet_session",
      })
      return false
    },
    [
      appKitReady,
      ctaIdentityConnected,
      executionConnected,
      isWrongNetwork,
      canTransact,
      executionAddress,
      executionChainId,
      awaitingSigner,
      txStatus,
    ]
  )

  const tryRecoverApprovalFromOnChain = useCallback(
    async (source: string) =>
      tryRecoverStakingApprovalFromOnChainAllowance({
        snapshot: txSnapshotRef.current,
        deployment: activeRuntimeSelection.deployment,
        tokenAddress: tokenAddress ?? null,
        tokenDecimals,
        ownerAddress: executionAddress,
        source,
      }),
    [
      activeRuntimeSelection.deployment,
      tokenAddress,
      tokenDecimals,
      executionAddress,
    ]
  )

  const clearSuccessCelebration = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
    setSuccessLockActive(false)
  }, [])

  const startNewStakingAttempt = useCallback(() => {
    clearSuccessCelebration()
  }, [clearSuccessCelebration])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
        successTimerRef.current = null
      }
      if (clickCooldownTimerRef.current != null) {
        clearTimeout(clickCooldownTimerRef.current)
        clickCooldownTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible" || !successLockActive) return
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      successTimerRef.current = window.setTimeout(() => {
        clearSuccessCelebration()
      }, 2000)
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [successLockActive, clearSuccessCelebration])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return
      const snap = txSnapshotRef.current
      if (!snapshotNeedsApprovalRecoveryCheck(snap)) return
      void (async () => {
        const recovered = await tryRecoverApprovalFromOnChain("visibility_return")
        if (
          recovered &&
          submissionIdRef.current === snap.submissionId &&
          mountedRef.current
        ) {
          txStatus.signalDepositContinuationRetry("visibility_return")
          traceMobileStakingFlow("approval_recovered_on_chain_after_wallet_return", {
            submissionId: snap.submissionId,
            source: "visibility_return",
          })
        }
      })()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [tryRecoverApprovalFromOnChain, txStatus])

  useEffect(() => {
    let staleTimer: number | null = null
    const clearStaleTimer = () => {
      if (staleTimer != null) {
        window.clearTimeout(staleTimer)
        staleTimer = null
      }
    }
    const onVis = () => {
      if (document.visibilityState !== "visible") {
        clearStaleTimer()
        return
      }
      const snap = txSnapshotRef.current
      if (!isPostApprovalStakeWalletWait(snap)) return
      if (!wasMobileWalletReturnWithinMs(12_000)) return
      clearStaleTimer()
      staleTimer = window.setTimeout(() => {
        staleTimer = null
        const live = txSnapshotRef.current
        if (!isPostApprovalStakeWalletWait(live)) return
        if (live.depositTxHash?.trim()) return
        if (live.submissionId == null || live.submissionId <= 0) return
        traceMobileStakingFlow("stake_wallet_wait_stale_after_refresh_recovered", {
          submissionId: live.submissionId,
          approvalTxHash: live.approveTxHash,
          stakeTxHash: live.depositTxHash,
        })
        txStatus.markPostApprovalStakeWalletTerminal({
          submissionId: live.submissionId,
          kind: "user_rejected",
          source: "stake_wallet_return_without_hash",
          flowRunId: live.runId ?? undefined,
        })
      }, 5_000)
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      clearStaleTimer()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [txStatus])

  useEffect(() => {
    if (ctaTxPhase !== "idle") setSubmitIntentActive(false)
  }, [ctaTxPhase])

  useEffect(() => {
    if (successLockActive) setSubmitIntentActive(false)
  }, [successLockActive])

  useEffect(() => {
    if (!submitIntentActive || ctaTxPhase !== "idle") return
    const start = intentStartedAtRef.current
    const now = Date.now()
    const to3 = window.setTimeout(() => {
      setIntentWalletHintEpoch(e => e + 1)
    }, Math.max(0, 3000 - (now - start)))
    const to8 = window.setTimeout(() => {
      setIntentWalletHintEpoch(e => e + 1)
    }, Math.max(0, 8000 - (now - start)))
    return () => {
      clearTimeout(to3)
      clearTimeout(to8)
    }
  }, [submitIntentActive, ctaTxPhase])

  const uiPhase = useMemo(
    () =>
      deriveStakingUiPhase({
        successLockActive,
        txPhase: ctaTxPhase,
        scenario: "deposit",
        cta: { actionType: cta.actionType, disabled: cta.disabled },
      }),
    [successLockActive, ctaTxPhase, cta.actionType, cta.disabled]
  )

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    const aligned = deriveTxUiPhaseFromTxPhase(ctaTxPhase, txStatus.snapshot.uiPhase)
    if (aligned === "busy" && ctaTxPhase === "idle" && txStatus.snapshot.uiPhase !== null) {
      const sig = `${ctaTxPhase}|${txStatus.snapshot.uiPhase}`
      if (sig === lastDevModalBusySigRef.current) return
      lastDevModalBusySigRef.current = sig
      stakingTxIntegrityDev("modal_form_phase_drift", {
        form: "deposit",
        uiPhase: txStatus.snapshot.uiPhase,
      })
    }
  }, [ctaTxPhase, txStatus.snapshot.uiPhase])

  useLayoutEffect(() => {
    const snap = txStatus.snapshot
    if (snap.scenario !== "deposit") return
    tryStartStakingFormFlowRunnerFromLayout({
      form: "deposit",
      launch: "preview_preparing_layout",
      isFlowArmed,
      uiPhase: snap.uiPhase,
      preparingTransaction: snap.preparingTransaction,
      flowRunnerStarted: depositFlowRunnerStartedRef,
      flowRunner: depositFlowRunnerRef,
      setIsFlowArmed,
      canAutoDispatch: () => snapshotAllowsAutoDispatch(txSnapshotRef.current),
    })
  }, [isFlowArmed, txStatus.snapshot])

  const terminalSuccessClearedRef = useRef(false)
  useEffect(() => {
    const s = txStatus.snapshot
    if (s.scenario !== "deposit") {
      terminalSuccessClearedRef.current = false
      return
    }
    if (s.uiPhase !== "confirmed" && s.uiPhase !== "success") {
      terminalSuccessClearedRef.current = false
      return
    }
    if (terminalSuccessClearedRef.current) return
    terminalSuccessClearedRef.current = true
    setAmount("")
    setSliderValue([0])
  }, [txStatus.snapshot])

  /** User dismissed transaction panel while a broadcast / confirm was in flight. */
  useEffect(() => {
    const s = txStatus.snapshot
    const closedOrDismissEpilogue = !s.dialogOpen || s.uiPhase === "cancelled"
    if (!closedOrDismissEpilogue) return
    if (submitInFlightRef.current && walletFlowStartedRef.current) {
      dismissedPanelDuringWalletRef.current = true
    }
  }, [txStatus.snapshot])

  /** After full modal idle reset only — never on `cancelled` epilogue or post-broadcast detach. */
  useEffect(() => {
    const s = txStatus.snapshot
    if (s.uiPhase === "cancelled") return
    if (!s.dialogOpen && (s.uiPhase === "submitted" || s.uiPhase === "confirming")) {
      return
    }
    const idleClosed = !s.dialogOpen && s.uiPhase === null
    if (!idleClosed) {
      idleUnlockHandledForSnapshotRef.current = null
      return
    }

    const flowDirty =
      submitUiLocked ||
      ctaTxPhase !== "idle" ||
      submitInFlightRef.current ||
      walletFlowStartedRef.current ||
      isFlowArmed ||
      depositFlowRunnerRef.current !== null

    if (!flowDirty) return

    if (idleUnlockHandledForSnapshotRef.current === s) return
    idleUnlockHandledForSnapshotRef.current = s

    const prevSub = submissionIdRef.current
    submissionIdRef.current += 1
    stakingTxLifecycleDev("unlock_effect_idle_closed", {
      form: "deposit",
      submissionIdBefore: prevSub,
      submissionIdAfter: submissionIdRef.current,
    })
    abandonStakingVaultTxExecutionLoading("deposit_form_idle_unlock")
    setIsFlowArmed(false)
    depositFlowRunnerRef.current = null
    depositFlowRunnerStartedRef.current = false
    submitInFlightRef.current = false
    walletFlowStartedRef.current = false
    setSubmitUiLocked(false)
    setSubmitIntentActive(false)
    endSubmitPhase()
  }, [txStatus.snapshot, submitUiLocked, ctaTxPhase, isFlowArmed, endSubmitPhase])

  const intentElapsedMs = useMemo(() => {
    void intentWalletHintEpoch
    if (!submitIntentActive || ctaTxPhase !== "idle") return 0
    return Date.now() - intentStartedAtRef.current
  }, [submitIntentActive, ctaTxPhase, intentWalletHintEpoch])

  const inlineCtaReason = useMemo(
    () =>
      selectStakingInlineCtaReason({
        uiPhase,
        scenario: "deposit",
        txPhase: ctaTxPhase,
        submitIntentActive,
        intentElapsedMs,
        ctaReason: cta.reason,
        detachedAwaitingReceipt:
          !txStatus.snapshot.dialogOpen &&
          (txStatus.snapshot.uiPhase === "submitted" ||
            txStatus.snapshot.uiPhase === "confirming"),
      }),
    [
      uiPhase,
      ctaTxPhase,
      submitIntentActive,
      intentElapsedMs,
      cta.reason,
      txStatus.snapshot.dialogOpen,
      txStatus.snapshot.uiPhase,
    ]
  )

  const defaultSubmitLabel = useMemo(
    () => (needsApproval ? "Approve & Stake" : "Stake"),
    [needsApproval]
  )

  const inlinePresentation = useMemo(
    () =>
      resolveStakingFormInlinePresentation({
        scenario: "deposit",
        inlineCtaReason,
        suppressedReasonMessages: STAKING_DEPOSIT_CTA_REASON_UI_SUPPRESSED,
        cta: {
          label: cta.label,
          actionType: cta.actionType,
          disabled: cta.disabled,
        },
      }),
    [inlineCtaReason, cta.label, cta.actionType, cta.disabled]
  )

  const effectiveCtaLabel = inlinePresentation.ctaPreferVerb
    ? defaultSubmitLabel
    : cta.label

  const primaryLabel = useMemo(
    () =>
      getStakingPrimaryLabel({
        uiPhase,
        scenario: "deposit",
        txPhase: ctaTxPhase,
        ctaLabel: effectiveCtaLabel,
      }),
    [uiPhase, ctaTxPhase, effectiveCtaLabel]
  )

  const animatePrimaryEllipsis = useMemo(
    () =>
      shouldAnimateStakingPrimaryEllipsis({
        uiPhase,
        ctaTxPhase,
        successLockActive,
        ctaLabel: effectiveCtaLabel,
      }),
    [uiPhase, ctaTxPhase, successLockActive, effectiveCtaLabel]
  )

  const animateReasonEllipsis = useMemo(
    () =>
      shouldAnimateStakingReasonEllipsis(inlinePresentation.lineReason, uiPhase),
    [inlinePresentation.lineReason, uiPhase]
  )

  const primaryDisabled = useMemo(
    () =>
      getStakingPrimaryDisabled({
        uiPhase,
        cta,
        submitUiLocked,
      }),
    [uiPhase, cta, submitUiLocked]
  )

  /** DEV: trace deposit approval + CTA disable (gated by DEBUG_LOGS). Remove after regression is fixed. */
  const devDepositPipelineLogRef = useRef("")
  useEffect(() => {
    if (!DEBUG_LOGS) return

    const needsApprovalForCta = needsApprovalForPrimaryCta

    let primaryDisableReason = "none"
    if (primaryDisabled) {
      if (submitUiLocked) primaryDisableReason = "submitUiLocked"
      else if (
        uiPhase === "approving" ||
        uiPhase === "depositing" ||
        uiPhase === "withdrawing" ||
        uiPhase === "confirming" ||
        uiPhase === "success"
      ) {
        primaryDisableReason = `uiPhase_${uiPhase}`
      } else if (cta.disabled) {
        primaryDisableReason = cta.reason?.message ?? "cta_disabled_unknown"
      } else {
        primaryDisableReason = "primaryDisabled_unexpected"
      }
    }

    const snap = txStatus.snapshot
    const approvalExecutionSnapshot =
      snap.scenario === "deposit" && snap.needsApproval && snap.dialogOpen
        ? deriveDepositApprovalExecution({
            needsApproval: snap.needsApproval,
            depositApprovalKind: snap.depositApprovalKind,
            approvalMode: snap.approvalMode,
          })
        : null

    const payload = {
      allowance: allowance.toString(),
      parsedAmountWei: parsedWei === null ? null : parsedWei.toString(),
      parsedDebouncedWei: parsedDebounced === null ? null : parsedDebounced.toString(),
      gasStableWei: gasStableWei === null ? null : gasStableWei.toString(),
      debouncedTrimmed,
      trimmedAmount,
      needsApprovalForm: needsApproval,
      needsApprovalForCta,
      depositApprovalKind: depositApprovalKindResolved,
      approvalExecutionDefault: depositApprovalExecutionDefault,
      approvalExecutionForGas: depositApprovalExecutionForGas,
      approvalExecutionSnapshot,
      dialogOpen: snap.dialogOpen,
      snapshotNeedsApproval: snap.needsApproval,
      snapshotDepositApprovalKind: snap.depositApprovalKind,
      snapshotApprovalMode: snap.approvalMode,
      depositFeeReady,
      hasUsableDepositGasEstimate,
      hasUsableApprovalFlowEstimate,
      previewGasEstimateReady,
      gasSplitDebug: {
        showSplitGasFeeRows,
        estimateSuccess,
        hasEstimate,
        feeDisplayLineEmpty: feeDisplayLine.trim() === "",
        gasSecondStepMaxFeeWei:
          gasSecondStepMaxFeeWei === null ? null : gasSecondStepMaxFeeWei.toString(),
        depositSecondPreviewUnavailable,
      },
      gasHooks: { isEstimating, isRevalidating, gasEnabled, gasAmountValidForFee },
      cta: {
        label: cta.label,
        disabled: cta.disabled,
        actionType: cta.actionType,
        reasonMessage: cta.reason?.message ?? null,
      },
      primaryDisabled,
      primaryDisableReason,
      submitUiLocked,
      isFlowArmed,
      ctaTxPhase,
      uiPhase,
      vaultLoading: loading,
    }

    const fp = JSON.stringify(payload)
    if (fp === devDepositPipelineLogRef.current) return
    devDepositPipelineLogRef.current = fp
    logger.log("[DEV DEPOSIT APPROVAL PIPELINE]", payload)
  }, [
    allowance,
    parsedWei,
    parsedDebounced,
    gasStableWei,
    debouncedTrimmed,
    trimmedAmount,
    needsApproval,
    needsApprovalForPrimaryCta,
    depositApprovalExecutionDefault,
    depositApprovalExecutionForGas,
    depositApprovalKindResolved,
    depositFeeReady,
    hasUsableDepositGasEstimate,
    hasUsableApprovalFlowEstimate,
    previewGasEstimateReady,
    estimateSuccess,
    hasEstimate,
    feeDisplayLine,
    showSplitGasFeeRows,
    gasFirstStepMaxFeeWei,
    gasSecondStepMaxFeeWei,
    depositSecondPreviewUnavailable,
    isEstimating,
    isRevalidating,
    gasEnabled,
    gasAmountValidForFee,
    cta.label,
    cta.disabled,
    cta.actionType,
    cta.reason,
    primaryDisabled,
    submitUiLocked,
    isFlowArmed,
    ctaTxPhase,
    uiPhase,
    loading,
    txStatus.snapshot,
  ])

  const primaryAriaBusy =
    uiPhase === "approving" ||
    uiPhase === "depositing" ||
    uiPhase === "withdrawing" ||
    uiPhase === "confirming"

  // STEP 7 - single-intent approve + deposit chain (preview → confirm → wallet).
  const handleApproveAndDeposit = (
    launchMode: "preview" | "direct" = "preview",
    options?: { depositContinuation?: boolean }
  ) => {
    const depositContinuation = options?.depositContinuation === true
    if (DEBUG_LOGS) {
      logger.log("[SUBMIT START]", {
        submitInFlight: submitInFlightRef.current,
        ctaTxPhase,
      })
    }
    if (submitInFlightRef.current) {
      if (DEBUG_LOGS) logger.warn("[BLOCKED]", "SUBMIT_IN_FLIGHT_LOCK")
      return
    }

    if (launchMode === "direct" && !txExecutionReady) {
      txStatus.setFailed(STAKING_TX_EXECUTION_NOT_READY_MESSAGE, {
        submissionId: submissionIdRef.current > 0 ? submissionIdRef.current : undefined,
        source: "deposit_direct_launch_not_ready",
      })
      return
    }

    setSubmitIntentActive(true)
    intentStartedAtRef.current = Date.now()

    submitInFlightRef.current = true
    setSubmitUiLocked(true)

    const termsOk = ensureAcceptedOrPrompt()
    if (DEBUG_LOGS) logger.log("[TERMS CHECK]", { termsOk })
    if (!termsOk) {
      if (DEBUG_LOGS) logger.warn("[BLOCKED]", "TERMS_GATE")
      submitInFlightRef.current = false
      setSubmitUiLocked(false)
      setSubmitIntentActive(false)
      return
    }
    startNewStakingAttempt()
    let submissionId: number
    if (depositContinuation) {
      const snapSubmissionId = txSnapshotRef.current.submissionId
      if (snapSubmissionId == null || snapSubmissionId <= 0) {
        submitInFlightRef.current = false
        setSubmitUiLocked(false)
        setSubmitIntentActive(false)
        return
      }
      submissionId = snapSubmissionId
      submissionIdRef.current = submissionId
      traceMobileStakingFlow("deposit_continuation_started", {
        submissionId,
        allowanceWei: allowance.toString(),
      })
    } else {
      submissionIdRef.current += 1
      submissionId = submissionIdRef.current
      traceTxMobileSetAttemptContext({
        submissionId,
        scenario: "deposit",
        form: "deposit",
      })
      updateMobileStakingLanContext({
        submissionId,
        flowRunId: String(submissionId),
        allowanceBefore: allowance.toString(),
      })
      traceMobileStakingFlow("stake_flow_started", {
        submissionId,
        needsApproval,
        depositApprovalKind: depositApprovalKindResolved,
        allowanceWei: allowance.toString(),
        amountWei: parsedWei?.toString() ?? null,
      })
      stakingTxLifecycleDev("submissionId_new_attempt", {
        form: "deposit",
        submissionId,
      })
      if (txSnapshotRef.current.terminalReason === "user_rejected") {
        clearPersistedStakingTxUserRejection("deposit_new_attempt_after_rejection")
      }
    }

    const initialFee = previewGasEstimateReady ? feeDisplayLine : ""

    const labelForTx = tokenSymbol || STAKING_STABLECOIN_LABEL

    // Local intent ref - ctaTxPhase state is stale at catch time, this isn't.
    let stage: "approve" | "deposit" | "depositAfterApproval" = "deposit"

    const traceApprovalSuccessDepositNeverStarted = (source: string) => {
      if (submissionId !== submissionIdRef.current) return
      const snap = txSnapshotRef.current
      if (
        snap.approveComplete &&
        !snap.depositTxHash?.trim() &&
        snap.scenario === "deposit"
      ) {
        traceMobileStakingFlow("approval_success_deposit_never_started", {
          submissionId,
          source,
          uiPhase: snap.uiPhase,
        })
      }
    }

    depositFlowRunnerRef.current = () => {
      void (async () => {
        walletFlowStartedRef.current = true
        const snap = txSnapshotRef.current
        const executionTargetExpectation =
          snap.transactionRuntime != null
            ? resolveFrozenExecutionTarget(snap.transactionRuntime)
            : undefined
        const executionOpts = {
          expectedExecutionTarget: executionTargetExpectation,
        }
        const execution = deriveDepositApprovalExecution({
          needsApproval: snap.needsApproval,
          depositApprovalKind: snap.depositApprovalKind,
          approvalMode: snap.approvalMode,
        })
        stage =
          execution !== "skip" ? "approve" : "deposit"

        try {
          if (DEBUG_LOGS) logger.log("[TX FLOW START]")
          traceMobileStakingFlow("allowance_preflight_start", {
            submissionId,
            allowanceWei: allowance.toString(),
          })
          txStatus.beginPreparingTransaction()
          let gasSnap: Awaited<ReturnType<typeof prepareSubmit>> = null
          try {
            gasSnap = await prepareSubmit({
              useCachedIfFresh: launchMode === "direct",
            })
          } finally {
            txStatus.endPreparingTransaction()
          }
          traceMobileStakingFlow("allowance_preflight_result", {
            submissionId,
            needsApproval: execution !== "skip",
            execution,
            allowanceWei: allowance.toString(),
          })
          if (submissionId !== submissionIdRef.current) {
            traceTxMobilePipeline("stale_submission_skip", {
              form: "deposit",
              at: "after_prepare_submit",
              submissionId,
              current: submissionIdRef.current,
            })
            txStatus.setFailed("Transaction interrupted. Please try again.", {
              submissionId,
              source: "stale_submission_after_prepare",
            })
            return
          }

          if (gasSnap?.maxFeeWei != null) {
            txStatus.mergeFeeCanonicalFromPair({
              maxWeiHex: `0x${gasSnap.maxFeeWei.toString(16)}`,
              displayLine: gasSnap.feeDisplayLine,
            })
          }

          if (!txExecutionReadyRef.current) {
            txStatus.setFailed(STAKING_TX_EXECUTION_NOT_READY_MESSAGE, {
              submissionId,
              source: "deposit_runner_not_ready_preflight",
            })
            return
          }

          txStatus.beginAwaitingWalletSignature()

          const liveSnap = txSnapshotRef.current
          let approvalAlreadyDone =
            liveSnap.approveComplete || Boolean(liveSnap.approveTxHash?.trim())
          if (!approvalAlreadyDone && execution !== "skip") {
            approvalAlreadyDone = await tryRecoverApprovalFromOnChain(
              "deposit_runner_preflight"
            )
          }
          if (execution !== "skip" && !approvalAlreadyDone) {
            const dispatchBlockedByAllowance = await tryRecoverApprovalFromOnChain(
              "approval_dispatch_precheck"
            )
            if (dispatchBlockedByAllowance) {
              traceMobileStakingFlow("approval_dispatch_blocked_allowance_sufficient", {
                submissionId,
                source: "approval_dispatch_precheck",
              })
              traceMobileStakingFlow("duplicate_approval_gas_risk", {
                submissionId,
                source: "approval_dispatch_precheck",
              })
              approvalAlreadyDone = true
            }
          }
          if (execution !== "skip" && !approvalAlreadyDone) {
            if (!preSignatureWalletSessionReady()) {
              return
            }
            traceMobileStakingFlow("approval_dispatch_requested", {
              submissionId,
              execution,
              approvalMode: snap.approvalMode,
            })
            const approveRes = await approveStakeAmount(amount.trim(), {
              approvalMode: snap.approvalMode,
              waitForReceipt: false,
              ...executionOpts,
              onSubmitted: hash => {
                if (submissionId !== submissionIdRef.current) return
                txStatus.markApproveBroadcast(hash)
                txStatus.markApproveComplete()
              },
            })
            if (submissionId !== submissionIdRef.current) return
            if (approveRes?.receiptWait) {
              traceMobileStakingFlow("approval_receipt_wait_start", {
                submissionId,
                txHash: approveRes.txHash?.slice(0, 18) ?? null,
              })
              try {
                await approveRes.receiptWait
                traceMobileStakingFlow("approval_receipt_wait_resolved", {
                  submissionId,
                })
                traceMobileStakingFlow("allowance_after_approval_read_start", {
                  submissionId,
                })
                updateMobileStakingLanContext({
                  allowanceAfter: allowance.toString(),
                })
                traceMobileStakingFlow("allowance_after_approval_read_result", {
                  submissionId,
                  allowanceWei: allowance.toString(),
                  note: "form_allowance_may_refresh_async",
                })
              } catch (receiptErr) {
                traceMobileStakingFlow(
                  "approval_receipt_wait_rejected",
                  { submissionId },
                  receiptErr
                )
                const rejectBypass = isStakingWalletUserRejectedError(receiptErr)
                if (!rejectBypass && submissionId !== submissionIdRef.current) return
                if (rejectBypass) {
                  if (
                    await tryRecoverApprovalFromOnChain("approval_receipt_user_reject")
                  ) {
                    txStatus.signalDepositContinuationRetry(
                      "approval_receipt_user_reject_recovered"
                    )
                    traceMobileStakingFlow(
                      "approval_recovered_on_chain_after_wallet_return",
                      {
                        submissionId,
                        source: "approval_receipt_user_reject",
                      }
                    )
                    dismissedPanelDuringWalletRef.current = false
                    return
                  }
                  txStatus.markUserRejected({
                    submissionId,
                    rejectedStage: "approval",
                    source: "approval_receipt_user_reject",
                  })
                  dismissedPanelDuringWalletRef.current = false
                  return
                }
                const sessionExpired = isWalletConnectStaleSessionError(receiptErr)
                const message = sessionExpired
                  ? {
                      title: "Wallet session expired. Reconnect wallet to continue.",
                      description:
                        "Approval request did not reach your wallet session. Reconnect and retry.",
                    }
                  : getStakingTransactionErrorMessage(receiptErr, "approval")
                const errLine = message.description?.trim()
                  ? `${message.title}\n${message.description}`
                  : message.title
                if (await tryRecoverApprovalFromOnChain("approval_receipt_error")) {
                  txStatus.signalDepositContinuationRetry("approval_receipt_error")
                  traceMobileStakingFlow(
                    "approval_recovered_on_chain_after_wallet_return",
                    {
                      submissionId,
                      source: "approval_receipt_error",
                    }
                  )
                } else {
                  txStatus.setFailed(errLine, {
                    submissionId,
                    source: "approval_receipt_error",
                  })
                  if (dismissedPanelDuringWalletRef.current) {
                    const approveKey =
                      txSnapshotRef.current.approveTxHash?.trim() ?? ""
                    stakingToastError(message.title, {
                      description: message.description ?? undefined,
                      dedupeId: createStakingToastDedupeKey(
                        "tx_form",
                        "approval_receipt_err",
                        "deposit",
                        approveKey.length > 0
                          ? approveKey.toLowerCase()
                          : stakingToastDedupeFingerprint(
                              `${submissionId}:approval:${message.title}`
                            )
                      ),
                    })
                  }
                  dismissedPanelDuringWalletRef.current = false
                  return
                }
              }
            }
            if (submissionId !== submissionIdRef.current) return
            stage = "depositAfterApproval"
          } else if (execution !== "skip" && approvalAlreadyDone) {
            traceMobileStakingFlow("approval_dispatch_blocked_allowance_sufficient", {
              submissionId,
              source: "approval_already_done",
            })
            if (!liveSnap.approveComplete) {
              txStatus.markApproveComplete()
            }
            stage = "depositAfterApproval"
          }

          if (!txExecutionReadyRef.current) {
            traceApprovalSuccessDepositNeverStarted("deposit_not_ready_after_approval")
            txStatus.setFailed(STAKING_TX_EXECUTION_NOT_READY_MESSAGE, {
              submissionId,
              source: "deposit_runner_not_ready_post_approval",
            })
            return
          }
          if (!preSignatureWalletSessionReady()) {
            traceApprovalSuccessDepositNeverStarted("wallet_session_not_ready_post_approval")
            return
          }
          traceMobileStakingFlow("stake_dispatch_requested", {
            submissionId,
            stage,
          })
          await deposit(amount.trim(), {
            waitForReceipt: false,
            ...executionOpts,
            onSubmitted: (hash, receiptWait) => {
              if (submissionId !== submissionIdRef.current) return
              stakingSentryBreadcrumb("tx_submitted", {
                scenario: "deposit",
                has_receipt_wait: Boolean(receiptWait),
              })
              txStatus.publishTxBroadcast({ step: "deposit", hash })
              if (!receiptWait) return
              const successFeeLine =
                gasSnap?.feeDisplayLine?.trim() && gasSnap.feeDisplayLine.trim() !== ""
                  ? gasSnap.feeDisplayLine
                  : feeDisplayLine.trim() !== ""
                    ? feeDisplayLine
                    : ""
              txStatus.registerReceiptCompletion({
                receiptWait,
                scenario: "deposit",
                amountLabel: `${trimmedAmount} ${labelForTx}`,
                feeLine: successFeeLine,
                feeMaxWeiHex:
                  gasSnap?.maxFeeWei != null
                    ? `0x${gasSnap.maxFeeWei.toString(16)}`
                    : null,
                txHash: hash,
                errorStage:
                  stage === "depositAfterApproval"
                    ? "depositAfterApproval"
                    : "deposit",
              })
            },
          })
          if (submissionId !== submissionIdRef.current) return

          dismissedPanelDuringWalletRef.current = false

          setSubmitIntentActive(false)
          setSuccessLockActive(true)
          if (successTimerRef.current) clearTimeout(successTimerRef.current)
          successTimerRef.current = window.setTimeout(() => {
            if (mountedRef.current) {
              clearSuccessCelebration()
            }
          }, 2000)
        } catch (error) {
          setSubmitIntentActive(false)
          const fallbackStage: StakingTransactionStage =
            stage === "depositAfterApproval"
              ? "depositAfterApproval"
              : stage === "approve"
                ? "approval"
                : "deposit"
          const rejectBypass = isStakingWalletUserRejectedError(error)
          if (!rejectBypass && submissionId !== submissionIdRef.current) return
          if (rejectBypass) {
            if (
              fallbackStage === "approval" &&
              (await tryRecoverApprovalFromOnChain("approval_user_reject"))
            ) {
              txStatus.signalDepositContinuationRetry("approval_user_reject_recovered")
              traceMobileStakingFlow("approval_recovered_on_chain_after_wallet_return", {
                submissionId,
                source: "approval_user_reject",
              })
              dismissedPanelDuringWalletRef.current = false
              return
            }
            if (fallbackStage === "depositAfterApproval") {
              traceMobileStakingFlow("stake_wallet_send_rejected", {
                submissionId,
                ...classifyStakeWalletError(error),
              })
              txStatus.markPostApprovalStakeWalletTerminal({
                submissionId,
                kind: "user_rejected",
                source: "deposit_flow_user_reject",
                flowRunId: String(submissionId),
                error,
              })
              dismissedPanelDuringWalletRef.current = false
              return
            }
            txStatus.markUserRejected({
              submissionId,
              rejectedStage: fallbackStage,
              source: "deposit_flow_user_reject",
            })
            dismissedPanelDuringWalletRef.current = false
            return
          }
          if (
            fallbackStage === "depositAfterApproval" &&
            isStakingInsufficientGasError(error)
          ) {
            traceMobileStakingFlow("stake_wallet_send_rejected", {
              submissionId,
              ...classifyStakeWalletError(error),
            })
            txStatus.markPostApprovalStakeWalletTerminal({
              submissionId,
              kind: "insufficient_gas",
              source: "deposit_flow_insufficient_gas",
              flowRunId: String(submissionId),
              error,
            })
            dismissedPanelDuringWalletRef.current = false
            return
          }
          const sessionExpired = isWalletConnectStaleSessionError(error)
          const dispatchUnreachable = isWalletConnectTxDispatchUnreachableError(error)
          const message = sessionExpired
            ? {
                title: "Wallet session expired. Reconnect wallet to continue.",
                description:
                  "Your wallet session appears disconnected. Reconnect and continue this deposit.",
              }
            : dispatchUnreachable
              ? {
                  title: "Wallet did not receive the signing request",
                  description:
                    "The transaction was submitted from the app but did not reach Trust Wallet. Reconnect your wallet in Safari and retry.",
                }
              : getStakingTransactionErrorMessage(error, fallbackStage)
          const errLine = message.description?.trim()
            ? `${message.title}\n${message.description}`
            : message.title
          if (fallbackStage === "approval") {
            const recovered = await tryRecoverApprovalFromOnChain("deposit_flow_catch")
            if (recovered) {
              txStatus.signalDepositContinuationRetry("deposit_flow_catch")
              traceMobileStakingFlow("approval_recovered_on_chain_after_wallet_return", {
                submissionId,
                source: "deposit_flow_catch",
              })
              dismissedPanelDuringWalletRef.current = false
              return
            }
            if (
              dispatchUnreachable &&
              isMobileWalletUserAgent() &&
              wasMobileWalletReturnWithinMs(20_000)
            ) {
              traceMobileStakingFlow("approval_dispatch_unreachable_deferred_after_return", {
                submissionId,
              })
              txStatus.signalDepositContinuationRetry(
                "dispatch_unreachable_after_return",
                { depositOnly: false }
              )
              dismissedPanelDuringWalletRef.current = false
              return
            }
          }
          if (fallbackStage === "depositAfterApproval") {
            traceMobileStakingFlow("stake_wallet_send_rejected", {
              submissionId,
              ...classifyStakeWalletError(error),
            })
            if (
              dispatchUnreachable &&
              isMobileWalletUserAgent() &&
              wasMobileWalletReturnWithinMs(20_000)
            ) {
              txStatus.signalDepositContinuationRetry(
                "stake_dispatch_unreachable_after_return",
                { depositOnly: true }
              )
              dismissedPanelDuringWalletRef.current = false
              return
            }
          }
          stakingTxLifecycleDev("catch_setFailed", {
            form: "deposit",
            isWalletReject: false,
            submissionId,
            currentSubmissionId: submissionIdRef.current,
          })
          txStatus.setFailed(errLine, {
            submissionId,
            source: "deposit_flow_catch",
          })
          if (dismissedPanelDuringWalletRef.current) {
            stakingToastError(message.title, {
              description: message.description ?? undefined,
              dedupeId: createStakingToastDedupeKey(
                "tx_form",
                "flow_catch_err",
                "deposit",
                submissionId,
                stakingToastDedupeFingerprint(message.title)
              ),
            })
          }
          dismissedPanelDuringWalletRef.current = false
        } finally {
          walletFlowStartedRef.current = false
          submitInFlightRef.current = false
          depositFlowRunnerStartedRef.current = false
          setSubmitUiLocked(false)
          endSubmitPhase()
        }
      })()
    }

    setIsFlowArmed(true)
    const approvalModeForFlow =
      launchMode === "direct" && txStatus.snapshot.scenario === "deposit"
        ? txStatus.snapshot.approvalMode
        : depositApprovalChainMode
    const txOpenInput = {
      scenario: "deposit" as const,
      needsApproval,
      depositApprovalKind: needsApproval ? depositApprovalKindResolved : null,
      approvalMode: approvalModeForFlow,
      amountLabel: `${trimmedAmount} ${labelForTx}`,
      feeLine: initialFee,
      previewGasEstimateReady,
      feeCanonicalMaxWeiHex: previewGasEstimateReady
        ? previewFeeCanonicalMaxWeiHex
        : null,
      submissionId,
    }
    if (launchMode === "direct") {
      if (depositContinuation) {
        txStatus.resumeDepositAfterRecoveredApproval()
      } else {
        txStatus.openAwaitingSignature(txOpenInput)
      }
      startStakingFormFlowRunnerDirect({
        form: "deposit",
        launch: "direct_sync",
        flowRunnerStarted: depositFlowRunnerStartedRef,
        flowRunner: depositFlowRunnerRef,
        setIsFlowArmed,
        manualDispatch: true,
      })
      return
    }
    txStatus.openPreview(txOpenInput)
  }

  handleApproveAndDepositRef.current = handleApproveAndDeposit

  useLayoutEffect(() => {
    const req = txStatus.retryRequest
    if (req.scenario !== "deposit") return
    if (req.nonce <= 0 || req.nonce === lastHandledRetryNonceRef.current) {
      traceTxMobilePipeline("retry_blocked_nonce_deduped", {
        form: "deposit",
        nonce: req.nonce,
      })
      traceMobileStakingFlow("retry_blocked_due_to_pending_chain_check", {
        form: "deposit",
        nonce: req.nonce,
      })
      return
    }
    lastHandledRetryNonceRef.current = req.nonce
    releaseFormExecutionOwnershipForRetry(
      "deposit",
      {
        submitInFlight: submitInFlightRef,
        flowRunnerStarted: depositFlowRunnerStartedRef,
        flowRunner: depositFlowRunnerRef,
        walletFlowStarted: walletFlowStartedRef,
      },
      {
        setIsFlowArmed,
        setSubmitUiLocked,
        setSubmitIntentActive,
        endSubmitPhase,
      },
    )
    if (!txExecutionReady) {
      traceTxMobilePipeline("retry_blocked_not_ready", { form: "deposit" })
      txStatus.setFailed(STAKING_TX_EXECUTION_NOT_READY_MESSAGE, {
        submissionId: submissionIdRef.current > 0 ? submissionIdRef.current : undefined,
        source: "deposit_retry_not_ready",
      })
      return
    }
    traceTxMobilePipeline("retry_execution_armed", {
      form: "deposit",
      nonce: req.nonce,
    })
    traceMobileStakingFlow("retry_allowed", {
      form: "deposit",
      nonce: req.nonce,
      depositOnly: req.depositOnly === true,
    })
    void handleApproveAndDepositRef.current(
      "direct",
      req.depositOnly ? { depositContinuation: true } : undefined
    )
  }, [
    txStatus.retryRequest,
    txExecutionReady,
    txStatus,
    endSubmitPhase,
    setIsFlowArmed,
    setSubmitUiLocked,
    setSubmitIntentActive,
  ])

  const handleConnect = () => {
    traceTxMobilePipeline("appkit_open_wallet_request", {
      form: "deposit",
      source: "handleConnect",
    })
    traceMobileStakingFlow("manual_reconnect_detected", {
      form: "deposit",
      source: "handleConnect",
    })
    void openWallet()
  }
  const handleSwitchNetwork = () => {
    void requestNetworkSwitch()
  }

  const onPrimaryClick = () => {
    if (DEBUG_LOGS) {
      logger.log("[CLICK RECEIVED]", {
        actionType: cta.actionType,
        primaryDisabled,
      })
    }
    switch (cta.actionType) {
      case "connect":
        handleConnect()
        return
      case "switch":
        handleSwitchNetwork()
        return
      case "submit":
        if (DEBUG_LOGS) logger.log("[SUBMIT DISPATCHED]")
        if (submitUiLocked || submitInFlightRef.current) return
        traceTxMobilePipeline("cta_press", {
          form: "deposit",
          launchMode: "preview",
        })
        void handleApproveAndDeposit("preview")
        return
      case "noop":
        return
    }
  }

  const onPrimaryPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (cta.actionType !== "submit") return
    const inFlight = submitInFlightRef.current
    if (inFlight) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (clickCooldownTimerRef.current != null) {
      clearTimeout(clickCooldownTimerRef.current)
      clickCooldownTimerRef.current = null
    }
    setClickCooldown(true)
    clickCooldownTimerRef.current = setTimeout(() => {
      clickCooldownTimerRef.current = null
      setClickCooldown(false)
    }, 300)
  }

  const updateAmountFromSlider = (percentage: number) => {
    if (tokenDecimals === null || maxStakeWei <= 0n) {
      setAmount("")
      return
    }
    const p = Math.max(0, Math.min(100, percentage))
    if (p === 0) {
      setAmount("")
      return
    }
    const wei = (maxStakeWei * BigInt(Math.round(p * 1_000_000))) / 100_000_000n
    if (wei === 0n) {
      setAmount("")
      return
    }
    setAmount(removeTrailingZeros(formatUnits(wei, tokenDecimals)))
  }

  const updateSliderFromInput = (newAmount: string) => {
    const parsed = tryParseAmountWei(
      normalizeDecimalAmountInput(newAmount),
      tokenDecimals
    )
    if (parsed === null || maxStakeWei <= 0n) {
      setSliderValue([0])
      return
    }
    const capped = parsed > maxStakeWei ? maxStakeWei : parsed
    const bps = (capped * 10000n) / maxStakeWei
    const sliderPercentage = Number(bps) / 100
    setSliderValue([Math.max(0, Math.min(100, sliderPercentage))])
  }

  function handleMaxClick() {
    if (tokenDecimals === null) return
    const s =
      removeTrailingZeros(formatUnits(walletBalance, tokenDecimals)) || "0"
    setAmount(s)
    updateSliderFromInput(s)
    sliderDraggingRef.current = false
    setSliderActive(false)
    setGasStableWei(walletBalance)
    flushEstimate()
  }

  const label = tokenSymbol || STAKING_STABLECOIN_LABEL
  const receiveSymbol = useMemo(() => vaultMerchantShareSymbol(label), [label])
  const displayReceiveSymbol = useMemo(
    () => publicTokenSymbolLabel(receiveSymbol),
    [receiveSymbol]
  )
  const formFieldsLoadingLocked =
    !vaultDataReady ||
    (applyEvmNetworkAndGasCtaBlocks && (!executionConnected || isWrongNetwork)) ||
    (isPassiveTronRuntime && (!runtimeWallet.hasAccount || isWrongNetwork))
  const formFieldsDisabled = formFieldsLoadingLocked
  const formInputsReadOnly =
    isPassiveTronRuntime && vaultDataReady && !formFieldsLoadingLocked
  const assetSelectDisabled = isPassiveTronRuntime ? false : formFieldsDisabled
  const amountSliderDisabled = formFieldsDisabled || formInputsReadOnly
  const showAmountMaxButton =
    executionConnected && vaultDataReady && !isWrongNetwork && canTransact

  const passiveTronDataLoading =
    isPassiveTronRuntime && (!vaultDataReady || loading || ctaRuntimeTransitionSettling)
  const showPrimarySpinner =
    passiveTronDataLoading ||
    (!isPassiveTronRuntime &&
      (submitUiLocked ||
        primaryAriaBusy ||
        (cta.actionType === "noop" &&
          (loading || awaitingSigner) &&
          ctaTxPhase === "idle" &&
          !successLockActive)))

  const isSubmittingUi =
    ctaTxPhase !== "idle" || submitUiLocked || successLockActive

  /** Invalid parse or explicit zero amount — red border only, no reason line. */
  const inputOnlyInvalid =
    hasInvalidAmount ||
    (trimmedAmount !== "" && parsedWei !== null && parsedWei === 0n)

  const gasShortfall = Boolean(
    gasAmountValidForFee &&
      gasUiActive &&
      (nearZeroEth || (estimateSuccess && insufficientNative))
  )

  const zeroGasFeeFullLine = useMemo(
    () => stakingGasFeeZeroDisplayLine(ethUsdPresentation),
    [ethUsdPresentation]
  )

  /** Full fee line for the row; left label is `feeTitle` - right column strips ": ". */
  const depositGasFeeDisplayLine = useMemo(() => {
    if (trimmedAmount === "") {
      return zeroGasFeeFullLine
    }
    if (gasAmountValidForFee && feeDisplayLine.trim() !== "") {
      return feeDisplayLine
    }
    return zeroGasFeeFullLine
  }, [trimmedAmount, gasAmountValidForFee, feeDisplayLine, zeroGasFeeFullLine])

  const feeMuted = Boolean(
    gasAmountValidForFee &&
      !gasShortfall &&
      (isEstimating || isRevalidating)
  )

  const feeValueLoading = Boolean(
    gasAmountValidForFee &&
      !gasShortfall &&
      !isSubmittingUi &&
      (!hasEstimate ||
        (isEstimating &&
          !(showSplitGasFeeRows && hasUsableApprovalFlowEstimate)) ||
        (showSplitGasFeeRows &&
          estimateSuccess &&
          gasSecondStepMaxFeeWei === null &&
          !depositSecondPreviewUnavailable &&
          !hasUsableApprovalFlowEstimate))
  )

  /** DEV: preview vs split-step fee state (gated by DEBUG_LOGS). */
  const devDepositFeeRegressionRef = useRef("")
  useEffect(() => {
    if (!DEBUG_LOGS) return
    const row = {
      previewGasEstimateReady,
      depositFeeReady,
      hasUsableDepositGasEstimate,
      hasUsableApprovalFlowEstimate,
      showSplitGasFeeRows,
      gasFirstStepMaxFeeWei:
        gasFirstStepMaxFeeWei === null ? null : gasFirstStepMaxFeeWei.toString(),
      gasSecondStepMaxFeeWei:
        gasSecondStepMaxFeeWei === null ? null : gasSecondStepMaxFeeWei.toString(),
      feeValueLoading,
    }
    const fp = JSON.stringify(row)
    if (fp === devDepositFeeRegressionRef.current) return
    devDepositFeeRegressionRef.current = fp
    logger.log("[DEV DEPOSIT FEE REGRESSION]", row)
  }, [
    previewGasEstimateReady,
    depositFeeReady,
    hasUsableDepositGasEstimate,
    hasUsableApprovalFlowEstimate,
    showSplitGasFeeRows,
    gasFirstStepMaxFeeWei,
    gasSecondStepMaxFeeWei,
    feeValueLoading,
  ])

  const amountMessagingEligible = Boolean(
    gasAmountValidForFee && !sliderActive && !isSubmittingUi
  )

  const feeHint = useMemo(() => {
    if (!amountMessagingEligible || gasShortfall) {
      return { text: null, tone: "neutral" as const }
    }
    return deriveStakingFeeHint({
      hasEstimate,
      estimateSuccess,
      isEstimating,
      isRevalidating,
      gasUiActive,
      gasAmountValid: gasAmountValidForFee,
      nearZeroEth,
      insufficientNative,
      feeSpikeWarning,
      highCongestionWarning,
    })
  }, [
    amountMessagingEligible,
    gasShortfall,
    hasEstimate,
    estimateSuccess,
    isEstimating,
    isRevalidating,
    gasUiActive,
    gasAmountValidForFee,
    nearZeroEth,
    insufficientNative,
    feeSpikeWarning,
    highCongestionWarning,
  ])

  const feeHintRow = useMemo(() => {
    if (depositSecondPreviewUnavailable && gasAmountValidForFee && !gasShortfall) {
      return { text: "Partial fee estimate", tone: "amber" as const }
    }
    return feeHint
  }, [
    depositSecondPreviewUnavailable,
    gasAmountValidForFee,
    gasShortfall,
    feeHint,
  ])

  const depositSummaryFeeRight = useMemo(
    () => networkFeeRowRightDisplayValue(depositGasFeeDisplayLine).trim(),
    [depositGasFeeDisplayLine]
  )

  const depositSummaryReceive = useMemo(() => {
    if (exceedsBalance || tokenDecimals === null) {
      return null
    }
    if (trimmedAmount === "" || parsedWei === null || parsedWei === 0n) {
      return `~0 ${displayReceiveSymbol}`
    }
    const n = removeTrailingZeros(formatUnits(parsedWei, tokenDecimals))
    return `~${n} ${displayReceiveSymbol}`
  }, [trimmedAmount, parsedWei, exceedsBalance, tokenDecimals, displayReceiveSymbol])

  const depositSummaryYieldLine = useMemo(() => {
    const apy = profitStatus.apy_percentage
    if (!Number.isFinite(apy) || apy < 0) return null
    const amt = parseFloat(trimmedAmount.replace(/,/g, ""))
    if (
      trimmedAmount === "" ||
      !Number.isFinite(amt) ||
      amt <= 0 ||
      exceedsBalance ||
      parsedWei === null ||
      parsedWei === 0n ||
      tokenDecimals === null
    ) {
      return `+0 ${displayReceiveSymbol} / Year`
    }
    const annual = amt * (apy / 100)
    const annualStr =
      annual >= 100 ? annual.toFixed(0) : annual >= 10 ? annual.toFixed(1) : annual.toFixed(2)
    return `+${annualStr} ${displayReceiveSymbol} / Year`
  }, [
    trimmedAmount,
    parsedWei,
    exceedsBalance,
    tokenDecimals,
    profitStatus.apy_percentage,
    displayReceiveSymbol,
  ])

  const depositFeeHintTitle = useMemo(() => {
    const t = feeHintRow.text?.trim()
    return t || undefined
  }, [feeHintRow.text])

  const primaryTitle = useMemo(() => {
    if (!primaryDisabled) return undefined
    const t = inlinePresentation.lineText.trim()
    if (t !== "") return t
    if (
      inlineCtaReason &&
      !STAKING_DEPOSIT_CTA_REASON_UI_SUPPRESSED.has(inlineCtaReason.message)
    ) {
      return inlineCtaReason.hint
        ? `${inlineCtaReason.message} — ${inlineCtaReason.hint}`
        : inlineCtaReason.message
    }
    return undefined
  }, [primaryDisabled, inlinePresentation.lineText, inlineCtaReason])

  const stakingMetaShowDisconnectedDash =
    applyEvmNetworkAndGasCtaBlocks && !executionConnected

  return (
    <StakingFormLayout
      body={
        <div className={STAKING_FORM_SLOT_BODY_CLASS}>
      <StakingFormSlotAsset>
      <StakingDepositAssetSelect
        disabled={assetSelectDisabled}
        label={label}
        poolNetworkLabel={activeRuntimeSelection.deployment.labels.network}
      />
      </StakingFormSlotAsset>
      <StakingFormSlotMeta>
        <StakingFormBalanceMetaRow
          prefix='Assets:'
          applyGasColumn={applyEvmNetworkAndGasCtaBlocks}
          showDisconnectedDash={stakingMetaShowDisconnectedDash}
          tokenSkeleton={formNumericLoading}
          tokenAmountClassName={
            stakingAssetBalanceNumericIsZero ? "text-destructive" : undefined
          }
          tokenAmount={displayAvailableToStake}
          tokenSymbol={label}
          nativeAmountClassName={cn(
            nativeGasBalanceIsZero && "text-destructive",
            !nativeGasBalanceIsZero &&
              nativeGasBalanceWarn &&
              "text-amber-600 dark:text-amber-500"
          )}
          nativeAmount={displayNativeGasAmount}
          nativeSymbol={STAKING_APPKIT_NETWORK.nativeCurrency.symbol}
        />
      </StakingFormSlotMeta>
      <StakingFormSlotAmount>
        <div className='space-y-1'>
          <div
            className={cn(
              STAKING_AMOUNT_FIELD_SHELL,
              "relative",
              formInputsReadOnly && STAKING_INPUT_VIEW_ONLY,
              !formInputsReadOnly &&
                applyEvmNetworkAndGasCtaBlocks &&
                executionConnected &&
                (exceedsBalance || inputOnlyInvalid) &&
                STAKING_INPUT_ERROR,
              !formInputsReadOnly &&
                amountFocusHighlight &&
                "staking-amount-attention border-[#2563EB]/45"
            )}
          >
            <Input
              ref={amountInputRef}
              id='staking-deposit-amount'
              type='text'
              inputMode='decimal'
              enterKeyHint='done'
              autoComplete='off'
              autoCorrect='off'
              spellCheck={false}
              placeholder='Enter an amount'
              value={amount}
              disabled={formFieldsDisabled}
              readOnly={formInputsReadOnly}
              aria-invalid={
                applyEvmNetworkAndGasCtaBlocks &&
                executionConnected &&
                (exceedsBalance || inputOnlyInvalid)
              }
              onPointerDown={() => setAmountFocusHighlight(false)}
              onKeyDown={e => {
                if (e.key === "-") e.preventDefault()
              }}
              onBlur={() => {
                sliderDraggingRef.current = false
                setSliderActive(false)
                if (parsedWei !== null) setGasStableWei(parsedWei)
                // Do not flushEstimate here: bumpGeneration aborts in-flight two-step gas
                // while setGasStableWei already retriggers the main estimate effect via deps.
              }}
              onChange={e => {
                const nextAmount = filterStakingDecimalInput(
                  e.target.value,
                  tokenDecimals
                )
                if (isNegativeAmountInput(nextAmount)) return

                setAmount(nextAmount)
                updateSliderFromInput(nextAmount)
              }}
              className={cn(
                STAKING_AMOUNT_FIELD_INPUT,
                showAmountMaxButton && "pe-14"
              )}
            />
            {showAmountMaxButton ? (
              <button
                type='button'
                className='absolute top-1/2 right-3 z-10 -translate-y-1/2 shrink-0 cursor-pointer text-xs font-semibold tracking-tight text-muted-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground hover:decoration-foreground/40 disabled:pointer-events-none disabled:opacity-40'
                disabled={formFieldsDisabled}
                onClick={handleMaxClick}
              >
                Max
              </button>
            ) : null}
          </div>
        </div>
      </StakingFormSlotAmount>
      <StakingFormSlotSlider
        aria-label='Amount as percentage of balance'
        onPointerDownCapture={() => {
          sliderDraggingRef.current = true
          setSliderActive(true)
        }}
        onPointerUpCapture={() => {
          sliderDraggingRef.current = false
          setSliderActive(false)
          if (parsedWei !== null) setGasStableWei(parsedWei)
        }}
      >
        <StakingFormSlotSliderInner>
          <Slider
            value={sliderValue}
            disabled={amountSliderDisabled}
            onValueChange={(newValues: number[]) => {
              const pct = newValues[0] ?? 0
              setSliderValue(newValues)
              updateAmountFromSlider(pct)
            }}
            min={0}
            max={100}
            step={0.1}
            className={STAKING_AMOUNT_SLIDER_ROOT_CLASSNAME}
            trackClassName={STAKING_AMOUNT_SLIDER_TRACK_CLASSNAME}
            rangeClassName={STAKING_AMOUNT_SLIDER_RANGE_CLASSNAME}
            thumbClassName={STAKING_AMOUNT_SLIDER_THUMB_CLASSNAME}
          />
          <div className={STAKING_FORM_SLIDER_LABEL_ROW_CLASS}>
            <span>Min</span>
            <span>Max</span>
          </div>
        </StakingFormSlotSliderInner>
      </StakingFormSlotSlider>
      <section
        className='flex w-full min-w-0 shrink-0 flex-col'
        aria-label='Deposit fee, receive, estimated rewards, and status'
      >
        <StakingFormSlotFeeRows>
          <StakingFormActionSummaryDeposit
            feeRightDisplay={depositSummaryFeeRight}
            feeLoading={feeValueLoading}
            feeMuted={Boolean(feeMuted || isSubmittingUi)}
            gasShortfall={gasShortfall}
            feeHintTitle={depositFeeHintTitle}
            showNetworkFeeRow={applyEvmNetworkAndGasCtaBlocks}
            receiveDisplay={depositSummaryReceive}
            receiveLoading={Boolean(feeValueLoading && gasAmountValidForFee)}
            yieldLine={depositSummaryYieldLine}
            yieldLoading={Boolean(feeValueLoading && gasAmountValidForFee)}
          />
          <StakingCtaReason
            id='staking-deposit-cta-reason'
            reason={inlinePresentation.lineReason}
            animateEllipsis={
              animateReasonEllipsis && inlinePresentation.shouldShowLine
            }
          />
        </StakingFormSlotFeeRows>
      </section>
        </div>
      }
      footer={
        <GlowingButton
          className={cn(
            "w-full rounded-full transition-opacity duration-200",
            clickCooldown && cta.actionType === "submit" && "opacity-85"
          )}
          buttonClassName={
            isPassiveTronRuntime
              ? STAKING_PASSIVE_PRIMARY_CTA_BUTTON_CLASS
              : STAKING_PRIMARY_CTA_BUTTON_CLASS
          }
          persistentGlow={
            !isPassiveTronRuntime &&
            !primaryDisabled &&
            cta.actionType === "submit"
          }
          size='lg'
          type='button'
          disabled={primaryDisabled}
          title={primaryTitle}
          aria-label={
            animatePrimaryEllipsis && !showPrimarySpinner
              ? primaryLabel
              : undefined
          }
          aria-busy={primaryAriaBusy || showPrimarySpinner}
          aria-describedby={
            primaryDisabled && inlinePresentation.shouldShowLine
              ? "staking-deposit-cta-reason"
              : undefined
          }
          onPointerDown={onPrimaryPointerDown}
          onClick={onPrimaryClick}
        >
          <span
            className='relative flex min-h-[22px] w-full items-center justify-center'
            aria-hidden={
              animatePrimaryEllipsis && !showPrimarySpinner ? true : undefined
            }
          >
            <span
              className={cn(showPrimarySpinner && "invisible")}
              aria-hidden={showPrimarySpinner || undefined}
            >
              <StakingCtaEllipsisLabel
                text={primaryLabel}
                animate={animatePrimaryEllipsis && !showPrimarySpinner}
                className='inline-flex max-w-full justify-center text-center text-sm font-semibold leading-tight tracking-tight'
              />
            </span>
            {showPrimarySpinner ? (
              <Loader2
                className='pointer-events-none absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-white'
                aria-hidden
              />
            ) : null}
          </span>
        </GlowingButton>
      }
    />
  )
}

export default StakingAppDepositForm
