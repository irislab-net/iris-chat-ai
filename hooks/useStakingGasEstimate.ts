import { DEBUG_LOGS } from "@/staking/config"
import {
  buildNetworkFeeDisplayLine,
} from "@/staking/execution"
import {
  STAKING_CHAIN_ID,
  STAKING_RPC_HTTP_URL,
  STAKING_VAULT_ADDRESS,
} from "@/constants/stakingVaultConfig"
import useEtheriumWallet from "@/hooks/useEtheriumWallet"
import { useStakingEthUsdPresentation } from "@/hooks/useStakingEthUsdPresentation"
import {
  recordStakingGasMetric,
  useStakingGasMetrics,
} from "@/lib/stakingGasMetrics"
import type { DepositApprovalExecution } from "@/lib/stakingDepositApprovalExecution"
import {
  clearGasCaches,
  estimateStakingGasFee,
  getCachedNativeBalanceWei,
  isNearZeroNativeBalance,
  type GasEstimateResult,
  stakingDepositMethodForGas,
} from "@/staking/execution"
import { canRuntimeOperationCommitWithDevTrace } from "@/staking/orchestration"
import {
  deriveRuntimeExecutionTarget,
  executionTargetEquals,
  type RuntimeExecutionTarget,
} from "@/staking/core/runtimeExecutionTarget"
import { useRuntimeTransitionSnapshot } from "@/staking/core/runtimeSelectionHooks"
import {
  trackRuntimeTelemetryGasEstimateDepthEnter,
  trackRuntimeTelemetryGasEstimateDepthLeave,
} from "@/lib/runtimeTelemetry/runtimeTelemetry"
import {
  devRuntimeChaosGasEstimatePreamble,
  devRuntimeStressGasEstimateBegin,
  devRuntimeStressGasEstimateEnd,
} from "@/staking/core/runtimeTransitionTelemetry"
import { safeRandomUuid } from "@/lib/safeRandomUuid"
import { traceTxMobilePipeline } from "@/staking/diagnostics/stakingTxMobileDeepLinkTrace"
import { MaxUint256, formatEther, getAddress, isAddress } from "ethers"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const FEE_SPIKE_NUM = 3n
const FEE_SPIKE_DEN = 2n

const STAKING_DEPOSIT_GAS_FEE_TITLE = "Fee"
const STAKING_WITHDRAW_GAS_FEE_TITLE = "Fee"

function devTraceId(): string {
  return safeRandomUuid().slice(0, 8)
}

export type FinalGasSnapshot = Readonly<{
  maxFeeWei: bigint
  feeDisplayLine: string
  feeExactEther: string
  congestionWarning: boolean
}>

export type UseStakingGasEstimateOptions = {
  scenario: "deposit" | "withdraw"
  /** Canonical first-step deposit behavior (`deriveDepositApprovalExecution`). */
  depositApprovalExecution: DepositApprovalExecution
  stableAmountWei: bigint | null
  tokenAddress: string | null
  userAddress: string | null
  chainId: number | null
  showDepositStep2Preview?: boolean
  enabled: boolean
  /**
   * When the tx modal has a frozen runtime, refuse gas RPC if passive runtime diverges (Phase 30).
   */
  expectedExecutionTarget?: RuntimeExecutionTarget | null
}

/**
 * Staking gas estimates (deposit / withdraw). Phase 31–36: async commits use **`canRuntimeOperationCommitWithDevTrace`**
 * with **`latestCoordinatorSnapshotRef`** (lifecycle, **`sequenceStage`**, **`refreshPaused`**, **`transitionGeneration`**); passive **`generation`** changes only via **`executeRuntimeSwap`** after **`evaluateRuntimeSwapPolicy`** (Phase 35).
 * **Phase 37 (DEV, opt-in stress env):** nested estimate depth is tracked for leak warnings during runtime swaps.
 */
