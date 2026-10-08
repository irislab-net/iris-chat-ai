import { useTransactionStatus } from "@/components/pages/staking/TransactionStatusContext"
import type { TransactionStatusSnapshot } from "@/components/pages/staking/transactionStatusModel"
import { StakingFormLayout } from "@/components/pages/staking/StakingFormLayout"
import {
  StakingFormBalanceMetaConstraintsRow,
  StakingFormBalanceMetaRow,
} from "@/components/pages/staking/StakingFormBalanceMetaRow"
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
import { StakingFormActionSummaryWithdraw } from "@/components/pages/staking/StakingFormActionSummary"
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
import GlowingButton from "@/components/common/glowingButton"
import { StakingWithdrawAssetSelect } from "@/components/pages/staking/StakingAssetSelectSubtree"
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
  STAKING_VAULT_ADDRESS,
} from "@/constants/stakingVaultConfig"
import {
  getStakingTransactionErrorMessage,
  isStakingWalletUserRejectedError,
} from "@/lib/stakingTransactionMessages"
import { stakingSentryBreadcrumb } from "@/lib/stakingSentryObservability"
import { deriveStakingCtaTxPhaseFromSnapshot } from "@/staking/cta"
import { resolveStakingFormInlinePresentation } from "@/staking/cta"
import { stakingTxIntegrityDev } from "@/staking/diagnostics"
import {
  stakingTxLifecycleDev,
  traceTxMobilePipeline,
  traceTxMobileSetAttemptContext,
} from "@/staking/diagnostics"
import { abandonStakingVaultTxExecutionLoading } from "@/staking/tx/execution/stakingVaultTxExecutionOwnershipBridge"
import { tryRecoverWithdrawTxHashFromOnChain } from "@/staking/tx/stakingWithdrawRecoveryFromSnapshot"
import {
  traceMobileStakingFlow,
  wasMobileWalletReturnWithinMs,
} from "@/staking/diagnostics/mobileStakingLanLog"
import { releaseFormExecutionOwnershipForRetry } from "@/staking/tx/retryFormExecutionArm"
import {
  startStakingFormFlowRunnerDirect,
  tryStartStakingFormFlowRunnerFromLayout,
} from "@/staking/tx/stakingFormFlowRunnerStart"
import { STAKING_TX_EXECUTION_NOT_READY_MESSAGE } from "@/staking/tx/stakingTxExecutionReadiness"
import { snapshotAllowsAutoDispatch, clearPersistedStakingTxUserRejection } from "@/staking/tx"
import {
  filterStakingDecimalInput,
  normalizeDecimalAmountInput,
  tryParseAmountWei,
} from "@/lib/stakingAmountInput"
import { stakingGasFeeZeroDisplayLine } from "@/staking/execution"
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
import {
  normalizeStakingTokenSymbol,
  vaultMerchantShareSymbol,
} from "@/lib/stakingTokenVisuals"
import { publicTokenSymbolLabel } from "@/lib/publicTokenDisplay"
import { DEBUG_LOGS } from "@/staking/config"
import { STAKING_WITHDRAW_CTA_REASON_UI_SUPPRESSED } from "@/constants/stakingCtaMessages"
import { logger } from "@/lib/logger"
import { cn, removeTrailingZeros } from "@/lib/utils"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useStakingCtaState } from "@/hooks/useStakingCtaState"
import { useStakingFeeDisplaySmoothing } from "@/hooks/useStakingFeeDisplaySmoothing"
import { useWithdrawalProtocolFee } from "@/hooks/useWithdrawalProtocolFee"
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

function isNegativeAmountInput(value: string) {
  return value.trim().startsWith("-")
}

const ZERO_AMOUNT_DISPLAY = "0.000000"

type StakingWithdrawFormNetworkDraft = Readonly<{
  amount: string
  slider: number[]
}>

/** Map slider t ∈ [0,1] linearly from `lo` to `hi` (inclusive), using bigint ratio. */
function lerpBigInt(lo: bigint, hi: bigint, t: number): bigint {
  if (hi <= lo) return hi
  const x = Math.max(0, Math.min(1, t))
  const delta = hi - lo
  const millionths = Math.round(x * 1_000_000)
  return lo + (delta * BigInt(millionths)) / 1_000_000n
}

function StakingAppWithdrawForm() {
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
    tokenSymbol,
    tokenDecimals,
    stakedAssets,
    maxUnstakeWei,
    minWithdrawalFeeWei,
    formattedMinWithdrawalFee,
    withdraw,
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

  const safeMaxUnstakeWei = maxUnstakeWei ?? 0n

  const formattedMaxUnstake = useMemo(() => {
    if (tokenDecimals === null) return ZERO_AMOUNT_DISPLAY
    try {
      return removeTrailingZeros(formatUnits(safeMaxUnstakeWei, tokenDecimals))
    } catch {
      return ZERO_AMOUNT_DISPLAY
    }
  }, [safeMaxUnstakeWei, tokenDecimals])

  /** Smallest wei amount that passes `belowMinWithdrawal` (strictly above fee when fee > 0). */
  const minAmountWei = useMemo(() => {
    if (minWithdrawalFeeWei > 0n) return minWithdrawalFeeWei + 1n
    return 0n
  }, [minWithdrawalFeeWei])

  const label = tokenSymbol || STAKING_STABLECOIN_LABEL

  /** Vault `withdrawalFee` / merchant UX: MUSDC when on-chain symbol is USDC. */
  const vaultWithdrawalFeeSymbol = useMemo(() => {
    if (!tokenSymbol.trim()) return STAKING_STABLECOIN_LABEL
    return vaultMerchantShareSymbol(tokenSymbol)
  }, [tokenSymbol])

  const withdrawConstraintsHint = useMemo(() => {
    if (!executionConnected) return null
    const maxHint =
      maxUnstakeWei < stakedAssets
        ? {
            prefix: "Max now:",
            tokenAmount: removeTrailingZeros(formattedMaxUnstake),
            tokenSymbol: label,
          }
        : null
    const minHint =
      minWithdrawalFeeWei > 0n
        ? {
            prefix: "Min:",
            tokenAmount: removeTrailingZeros(formattedMinWithdrawalFee),
            tokenSymbol: label,
          }
        : null
    if (!maxHint && !minHint) return null
    const title =
      maxHint && minHint
        ? "You can withdraw up to the shown max right now. Each withdrawal must be at least the minimum (fees included)."
        : maxHint
          ? "Right now you can withdraw up to this amount; it may be less than your full stake."
          : "Enter an amount above this minimum (fees included), or the transaction will not go through."
    return { maxHint, minHint, title }
  }, [
    executionConnected,
    maxUnstakeWei,
    stakedAssets,
    minWithdrawalFeeWei,
    formattedMaxUnstake,
    formattedMinWithdrawalFee,
    label,
  ])

  const withdrawAmountMeta = useMemo(() => {
    if (!executionConnected) {
      return {
        kind: "constraints" as const,
        maxHint: {
          prefix: "Max now:",
          tokenAmount: "—",
          tokenSymbol: label,
        },
        minHint:
          minWithdrawalFeeWei > 0n
            ? {
                prefix: "Min:",
                tokenAmount: "—",
                tokenSymbol: label,
              }
            : null,
        title:
          "Connect your wallet to see your withdrawable balance and any min/max limits.",
      }
    }
    if (withdrawConstraintsHint) return { kind: "constraints" as const, ...withdrawConstraintsHint }
    return {
      kind: "withdrawableOnly" as const,
      line: `${formattedMaxUnstake} ${label}`,
    }
  }, [
    executionConnected,
    withdrawConstraintsHint,
    formattedMaxUnstake,
    label,
    minWithdrawalFeeWei,
  ])

  const [amount, setAmount] = useState("")
  const [sliderValue, setSliderValue] = useState([0])
  const withdrawDraftByDeploymentRef = useRef(
    new Map<string, StakingWithdrawFormNetworkDraft>()
  )
  const lastWithdrawDeploymentIdRef = useRef<string | null>(null)
  const withdrawAmountDraftSyncRef = useRef(amount)
  const withdrawSliderDraftSyncRef = useRef(sliderValue)
  withdrawAmountDraftSyncRef.current = amount
  withdrawSliderDraftSyncRef.current = sliderValue
  const submitInFlightRef = useRef(false)
  const [submitUiLocked, setSubmitUiLocked] = useState(false)

  useEffect(() => {
    if (!executionConnected) {
      setAmount("")
      setSliderValue([0])
      return
    }
    if (!vaultDataReady || isWrongNetwork) return
    if (tokenDecimals === null) return
    if (maxUnstakeWei <= 0n || minAmountWei > maxUnstakeWei) {
      setAmount("")
      setSliderValue([0])
      return
    }

    const trimmed = amount.trim()
    if (trimmed !== "") {
      const parsed = tryParseAmountWei(
        normalizeDecimalAmountInput(trimmed),
        tokenDecimals
      )
      if (
        parsed !== null &&
        parsed >= minAmountWei &&
        parsed <= maxUnstakeWei
      ) {
        return
      }
    }

    const defaultWei = minAmountWei > 0n ? minAmountWei : 1n
    if (defaultWei > maxUnstakeWei) {
      setAmount("")
      setSliderValue([0])
      return
    }
    setAmount(removeTrailingZeros(formatUnits(defaultWei, tokenDecimals)))
    const clamped =
      defaultWei < minAmountWei
        ? minAmountWei
        : defaultWei > maxUnstakeWei
          ? maxUnstakeWei
          : defaultWei
    const denom = maxUnstakeWei - minAmountWei
    if (denom <= 0n) {
      setSliderValue([100])
    } else {
      const span = clamped - minAmountWei
      const bps = (span * 10000n) / denom
      const sliderPercentage = Number(bps) / 100
      if (!Number.isFinite(sliderPercentage)) {
        setSliderValue([0])
      } else {
        setSliderValue([Math.max(0, Math.min(100, sliderPercentage))])
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reads latest `amount` when vault/max inputs change, not on every keystroke (Phase 49).
  }, [
    executionConnected,
    vaultDataReady,
    isWrongNetwork,
    tokenDecimals,
    maxUnstakeWei,
    minAmountWei,
  ])

  const trimmedAmount = amount.trim()

  // §19.11: adaptive debounce.
  useStakingGasMetrics()
  const { debounceMs } = getStakingGasTuning()
  const debouncedTrimmed = useDebouncedValue(trimmedAmount, debounceMs)

  const parsedDebounced = useMemo(
    () => tryParseAmountWei(debouncedTrimmed, tokenDecimals),
    [debouncedTrimmed, tokenDecimals]
  )
  const parsedWei = useMemo(
    () => tryParseAmountWei(trimmedAmount, tokenDecimals),
    [trimmedAmount, tokenDecimals]
  )

  const sliderDraggingRef = useRef(false)
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

  const txStatus = useTransactionStatus()
  const resetTxLifecycleRef = useRef(txStatus.resetTransactionLifecycle)
  resetTxLifecycleRef.current = txStatus.resetTransactionLifecycle

  useLayoutEffect(() => {
    const depId = activeRuntimeSelection.deployment.id.trim()
    const prev = lastWithdrawDeploymentIdRef.current

    if (prev !== null && prev !== depId) {
      withdrawDraftByDeploymentRef.current.set(prev, {
        amount: withdrawAmountDraftSyncRef.current,
        slider: [...withdrawSliderDraftSyncRef.current],
      })
      resetTxLifecycleRef.current()
    }

    lastWithdrawDeploymentIdRef.current = depId

    const restored = withdrawDraftByDeploymentRef.current.get(depId)
    if (restored) {
      setAmount(restored.amount)
      setSliderValue([...restored.slider])
    } else if (prev !== null && prev !== depId) {
      setAmount("")
      setSliderValue([0])
    }
  }, [activeRuntimeSelection.deployment.id])

  const ctaTxPhase = useMemo(
    () => deriveStakingCtaTxPhaseFromSnapshot("withdraw", txStatus.snapshot),
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

  const {
    feeDisplayLine,
    ethUsdPresentation,
    isEstimating,
    isRevalidating,
    hasEstimate,
    estimateSuccess,
    insufficientNative,
    nativeBalanceWei,
    nearZeroEth,
    feeSpikeWarning,
    highCongestionWarning,
    prepareSubmit,
    endSubmitPhase,
    flushEstimate,
    gasFirstStepMaxFeeWei,
  } = useStakingFeeDisplaySmoothing({
    scenario: "withdraw",
    depositApprovalExecution: "skip",
    stableAmountWei: gasStableWei,
    tokenAddress: tokenAddress ?? null,
    userAddress: executionAddress ?? null,
    chainId: executionChainId,
    showDepositStep2Preview: false,
    enabled: gasEnabled,
    expectedExecutionTarget:
      txStatus.snapshot.transactionRuntime != null
        ? resolveFrozenExecutionTarget(txStatus.snapshot.transactionRuntime)
        : undefined,
  })

  const handleConfirmRef = useRef<(launchMode?: "preview" | "direct") => void>(
    () => {}
  )

  const hasInvalidAmount = trimmedAmount !== "" && parsedWei === null
  const exceedsStaked = parsedWei !== null && parsedWei > maxUnstakeWei

  const belowMinWithdrawal =
    minWithdrawalFeeWei > 0n &&
    parsedWei !== null &&
    parsedWei > 0n &&
    parsedWei <= minWithdrawalFeeWei

  const gasAmountValidForFee = Boolean(
    parsedWei !== null &&
      parsedWei > 0n &&
      !exceedsStaked &&
      !belowMinWithdrawal
  )

  const gasUiActive = Boolean(
    executionConnected && vaultDataReady && !isWrongNetwork
  )

  const protocolWithdrawalFeeEnabled = Boolean(gasEnabled && gasAmountValidForFee)
  const {
    formattedFee: protocolWithdrawalFeeDisplay,
    feeWei: protocolWithdrawalFeeWei,
    loading: protocolWithdrawalFeeLoading,
    error: protocolWithdrawalFeeError,
  } = useWithdrawalProtocolFee({
    vaultAddress: STAKING_VAULT_ADDRESS,
    amountWei: gasStableWei,
    tokenDecimals,
    tokenSymbol: vaultWithdrawalFeeSymbol,
    enabled: protocolWithdrawalFeeEnabled,
    chainId: executionChainId,
  })

  const protocolWithdrawalFeeRowVisible = Boolean(
    protocolWithdrawalFeeEnabled && !protocolWithdrawalFeeError
  )

  const previewProtocolWithdrawalFeeReady = useMemo(
    () =>
      Boolean(
        gasAmountValidForFee &&
          !protocolWithdrawalFeeLoading &&
          !protocolWithdrawalFeeError &&
          protocolWithdrawalFeeDisplay.trim() !== ""
      ),
    [
      gasAmountValidForFee,
      protocolWithdrawalFeeLoading,
      protocolWithdrawalFeeError,
      protocolWithdrawalFeeDisplay,
    ]
  )

  const protocolWithdrawalFeeDisplayRef = useRef("")
  protocolWithdrawalFeeDisplayRef.current = protocolWithdrawalFeeDisplay

  const hasUsableWithdrawGasEstimate = Boolean(
    gasAmountValidForFee && hasEstimate && feeDisplayLine.trim() !== ""
  )

  const withdrawFeeReady = useMemo(() => {
    if (!gasAmountValidForFee || !gasEnabled) return true
    if (!previewProtocolWithdrawalFeeReady) return false
    if (hasUsableWithdrawGasEstimate && isRevalidating) return true
    if (isEstimating || isRevalidating) return false
    return hasUsableWithdrawGasEstimate
  }, [
    gasAmountValidForFee,
    gasEnabled,
    previewProtocolWithdrawalFeeReady,
    hasUsableWithdrawGasEstimate,
    isEstimating,
    isRevalidating,
  ])

  const previewFeeCanonicalMaxWeiHex = useMemo(
    () =>
      gasFirstStepMaxFeeWei != null
        ? `0x${gasFirstStepMaxFeeWei.toString(16)}`
        : null,
    [gasFirstStepMaxFeeWei]
  )

  useEffect(() => {
    const s = txStatus.snapshot
    if (!s.dialogOpen || s.uiPhase !== "preview") return
    if (s.scenario !== "withdraw") return

    const ready = withdrawFeeReady
    txStatus.syncPreviewGasEstimate({
      feeLine: ready ? protocolWithdrawalFeeDisplay : "",
      previewGasEstimateReady: ready,
      feeCanonicalMaxWeiHex: ready ? previewFeeCanonicalMaxWeiHex : null,
    })
  }, [
    txStatus.snapshot.dialogOpen,
    txStatus.snapshot.uiPhase,
    txStatus.snapshot.scenario,
    txStatus.syncPreviewGasEstimate,
    withdrawFeeReady,
    protocolWithdrawalFeeDisplay,
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
    stakingTxLifecycleDev("wallet_disconnect", { form: "withdraw" })
    txStatus.resetTransactionLifecycle()
    withdrawDraftByDeploymentRef.current.clear()
    lastWithdrawDeploymentIdRef.current = null
    setAmount("")
    setSliderValue([0])
  }, [txStatus])
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

  const withdrawableBalanceNumericIsZero =
    !formNumericLoading && safeMaxUnstakeWei === 0n
  const nativeGasBalanceIsZero =
    applyEvmNetworkAndGasCtaBlocks &&
    nativeBalanceWei !== null &&
    nativeBalanceWei === 0n
  const nativeGasBalanceWarn =
    applyEvmNetworkAndGasCtaBlocks &&
    nativeBalanceWei !== null &&
    nativeBalanceWei > 0n &&
    isNearZeroNativeBalance(nativeBalanceWei)

  const cta = useStakingCtaState({
    scenario: "withdraw",
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
    exceedsLimit: exceedsStaked,
    belowMinWithdrawal,
    needsApproval: false,
    nearZeroEth,
    insufficientNative,
    estimateSuccess,
    withdrawFeeReady,
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
  const withdrawFlowRunnerRef = useRef<(() => void) | null>(null)
  const withdrawFlowRunnerStartedRef = useRef(false)
  const walletFlowStartedRef = useRef(false)
  const dismissedPanelDuringWalletRef = useRef(false)

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
      if (snap.scenario !== "withdraw") return
      if (snap.withdrawTxHash?.trim()) return
      if (snap.uiPhase !== "awaiting_signature") return
      if (!wasMobileWalletReturnWithinMs(20_000)) return
      void (async () => {
        const recoveredHash = await tryRecoverWithdrawTxHashFromOnChain({
          snapshot: snap,
          deployment: activeRuntimeSelection.deployment,
          tokenDecimals,
          ownerAddress: executionAddress,
          source: "visibility_return",
        })
        if (!recoveredHash) return
        const live = txSnapshotRef.current
        if (live.submissionId !== snap.submissionId) return
        if (live.withdrawTxHash?.trim()) return
        txStatus.publishTxBroadcast({ step: "withdraw", hash: recoveredHash })
      })()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [
    activeRuntimeSelection.deployment,
    tokenDecimals,
    executionAddress,
    txStatus,
  ])

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
        scenario: "withdraw",
        cta: { actionType: cta.actionType, disabled: cta.disabled },
      }),
    [successLockActive, ctaTxPhase, cta.actionType, cta.disabled]
  )

  useEffect(() => {
    if (!(process.env.NODE_ENV !== 'production')) return
    const aligned = deriveTxUiPhaseFromTxPhase(
      ctaTxPhase,
      txStatus.snapshot.uiPhase
    )
    if (
      aligned === "busy" &&
      ctaTxPhase === "idle" &&
      txStatus.snapshot.uiPhase !== null
    ) {
      const sig = `${ctaTxPhase}|${txStatus.snapshot.uiPhase}`
      if (sig === lastDevModalBusySigRef.current) return
      lastDevModalBusySigRef.current = sig
      stakingTxIntegrityDev("modal_form_phase_drift", {
        form: "withdraw",
        uiPhase: txStatus.snapshot.uiPhase,
      })
    }
  }, [ctaTxPhase, txStatus.snapshot.uiPhase])

  useLayoutEffect(() => {
    const snap = txStatus.snapshot
    if (snap.scenario !== "withdraw") return
    tryStartStakingFormFlowRunnerFromLayout({
      form: "withdraw",
      launch: "preview_preparing_layout",
      isFlowArmed,
      uiPhase: snap.uiPhase,
      preparingTransaction: snap.preparingTransaction,
      flowRunnerStarted: withdrawFlowRunnerStartedRef,
      flowRunner: withdrawFlowRunnerRef,
      setIsFlowArmed,
      canAutoDispatch: () => snapshotAllowsAutoDispatch(txSnapshotRef.current),
    })
  }, [isFlowArmed, txStatus.snapshot])

  const terminalSuccessClearedRef = useRef(false)
  useEffect(() => {
    const s = txStatus.snapshot
    if (s.scenario !== "withdraw") {
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
      withdrawFlowRunnerRef.current !== null

    if (!flowDirty) return

    if (idleUnlockHandledForSnapshotRef.current === s) return
    idleUnlockHandledForSnapshotRef.current = s

    const prevSub = submissionIdRef.current
    submissionIdRef.current += 1
    stakingTxLifecycleDev("unlock_effect_idle_closed", {
      form: "withdraw",
      submissionIdBefore: prevSub,
      submissionIdAfter: submissionIdRef.current,
    })
    abandonStakingVaultTxExecutionLoading("withdraw_form_idle_unlock")
    setIsFlowArmed(false)
    withdrawFlowRunnerRef.current = null
    withdrawFlowRunnerStartedRef.current = false
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
        scenario: "withdraw",
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

  const defaultSubmitLabel = "Withdraw"

  const inlinePresentation = useMemo(
    () =>
      resolveStakingFormInlinePresentation({
        scenario: "withdraw",
        inlineCtaReason,
        suppressedReasonMessages: STAKING_WITHDRAW_CTA_REASON_UI_SUPPRESSED,
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
        scenario: "withdraw",
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

  const primaryAriaBusy =
    uiPhase === "approving" ||
    uiPhase === "depositing" ||
    uiPhase === "withdrawing" ||
    uiPhase === "confirming"

  const handleConfirm = (launchMode: "preview" | "direct" = "preview") => {
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
      txStatus.setFailed(STAKING_TX_EXECUTION_NOT_READY_MESSAGE)
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
    submissionIdRef.current += 1
    const submissionId = submissionIdRef.current
    traceTxMobileSetAttemptContext({
      submissionId,
      scenario: "withdraw",
      form: "withdraw",
    })
    stakingTxLifecycleDev("submissionId_new_attempt", {
      form: "withdraw",
      submissionId,
    })
    if (txSnapshotRef.current.terminalReason === "user_rejected") {
      clearPersistedStakingTxUserRejection("withdraw_new_attempt_after_rejection")
    }

    const previewGasEstimateReady = withdrawFeeReady
    const initialFee = previewGasEstimateReady ? protocolWithdrawalFeeDisplay : ""

    withdrawFlowRunnerRef.current = () => {
      void (async () => {
        walletFlowStartedRef.current = true
        try {
          if (DEBUG_LOGS) logger.log("[TX FLOW START]")
          const snap = txSnapshotRef.current
          const executionOpts = {
            expectedExecutionTarget:
              snap.transactionRuntime != null
                ? resolveFrozenExecutionTarget(snap.transactionRuntime)
                : undefined,
          }
          txStatus.beginPreparingTransaction()
          let gasSnap: Awaited<ReturnType<typeof prepareSubmit>> = null
          try {
            gasSnap = await prepareSubmit({
              useCachedIfFresh: launchMode === "direct",
            })
          } finally {
            txStatus.endPreparingTransaction()
          }
          if (submissionId !== submissionIdRef.current) {
            traceTxMobilePipeline("stale_submission_skip", {
              form: "withdraw",
              at: "after_prepare_submit",
              submissionId,
              current: submissionIdRef.current,
            })
            txStatus.setFailed("Transaction interrupted. Please try again.")
            return
          }

          if (gasSnap?.maxFeeWei != null) {
            txStatus.mergeFeeCanonicalFromPair({
              maxWeiHex: `0x${gasSnap.maxFeeWei.toString(16)}`,
              displayLine: gasSnap.feeDisplayLine,
            })
          }

          if (!txExecutionReadyRef.current) {
            txStatus.setFailed(STAKING_TX_EXECUTION_NOT_READY_MESSAGE)
            return
          }

          txStatus.beginAwaitingWalletSignature()

          if (txSnapshotRef.current.scenario !== "withdraw") return

          traceMobileStakingFlow("withdraw_dispatch_requested", {
            submissionId,
            flowRunId: txSnapshotRef.current.runId,
          })

          await withdraw(amount.trim(), {
            waitForReceipt: false,
            ...executionOpts,
            onSubmitted: (hash, receiptWait) => {
              if (submissionId !== submissionIdRef.current) return
              stakingSentryBreadcrumb("tx_submitted", {
                scenario: "withdraw",
                has_receipt_wait: Boolean(receiptWait),
              })
              txStatus.publishTxBroadcast({ step: "withdraw", hash })
              if (!receiptWait) return
              const pFee = protocolWithdrawalFeeDisplayRef.current.trim()
              const successFeeLine = pFee !== "" ? pFee : ""
              txStatus.registerReceiptCompletion({
                receiptWait,
                scenario: "withdraw",
                amountLabel: `${trimmedAmount} ${label}`,
                feeLine: successFeeLine,
                feeMaxWeiHex:
                  gasSnap?.maxFeeWei != null
                    ? `0x${gasSnap.maxFeeWei.toString(16)}`
                    : null,
                txHash: hash,
                errorStage: "withdraw",
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
        } catch (e) {
          setSubmitIntentActive(false)
          const rejectBypass = isStakingWalletUserRejectedError(e)
          if (!rejectBypass && submissionId !== submissionIdRef.current) return
          if (rejectBypass) {
            txStatus.markUserRejected({
              submissionId,
              rejectedStage: "withdraw",
            })
            dismissedPanelDuringWalletRef.current = false
            return
          }
          const message = getStakingTransactionErrorMessage(e, "withdraw")
          const errLine = message.description?.trim()
            ? `${message.title}\n${message.description}`
            : message.title
          stakingTxLifecycleDev("catch_setFailed", {
            form: "withdraw",
            isWalletReject: false,
            submissionId,
            currentSubmissionId: submissionIdRef.current,
          })
          txStatus.setFailed(errLine)
          if (dismissedPanelDuringWalletRef.current) {
            const withdrawHash = txSnapshotRef.current.withdrawTxHash?.trim() ?? ""
            stakingToastError(message.title, {
              description: message.description ?? undefined,
              dedupeId: createStakingToastDedupeKey(
                "tx_form",
                "flow_catch_err",
                "withdraw",
                submissionId,
                withdrawHash.length > 0
                  ? withdrawHash.toLowerCase()
                  : stakingToastDedupeFingerprint(message.title)
              ),
            })
          }
          dismissedPanelDuringWalletRef.current = false
        } finally {
          walletFlowStartedRef.current = false
          submitInFlightRef.current = false
          withdrawFlowRunnerStartedRef.current = false
          setSubmitUiLocked(false)
          endSubmitPhase()
        }
      })()
    }

    setIsFlowArmed(true)
    const txOpenInput = {
      scenario: "withdraw" as const,
      needsApproval: false,
      amountLabel: `${trimmedAmount} ${label}`,
      feeLine: initialFee,
      previewGasEstimateReady,
      feeCanonicalMaxWeiHex: previewGasEstimateReady
        ? previewFeeCanonicalMaxWeiHex
        : null,
      submissionId,
    }
    if (launchMode === "direct") {
      txStatus.openAwaitingSignature(txOpenInput)
      startStakingFormFlowRunnerDirect({
        form: "withdraw",
        launch: "direct_sync",
        flowRunnerStarted: withdrawFlowRunnerStartedRef,
        flowRunner: withdrawFlowRunnerRef,
        setIsFlowArmed,
        manualDispatch: true,
      })
      return
    }
    txStatus.openPreview(txOpenInput)
  }

  handleConfirmRef.current = handleConfirm

  useLayoutEffect(() => {
    const req = txStatus.retryRequest
    if (req.scenario !== "withdraw") return
    if (req.nonce <= 0 || req.nonce === lastHandledRetryNonceRef.current) {
      traceTxMobilePipeline("retry_blocked_nonce_deduped", {
        form: "withdraw",
        nonce: req.nonce,
      })
      return
    }
    lastHandledRetryNonceRef.current = req.nonce
    releaseFormExecutionOwnershipForRetry(
      "withdraw",
      {
        submitInFlight: submitInFlightRef,
        flowRunnerStarted: withdrawFlowRunnerStartedRef,
        flowRunner: withdrawFlowRunnerRef,
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
      traceTxMobilePipeline("retry_blocked_not_ready", { form: "withdraw" })
      txStatus.setFailed(STAKING_TX_EXECUTION_NOT_READY_MESSAGE)
      return
    }
    traceTxMobilePipeline("retry_execution_armed", {
      form: "withdraw",
      nonce: req.nonce,
    })
    void handleConfirmRef.current("direct")
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
      form: "withdraw",
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
          form: "withdraw",
          launchMode: "preview",
        })
        void handleConfirm("preview")
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

  const applySliderPercent = (pct: number) => {
    if (tokenDecimals === null || maxUnstakeWei <= 0n || minAmountWei > maxUnstakeWei) {
      setAmount("")
      return
    }
    const t = pct / 100
    const wei = lerpBigInt(minAmountWei, maxUnstakeWei, t)
    if (wei === 0n) {
      setAmount("")
      return
    }
    setAmount(removeTrailingZeros(formatUnits(wei, tokenDecimals)))
  }

  const updateSliderFromInput = (newAmount: string) => {
    const parsed = tryParseAmountWei(newAmount, tokenDecimals)
    if (parsed === null || maxUnstakeWei < minAmountWei) {
      setSliderValue([0])
      return
    }
    const clamped =
      parsed < minAmountWei
        ? minAmountWei
        : parsed > maxUnstakeWei
          ? maxUnstakeWei
          : parsed
    const denom = maxUnstakeWei - minAmountWei
    if (denom <= 0n) {
      setSliderValue([100])
      return
    }
    const span = clamped - minAmountWei
    const bps = (span * 10000n) / denom
    const sliderPercentage = Number(bps) / 100
    if (!Number.isFinite(sliderPercentage)) {
      setSliderValue([0])
      return
    }
    setSliderValue([Math.max(0, Math.min(100, sliderPercentage))])
  }

  function handleWithdrawMaxClick() {
    if (tokenDecimals === null || maxUnstakeWei <= 0n) return
    const s =
      removeTrailingZeros(formatUnits(maxUnstakeWei, tokenDecimals)) || "0"
    setAmount(s)
    updateSliderFromInput(s)
    sliderDraggingRef.current = false
    setGasStableWei(maxUnstakeWei)
    flushEstimate()
  }

  const formFieldsLoadingLocked =
    !vaultDataReady ||
    (applyEvmNetworkAndGasCtaBlocks && (!executionConnected || isWrongNetwork)) ||
    (isPassiveTronRuntime && (!runtimeWallet.hasAccount || isWrongNetwork))
  const formFieldsDisabled = formFieldsLoadingLocked
  const formInputsReadOnly =
    isPassiveTronRuntime && vaultDataReady && !formFieldsLoadingLocked
  const assetSelectDisabled = isPassiveTronRuntime ? false : formFieldsDisabled
  const amountSliderDisabled =
    formFieldsDisabled ||
    formInputsReadOnly ||
    maxUnstakeWei <= 0n ||
    minAmountWei > maxUnstakeWei ||
    formNumericLoading
  const showAmountMaxButton =
    executionConnected &&
    vaultDataReady &&
    !isWrongNetwork &&
    canTransact &&
    maxUnstakeWei > 0n &&
    minAmountWei <= maxUnstakeWei

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

  const inputOnlyInvalid =
    hasInvalidAmount ||
    (trimmedAmount !== "" && parsedWei !== null && parsedWei === 0n)

  const isSubmittingUi =
    ctaTxPhase !== "idle" || submitUiLocked || successLockActive

  const zeroGasFeeFullLine = useMemo(
    () => stakingGasFeeZeroDisplayLine(ethUsdPresentation),
    [ethUsdPresentation]
  )

  const withdrawGasFeeDisplayLine = useMemo(() => {
    if (trimmedAmount === "") {
      return zeroGasFeeFullLine
    }
    if (gasAmountValidForFee && feeDisplayLine.trim() !== "") {
      return feeDisplayLine
    }
    return zeroGasFeeFullLine
  }, [trimmedAmount, gasAmountValidForFee, feeDisplayLine, zeroGasFeeFullLine])

  const gasShortfall = Boolean(
    gasAmountValidForFee &&
      gasUiActive &&
      (nearZeroEth || (estimateSuccess && insufficientNative))
  )

  const feeMuted = Boolean(
    gasAmountValidForFee &&
      !gasShortfall &&
      (isEstimating || isRevalidating)
  )

  const feeValueLoading = Boolean(
    gasAmountValidForFee &&
      !gasShortfall &&
      !isSubmittingUi &&
      (!hasEstimate || isEstimating || isRevalidating)
  )

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

  const withdrawSummaryFeeRight = useMemo(
    () => networkFeeRowRightDisplayValue(withdrawGasFeeDisplayLine).trim(),
    [withdrawGasFeeDisplayLine]
  )

  const withdrawReceiveLoading = Boolean(
    protocolWithdrawalFeeRowVisible &&
      protocolWithdrawalFeeLoading &&
      protocolWithdrawalFeeWei === null &&
      gasAmountValidForFee
  )

  const withdrawSummaryReceive = useMemo(() => {
    const outSym = publicTokenSymbolLabel(
      vaultMerchantShareSymbol(
        normalizeStakingTokenSymbol(tokenSymbol) || STAKING_STABLECOIN_LABEL
      )
    )
    if (tokenDecimals === null) {
      return null
    }
    if (!gasAmountValidForFee) {
      return `~0 ${outSym}`
    }
    if (withdrawReceiveLoading) return null
    if (parsedWei === null) {
      return null
    }
    if (!protocolWithdrawalFeeRowVisible) {
      return `~${removeTrailingZeros(formatUnits(parsedWei, tokenDecimals))} ${outSym}`
    }
    if (protocolWithdrawalFeeWei === null) return null
    const net = parsedWei - protocolWithdrawalFeeWei
    if (net < 0n) return null
    return `~${removeTrailingZeros(formatUnits(net, tokenDecimals))} ${outSym}`
  }, [
    withdrawReceiveLoading,
    gasAmountValidForFee,
    parsedWei,
    tokenDecimals,
    tokenSymbol,
    protocolWithdrawalFeeRowVisible,
    protocolWithdrawalFeeWei,
  ])

  const withdrawFeeHintTitle = useMemo(() => {
    const t = feeHint.text?.trim()
    return t || undefined
  }, [feeHint.text])

  const primaryTitle = useMemo(() => {
    if (!primaryDisabled) return undefined
    const t = inlinePresentation.lineText.trim()
    if (t !== "") return t
    if (
      inlineCtaReason &&
      !STAKING_WITHDRAW_CTA_REASON_UI_SUPPRESSED.has(inlineCtaReason.message)
    ) {
      return inlineCtaReason.hint
        ? `${inlineCtaReason.message} — ${inlineCtaReason.hint}`
        : inlineCtaReason.message
    }
    return undefined
  }, [primaryDisabled, inlinePresentation.lineText, inlineCtaReason])

  const stakingMetaShowDisconnectedDash =
    applyEvmNetworkAndGasCtaBlocks && !executionConnected

  const withdrawBalanceMetaNativeClassName = cn(
    nativeGasBalanceIsZero && "text-destructive",
    !nativeGasBalanceIsZero &&
      nativeGasBalanceWarn &&
      "text-amber-600 dark:text-amber-500"
  )

  return (
    <StakingFormLayout
      body={
        <div className={STAKING_FORM_SLOT_BODY_CLASS}>
      <StakingFormSlotAsset>
      <StakingWithdrawAssetSelect
        disabled={assetSelectDisabled}
        label={label}
        poolNetworkLabel={activeRuntimeSelection.deployment.labels.network}
      />
      </StakingFormSlotAsset>

      <StakingFormSlotMeta>
        {formNumericLoading ? (
          <StakingFormBalanceMetaRow
            prefix='Withdrawable:'
            applyGasColumn={applyEvmNetworkAndGasCtaBlocks}
            showDisconnectedDash={stakingMetaShowDisconnectedDash}
            tokenSkeleton
            tokenAmount={ZERO_AMOUNT_DISPLAY}
            tokenSymbol={label}
            nativeAmountClassName={withdrawBalanceMetaNativeClassName}
            nativeAmount={displayNativeGasAmount}
            nativeSymbol={STAKING_APPKIT_NETWORK.nativeCurrency.symbol}
          />
        ) : withdrawAmountMeta.kind === "constraints" ? (
          <StakingFormBalanceMetaConstraintsRow
            maxHint={withdrawAmountMeta.maxHint}
            minHint={withdrawAmountMeta.minHint}
            title={withdrawAmountMeta.title}
            applyGasColumn={applyEvmNetworkAndGasCtaBlocks}
            reserveGasInactive={stakingMetaShowDisconnectedDash}
            nativeAmount={displayNativeGasAmount}
            nativeSymbol={STAKING_APPKIT_NETWORK.nativeCurrency.symbol}
            nativeAmountClassName={withdrawBalanceMetaNativeClassName}
          />
        ) : (
          <StakingFormBalanceMetaRow
            prefix='Withdrawable:'
            applyGasColumn={applyEvmNetworkAndGasCtaBlocks}
            showDisconnectedDash={stakingMetaShowDisconnectedDash}
            tokenSkeleton={false}
            tokenAmountClassName={
              withdrawableBalanceNumericIsZero ? "text-destructive" : undefined
            }
            tokenAmount={formattedMaxUnstake}
            tokenSymbol={label}
            nativeAmountClassName={withdrawBalanceMetaNativeClassName}
            nativeAmount={displayNativeGasAmount}
            nativeSymbol={STAKING_APPKIT_NETWORK.nativeCurrency.symbol}
          />
        )}
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
                (exceedsStaked || belowMinWithdrawal || inputOnlyInvalid) &&
                STAKING_INPUT_ERROR
            )}
          >
            <Input
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
                (exceedsStaked || belowMinWithdrawal || inputOnlyInvalid)
              }
              onBlur={() => {
                sliderDraggingRef.current = false
                if (parsedWei !== null) setGasStableWei(parsedWei)
                flushEstimate()
              }}
              onKeyDown={e => {
                if (e.key === "-") e.preventDefault()
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
                onClick={handleWithdrawMaxClick}
              >
                Max
              </button>
            ) : null}
          </div>
        </div>
      </StakingFormSlotAmount>
      <StakingFormSlotSlider
        aria-label='Amount as percentage of staked balance'
        onPointerDownCapture={() => {
          sliderDraggingRef.current = true
          setSliderActive(true)
        }}
        onPointerUpCapture={() => {
          sliderDraggingRef.current = false
          setSliderActive(false)
          if (parsedWei !== null) setGasStableWei(parsedWei)
          flushEstimate()
        }}
      >
        <StakingFormSlotSliderInner>
          <Slider
            value={sliderValue}
            disabled={amountSliderDisabled}
            onValueChange={(newValues: number[]) => {
              setSliderValue(newValues)
              applySliderPercent(newValues[0] ?? 0)
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
        aria-label='Withdraw fee, receive, and status'
      >
        <StakingFormSlotFeeRows>
          <StakingFormActionSummaryWithdraw
            feeRightDisplay={withdrawSummaryFeeRight}
            feeLoading={feeValueLoading}
            feeMuted={Boolean(feeMuted || isSubmittingUi)}
            gasShortfall={gasShortfall}
            feeHintTitle={withdrawFeeHintTitle}
            showNetworkFeeRow={applyEvmNetworkAndGasCtaBlocks}
            receiveDisplay={withdrawSummaryReceive}
            receiveLoading={withdrawReceiveLoading}
          />

          <StakingCtaReason
            id='staking-withdraw-cta-reason'
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
              ? "staking-withdraw-cta-reason"
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

export default StakingAppWithdrawForm