export function useStakingGasEstimate(options: UseStakingGasEstimateOptions) {
  const transition = useRuntimeTransitionSnapshot()
  const stakingRuntime = transition.operationContext
  const { signer } = useEtheriumWallet({
    evmRuntimeActive: stakingRuntime.deployment.chainFamily === "evm",
  })
  const latestCoordinatorSnapshotRef = transition.latestCoordinatorSnapshotRef
  const {
    scenario,
    depositApprovalExecution,
    stableAmountWei,
    tokenAddress,
    userAddress,
    chainId,
    showDepositStep2Preview = true,
    enabled,
    expectedExecutionTarget,
  } = options

  const [isEstimating, setIsEstimating] = useState(false)
  const [isRevalidating, setIsRevalidating] = useState(false)
  const [hasEstimate, setHasEstimate] = useState(false)
  const [estimateSuccess, setEstimateSuccess] = useState(false)
  const [displayResult, setDisplayResult] = useState<GasEstimateResult | null>(null)
  const [depositPreviewResult, setDepositPreviewResult] =
    useState<GasEstimateResult | null>(null)
  /** Second-stage deposit preview failed or was skipped; do not hard-block CTA on it. */
  const [depositSecondPreviewUnavailable, setDepositSecondPreviewUnavailable] =
    useState(false)
  const [nativeBalanceWei, setNativeBalanceWei] = useState<bigint | null>(null)
  const [estimateWarning, setEstimateWarning] = useState<string | null>(null)
  const [feeSpikeWarning, setFeeSpikeWarning] = useState(false)
  const [nearZeroEth, setNearZeroEth] = useState(false)
  const [highCongestionWarning, setHighCongestionWarning] = useState(false)

  const [finalEstimate, setFinalEstimate] = useState<FinalGasSnapshot | null>(null)
  const [submitPhaseActive, setSubmitPhaseActive] = useState(false)
  const submitPhaseActiveRef = useRef(false)
  submitPhaseActiveRef.current = submitPhaseActive

  const generationRef = useRef(0)
  /** Monotonic per started estimate run; `finally` only clears loading when this matches (avoids stranded flags after gen bump). */
  const gasEstimateRunSerialRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const pendingRef = useRef<Promise<void> | null>(null)
  const previousFeeWeiRef = useRef<bigint | null>(null)
  const displayResultRef = useRef<GasEstimateResult | null>(null)
  const activityIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activityPhaseRef = useRef<"idle" | "active">("active")
  /** §19.8: timestamps for metric recording, captured at request start and response. */
  const pendingRequestStartTsRef = useRef<number | null>(null)
  const pendingResponseTsRef = useRef<number | null>(null)
  /** §20.6: in-flight guard for the adaptive idle revalidation interval. */
  const isEstimatingRef = useRef<boolean>(false)

  displayResultRef.current = displayResult
  isEstimatingRef.current = isEstimating || isRevalidating

  const vaultAddress = STAKING_VAULT_ADDRESS
  /** Chainlink presentation only while this hook’s gas UI is active — avoids idle polling. */
  const ethUsdPresentation = useStakingEthUsdPresentation(enabled)
  const numericChainId = chainId ?? STAKING_CHAIN_ID

  const isValidContext =
    Boolean(
      enabled &&
        userAddress &&
        tokenAddress &&
        isAddress(tokenAddress) &&
        isAddress(userAddress) &&
        stableAmountWei !== null &&
        stableAmountWei > 0n
    )

  const bumpGeneration = useCallback(() => {
    generationRef.current += 1
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    return generationRef.current
  }, [])

  useEffect(() => {
    generationRef.current += 1
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    clearGasCaches()
    setFinalEstimate(null)
    setSubmitPhaseActive(false)
    setDisplayResult(null)
    setDepositPreviewResult(null)
    setDepositSecondPreviewUnavailable(false)
    setHasEstimate(false)
    setEstimateSuccess(false)
    setNativeBalanceWei(null)
    setNearZeroEth(false)
    setEstimateWarning(null)
    previousFeeWeiRef.current = null
    setIsEstimating(false)
    setIsRevalidating(false)
    isEstimatingRef.current = false
  }, [numericChainId, userAddress, transition, expectedExecutionTarget])

  /** Native balance for UI (e.g. assets row) even when `stableAmountWei` blocks full gas estimation. */
  useEffect(() => {
    if (!enabled) return
    const raw = userAddress?.trim()
    if (!raw || !isAddress(raw)) return

    const ac = new AbortController()
    const genAtStart = generationRef.current
    const coordinatorAtStart = transition.coordinatorSnapshot

    void (async () => {
      try {
        const nb = await getCachedNativeBalanceWei({
          userAddress: getAddress(raw),
          chainId: numericChainId,
          rpcUrl: STAKING_RPC_HTTP_URL,
          signal: ac.signal,
          forceRefresh: false,
          isValidForCache: () =>
            !ac.signal.aborted &&
            genAtStart === generationRef.current &&
            canRuntimeOperationCommitWithDevTrace(
              "useStakingGasEstimate:nativeDisplayBalance",
              coordinatorAtStart,
              latestCoordinatorSnapshotRef.current
            ),
          runtime: stakingRuntime,
        })
        if (ac.signal.aborted) return
        if (genAtStart !== generationRef.current) return
        if (
          !canRuntimeOperationCommitWithDevTrace(
            "useStakingGasEstimate:nativeDisplayBalanceCommit",
            coordinatorAtStart,
            latestCoordinatorSnapshotRef.current
          )
        ) {
          return
        }
        if (nb !== null) {
          setNativeBalanceWei(nb)
        }
      } catch {
        /* ignore */
      }
    })()

    return () => ac.abort()
  }, [
    enabled,
    userAddress,
    numericChainId,
    stakingRuntime.runtimeKey,
    transition.coordinatorSnapshot,
  ])

  const formatFeeLine = useCallback(
    (r: GasEstimateResult, feeTitle?: string) =>
      buildNetworkFeeDisplayLine({
        maxFeeWei: r.maxFeeWei,
        ethUsd: ethUsdPresentation,
        ...(feeTitle !== undefined ? { feeTitle } : {}),
      }),
    [ethUsdPresentation]
  )

  const twoStepDepositGasPreview = useMemo(
    () =>
      showDepositStep2Preview &&
      scenario === "deposit" &&
      depositApprovalExecution !== "skip",
    [showDepositStep2Preview, scenario, depositApprovalExecution]
  )

  const dualGasComplete = useMemo(
    () =>
      Boolean(
        twoStepDepositGasPreview &&
          displayResult !== null &&
          depositPreviewResult !== null
      ),
    [twoStepDepositGasPreview, displayResult, depositPreviewResult]
  )

  const runEstimateInternal = useCallback(
    async (forceRefresh: boolean, traceId: string) => {
      const gen = generationRef.current
      const signal = abortRef.current?.signal

      if (!isValidContext || !userAddress || !tokenAddress || stableAmountWei === null) {
        return
      }

      const expectedTarget = expectedExecutionTarget
      if (expectedTarget != null) {
        const active = deriveRuntimeExecutionTarget(stakingRuntime)
        if (!executionTargetEquals(active, expectedTarget)) {
          setEstimateSuccess(false)
          setHasEstimate(false)
          setEstimateWarning(
            "Staking runtime no longer matches this transaction. Close the dialog and try again."
          )
          setDisplayResult(null)
          setDepositPreviewResult(null)
          setDepositSecondPreviewUnavailable(false)
          setFeeSpikeWarning(false)
          setHighCongestionWarning(false)
          return
        }
      }

      const addr = getAddress(userAddress)
      const tok = getAddress(tokenAddress)

      const hadPrior = displayResultRef.current !== null
      if (hadPrior) setIsRevalidating(true)
      else setIsEstimating(true)
      isEstimatingRef.current = true
      const myRunSerial = ++gasEstimateRunSerialRef.current

      const requestStartTs = performance.now()
      const isValidForCache = () => gen === generationRef.current
      const coordinatorRunStart = transition.coordinatorSnapshot
      const canCommitGasEstimateUi = () =>
        gen === generationRef.current &&
        !submitPhaseActiveRef.current &&
        canRuntimeOperationCommitWithDevTrace(
          "useStakingGasEstimate:estimatePath",
          coordinatorRunStart,
          latestCoordinatorSnapshotRef.current
        )

      try {
        devRuntimeStressGasEstimateBegin()
        trackRuntimeTelemetryGasEstimateDepthEnter({
          runtimeKey: stakingRuntime.runtimeKey,
          deploymentId: stakingRuntime.deployment.id,
          chainFamily: stakingRuntime.deployment.chainFamily,
          transitionGeneration: Number(coordinatorRunStart.transitionGeneration),
          chainId: numericChainId,
        })
        await devRuntimeChaosGasEstimatePreamble(signal)
        const nb = await getCachedNativeBalanceWei({
          userAddress: addr,
          chainId: numericChainId,
          rpcUrl: STAKING_RPC_HTTP_URL,
          signal,
          forceRefresh,
          isValidForCache,
          runtime: stakingRuntime,
        })
        if (!canCommitGasEstimateUi()) return

        if (nb !== null) {
          setNativeBalanceWei(nb)
          const nz = isNearZeroNativeBalance(nb)
          setNearZeroEth(nz)
          if (nz) {
            setEstimateSuccess(false)
            setHasEstimate(false)
            setDisplayResult(null)
            setDepositPreviewResult(null)
            setDepositSecondPreviewUnavailable(false)
            setEstimateWarning(null)
            return
          }
        }

        const method: "approve" | "deposit" | "depositWithAffiliate" | "withdraw" =
          scenario === "withdraw"
            ? "withdraw"
            : depositApprovalExecution !== "skip"
              ? "approve"
              : stakingDepositMethodForGas(userAddress)

        const approveEstWei =
          depositApprovalExecution === "unlimited_approve"
            ? MaxUint256
            : stableAmountWei

        const trace = DEBUG_LOGS ? traceId : undefined

        const primary = await estimateStakingGasFee({
          method,
          amountWei: method === "approve" ? approveEstWei : stableAmountWei,
          userAddress: addr,
          tokenAddress: tok,
          vaultAddress,
          chainId: numericChainId,
          signer: signer ?? null,
          signal,
          forceRefresh,
          activityTtl: activityPhaseRef.current === "idle" ? "idle" : "active",
          isValidForCache,
          traceId: trace,
          runtime: stakingRuntime,
        })

        if (!canCommitGasEstimateUi()) return

        if (primary === null) {
          setEstimateSuccess(false)
          setEstimateWarning(null)
          return
        }

        setEstimateSuccess(true)
        setHasEstimate(true)
        setEstimateWarning(null)
        setHighCongestionWarning(primary.congestionWarning)

        const prev = previousFeeWeiRef.current
        if (
          prev !== null &&
          prev > 0n &&
          primary.maxFeeWei > (prev * FEE_SPIKE_NUM) / FEE_SPIKE_DEN
        ) {
          setFeeSpikeWarning(true)
        } else {
          setFeeSpikeWarning(false)
        }
        previousFeeWeiRef.current = primary.maxFeeWei

        const responseTs = performance.now()
        pendingRequestStartTsRef.current = requestStartTs
        pendingResponseTsRef.current = responseTs

        setDisplayResult(primary)

        if (
          showDepositStep2Preview &&
          scenario === "deposit" &&
          depositApprovalExecution !== "skip"
        ) {
          setDepositSecondPreviewUnavailable(false)
          const dm = stakingDepositMethodForGas(userAddress)
          let dep: GasEstimateResult | null = null
          try {
            dep = await estimateStakingGasFee({
              method: dm,
              amountWei: stableAmountWei,
              userAddress: addr,
              tokenAddress: tok,
              vaultAddress,
              chainId: numericChainId,
              signer: signer ?? null,
              signal,
              forceRefresh,
              activityTtl: activityPhaseRef.current === "idle" ? "idle" : "active",
              isValidForCache,
              traceId: trace,
              runtime: stakingRuntime,
            })
          } catch {
            dep = null
          }
          if (!canCommitGasEstimateUi()) return
          if (dep === null) {
            const minFb = 320_000n
            const mult = 6n
            const cap = 12_000_000n
            let fallbackRaw = primary.gasLimitRaw * mult
            if (fallbackRaw < minFb) fallbackRaw = minFb
            if (fallbackRaw > cap) fallbackRaw = cap
            try {
              dep = await estimateStakingGasFee({
                method: dm,
                amountWei: stableAmountWei,
                userAddress: addr,
                tokenAddress: tok,
                vaultAddress,
                chainId: numericChainId,
                signer: signer ?? null,
                signal,
                forceRefresh: true,
                activityTtl: activityPhaseRef.current === "idle" ? "idle" : "active",
                isValidForCache,
                traceId: trace,
                gasLimitRawOverride: fallbackRaw,
                runtime: stakingRuntime,
              })
            } catch {
              dep = null
            }
          }
          if (!canCommitGasEstimateUi()) return
          if (dep === null) {
            setDepositPreviewResult(null)
            setDepositSecondPreviewUnavailable(true)
          } else {
            setDepositPreviewResult(dep)
            setDepositSecondPreviewUnavailable(false)
          }
        } else {
          setDepositPreviewResult(null)
          setDepositSecondPreviewUnavailable(false)
        }
      } finally {
        devRuntimeStressGasEstimateEnd()
        trackRuntimeTelemetryGasEstimateDepthLeave()
        if (myRunSerial === gasEstimateRunSerialRef.current) {
          setIsEstimating(false)
          setIsRevalidating(false)
          isEstimatingRef.current = false
        }
      }
    },
    [
      isValidContext,
      depositApprovalExecution,
      numericChainId,
      scenario,
      showDepositStep2Preview,
      signer,
      stableAmountWei,
      tokenAddress,
      userAddress,
      vaultAddress,
      transition,
      expectedExecutionTarget,
      stakingRuntime,
    ]
  )

  const runEstimateRef = useRef(runEstimateInternal)
  runEstimateRef.current = runEstimateInternal

  // §19.8 + §20.3: SINGLE metric recording site. Fires on render-commit of a
  // non-null displayResult. The stale-response path silently discards both
  // the response and the metric record (no duplicate writes anywhere).
  useEffect(() => {
    if (displayResult === null) return
    const start = pendingRequestStartTsRef.current
    const respond = pendingResponseTsRef.current
    if (start === null || respond === null) return
    const renderCommitTs = performance.now()
    recordStakingGasMetric({
      latencyMs: respond - start,
      renderDelayMs: renderCommitTs - respond,
      endToEndMs: renderCommitTs - start,
    })
    pendingRequestStartTsRef.current = null
    pendingResponseTsRef.current = null
  }, [displayResult])

  useEffect(() => {
    if (!enabled || !isValidContext || submitPhaseActive) return

    activityPhaseRef.current = "active"
    if (activityIdleTimerRef.current) clearTimeout(activityIdleTimerRef.current)
    activityIdleTimerRef.current = setTimeout(() => {
      activityPhaseRef.current = "idle"
    }, 2000)

    const tid = devTraceId()
    const p = runEstimateRef.current(false, tid)
    pendingRef.current = p.then(() => {})
    void p

    return () => {
      if (activityIdleTimerRef.current) clearTimeout(activityIdleTimerRef.current)
    }
  }, [
    enabled,
    isValidContext,
    stableAmountWei,
    depositApprovalExecution,
    scenario,
    submitPhaseActive,
    numericChainId,
    userAddress,
    tokenAddress,
    transition,
    expectedExecutionTarget,
  ])

  const feeDisplayLine = useMemo(() => {
    if (submitPhaseActive && finalEstimate) return finalEstimate.feeDisplayLine
    if (!hasEstimate || !displayResult) return ""
    if (dualGasComplete && depositPreviewResult) {
      const sumWei = displayResult.maxFeeWei + depositPreviewResult.maxFeeWei
      return buildNetworkFeeDisplayLine({
        maxFeeWei: sumWei,
        ethUsd: ethUsdPresentation,
        feeTitle: STAKING_DEPOSIT_GAS_FEE_TITLE,
      })
    }
    if (twoStepDepositGasPreview && !depositPreviewResult) {
      return buildNetworkFeeDisplayLine({
        maxFeeWei: displayResult.maxFeeWei,
        ethUsd: ethUsdPresentation,
        feeTitle: STAKING_DEPOSIT_GAS_FEE_TITLE,
      })
    }
    return scenario === "deposit"
      ? formatFeeLine(displayResult, STAKING_DEPOSIT_GAS_FEE_TITLE)
      : formatFeeLine(displayResult, STAKING_WITHDRAW_GAS_FEE_TITLE)
  }, [
    submitPhaseActive,
    finalEstimate,
    hasEstimate,
    displayResult,
    depositPreviewResult,
    dualGasComplete,
    twoStepDepositGasPreview,
    ethUsdPresentation,
    formatFeeLine,
    scenario,
  ])

  const feeExactEther = useMemo(() => {
    if (!displayResult) return ""
    if (dualGasComplete && depositPreviewResult) {
      return formatEther(displayResult.maxFeeWei + depositPreviewResult.maxFeeWei)
    }
    return displayResult.feeExactEther
  }, [displayResult, depositPreviewResult, dualGasComplete])

  const totalMaxFeeWeiForNative = useMemo(() => {
    if (!displayResult) return null
    if (dualGasComplete && depositPreviewResult) {
      return displayResult.maxFeeWei + depositPreviewResult.maxFeeWei
    }
    if (twoStepDepositGasPreview && !depositPreviewResult) {
      if (depositSecondPreviewUnavailable) return displayResult.maxFeeWei
      return null
    }
    return displayResult.maxFeeWei
  }, [
    displayResult,
    depositPreviewResult,
    dualGasComplete,
    twoStepDepositGasPreview,
    depositSecondPreviewUnavailable,
  ])

  const insufficientNative = Boolean(
    estimateSuccess &&
      nativeBalanceWei !== null &&
      !nearZeroEth &&
      totalMaxFeeWeiForNative !== null &&
      nativeBalanceWei < totalMaxFeeWeiForNative
  )

  const resolveMethod = useCallback((): "approve" | "deposit" | "depositWithAffiliate" | "withdraw" => {
    if (scenario === "withdraw") return "withdraw"
    if (depositApprovalExecution !== "skip") return "approve"
    return stakingDepositMethodForGas(userAddress)
  }, [scenario, depositApprovalExecution, userAddress])

  const prepareSubmit = useCallback(async (options?: Readonly<{
    /** Reuse frozen preview estimate when runtime target still matches (direct/retry). */
    useCachedIfFresh?: boolean
  }>): Promise<FinalGasSnapshot | null> => {
    if (!userAddress || !tokenAddress || stableAmountWei === null || !isAddress(userAddress)) {
      return null
    }

    const exp = expectedExecutionTarget
    const runtimeTarget = deriveRuntimeExecutionTarget(stakingRuntime)
    if (exp != null && !executionTargetEquals(runtimeTarget, exp)) {
      return null
    }

    if (options?.useCachedIfFresh && finalEstimate) {
      traceTxMobilePipeline("prepare_submit_cached", { scenario })
      return finalEstimate
    }

    if (pendingRef.current) await pendingRef.current

    bumpGeneration()
    const gen = generationRef.current
    setSubmitPhaseActive(true)

    if (exp != null && !executionTargetEquals(runtimeTarget, exp)) {
      setSubmitPhaseActive(false)
      return null
    }

    const addr = getAddress(userAddress)
    const tok = getAddress(tokenAddress)
    const method = resolveMethod()
    const approveEstWei =
      depositApprovalExecution === "unlimited_approve"
        ? MaxUint256
        : stableAmountWei
    const trace = devTraceId()
    const signal = abortRef.current?.signal

    const submitCoordinatorAtStart = transition.coordinatorSnapshot
    const r = await estimateStakingGasFee({
      method,
      amountWei: method === "approve" ? approveEstWei : stableAmountWei,
      userAddress: addr,
      tokenAddress: tok,
      vaultAddress,
      chainId: numericChainId,
      signer: signer ?? null,
      signal,
      forceRefresh: true,
      activityTtl: "idle",
      isValidForCache: () => gen === generationRef.current,
      traceId: DEBUG_LOGS ? trace : undefined,
      runtime: stakingRuntime,
    })

    if (
      !canRuntimeOperationCommitWithDevTrace(
        "useStakingGasEstimate:submit_afterEstimate",
        submitCoordinatorAtStart,
        latestCoordinatorSnapshotRef.current
      )
    ) {
      setSubmitPhaseActive(false)
      return null
    }

    if (!r) {
      setSubmitPhaseActive(false)
      return null
    }

    if (
      !canRuntimeOperationCommitWithDevTrace(
        "useStakingGasEstimate:submit_beforeFreeze",
        submitCoordinatorAtStart,
        latestCoordinatorSnapshotRef.current
      )
    ) {
      setSubmitPhaseActive(false)
      return null
    }

    const frozen: FinalGasSnapshot = Object.freeze({
      maxFeeWei: r.maxFeeWei,
      feeDisplayLine:
        scenario === "deposit"
          ? formatFeeLine(r, STAKING_DEPOSIT_GAS_FEE_TITLE)
          : formatFeeLine(r, STAKING_WITHDRAW_GAS_FEE_TITLE),
      feeExactEther: r.feeExactEther,
      congestionWarning: r.congestionWarning,
    })
    setFinalEstimate(frozen)
    return frozen
  }, [
    depositApprovalExecution,
    finalEstimate,
    formatFeeLine,
    numericChainId,
    resolveMethod,
    scenario,
    stakingRuntime,
    signer,
    stableAmountWei,
    tokenAddress,
    userAddress,
    vaultAddress,
    bumpGeneration,
    scenario,
    transition,
    expectedExecutionTarget,
    stakingRuntime,
  ])

  const endSubmitPhase = useCallback(() => {
    setSubmitPhaseActive(false)
    setFinalEstimate(null)
  }, [])

  const flushEstimate = useCallback(() => {
    bumpGeneration()
    void runEstimateRef.current(true, devTraceId())
  }, [bumpGeneration])

  // §19.14 + §20.6: adaptive idle revalidation cadence with three concurrency
  // guards. Subscribes to metrics so the interval recreates on tuning mode flip.
  // §20.2: derive cadence by tuningMode string (NEVER object-reference compare).
  const tuningSnapshot = useStakingGasMetrics()
  const idleCadenceMs = useMemo(() => {
    if (tuningSnapshot.tuningMode === "fast") return 5000
    if (tuningSnapshot.tuningMode === "slow") return 13000
    return 8000
  }, [tuningSnapshot.tuningMode])

  useEffect(() => {
    if (!enabled || !isValidContext || submitPhaseActive) return
    const id = setInterval(() => {
      // §20.6 — three guards in order. NO overlapping estimates.
      if (activityPhaseRef.current !== "idle") return
      if (submitPhaseActiveRef.current) return
      if (isEstimatingRef.current) return
      void runEstimateRef.current(true, devTraceId())
    }, idleCadenceMs)
    return () => clearInterval(id)
  }, [enabled, isValidContext, submitPhaseActive, idleCadenceMs])

  const titleExactWei = useMemo(() => {
    if (dualGasComplete && displayResult && depositPreviewResult) {
      return (displayResult.maxFeeWei + depositPreviewResult.maxFeeWei).toString()
    }
    return displayResult?.maxFeeWei?.toString() ?? ""
  }, [dualGasComplete, displayResult, depositPreviewResult])

  return {
    feeDisplayLine,
    /** Chainlink snapshot for smoothing / presentation-only reformat (no gas coupling). */
    ethUsdPresentation,
    feeExactEther,
    titleExactWei,
    gasFirstStepMaxFeeWei: displayResult?.maxFeeWei ?? null,
    gasSecondStepMaxFeeWei: depositPreviewResult?.maxFeeWei ?? null,
    depositSecondPreviewUnavailable,
    isEstimating,
    isRevalidating,
    hasEstimate,
    estimateSuccess,
    insufficientNative,
    /** Latest native (gas) token balance wei from RPC cache; null before first successful read. */
    nativeBalanceWei,
    nearZeroEth,
    feeSpikeWarning,
    highCongestionWarning:
      highCongestionWarning && Boolean(displayResult?.congestionWarning),
    estimateWarning,
    submitPhaseActive,
    finalEstimate,
    prepareSubmit,
    endSubmitPhase,
    flushEstimate,
    depositPreviewLine:
      depositApprovalExecution !== "skip" &&
      scenario === "deposit" &&
      depositPreviewResult
        ? formatFeeLine(depositPreviewResult, STAKING_DEPOSIT_GAS_FEE_TITLE)
        : null,
  }
}
