import {
  buildNetworkFeeDisplayLine,
  ethUsdPresentationKey,
} from "@/staking/execution"
import {
  getStakingGasMetricsSnapshot,
  getStakingGasTuning,
  useStakingGasMetrics,
} from "@/lib/stakingGasMetrics"
import { logger } from "@/lib/logger"
import {
  useStakingGasEstimate,
  type UseStakingGasEstimateOptions,
} from "@/hooks/useStakingGasEstimate"
import { parseUnits } from "ethers"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const SMALL_DELTA_WEI_CUTOFF = 100_000_000_000n

function absBigInt(x: bigint): bigint {
  return x < 0n ? -x : x
}

/**
 * §20.1: Convert the upstream `feeExactEther` decimal-string to wei via
 * `parseUnits(exact, 18)`. NO float math (no Math.round, no `* 1e10`).
 */
function feeExactEtherToWei(exact: string): bigint | null {
  const trimmed = exact.trim()
  if (!trimmed) return null
  const stripped = trimmed.replace(/^~/, "").trim()
  if (!stripped || stripped === "0" || stripped === "0.0") return null
  try {
    return parseUnits(stripped, 18)
  } catch {
    return null
  }
}

export type UseStakingFeeDisplaySmoothingResult = ReturnType<
  typeof useStakingGasEstimate
>

/**
 * Anti-flicker / anti-jitter / interpolated smoothing wrapper around
 * `useStakingGasEstimate`. Returns the same shape, but `feeDisplayLine` is
 * the smoothed string. The row component remains the single-source consumer
 * (§16.7 / §17.0 contract preserved).
 *
 * USD / ETH presentation strings are built only via `buildNetworkFeeDisplayLine`.
 * Chainlink updates reformat the current smoothed wei **without** resetting rAF
 * targets (presentation-only; refs hold the latest `ethUsdPresentation`).
 */
export function useStakingFeeDisplaySmoothing(
  options: UseStakingGasEstimateOptions
): UseStakingFeeDisplaySmoothingResult {
  const upstream = useStakingGasEstimate(options)

  const metrics = useStakingGasMetrics()
  const tuning = getStakingGasTuning()
  const tuningRef = useRef(tuning)
  tuningRef.current = tuning

  /** Latest Chainlink snapshot for bigint-safe USD suffix (updated outside rAF). */
  const ethUsdRef = useRef(upstream.ethUsdPresentation)
  ethUsdRef.current = upstream.ethUsdPresentation

  const targetWeiRef = useRef<bigint | null>(null)
  const currentWeiRef = useRef<bigint | null>(null)
  const lastStableTargetWeiRef = useRef<bigint | null>(null)
  const lastCommitTsRef = useRef<number>(0)
  const pendingTargetWeiRef = useRef<bigint | null>(null)
  const pendingCommitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const rafRef = useRef<number | null>(null)
  const submitFrozenRef = useRef<boolean>(false)
  /** §20.5: sticky last formatted fee, used as the preferred null-upstream fallback. */
  const lastFormattedRef = useRef<string>("")

  const [smoothedLine, setSmoothedLine] = useState<string>(upstream.feeDisplayLine)

  const upstreamMaxFeeWei = useMemo<bigint | null>(
    () => feeExactEtherToWei(upstream.feeExactEther),
    [upstream.feeExactEther]
  )

  const ethUsdKey = useMemo(
    () => ethUsdPresentationKey(upstream.ethUsdPresentation),
    [upstream.ethUsdPresentation]
  )

  // §17.5 / §20.4: handle submit-freeze state changes.
  useEffect(() => {
    if (upstream.submitPhaseActive) {
      submitFrozenRef.current = true
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (pendingCommitTimeoutRef.current !== null) {
        clearTimeout(pendingCommitTimeoutRef.current)
        pendingCommitTimeoutRef.current = null
      }
      pendingTargetWeiRef.current = null
      return
    }
    if (submitFrozenRef.current) {
      submitFrozenRef.current = false
      lastStableTargetWeiRef.current = null
    }
  }, [upstream.submitPhaseActive])

  const formatAndCommitFromCurrent = useCallback((): void => {
    try {
      const cur = currentWeiRef.current
      if (cur === null) return
      const next = buildNetworkFeeDisplayLine({
        maxFeeWei: cur,
        ethUsd: ethUsdRef.current,
      })
      if (next !== lastFormattedRef.current) {
        lastFormattedRef.current = next
        setSmoothedLine(next)
      }
    } catch (e) {
      logger.warn("[stakingFeeSmoothing] format error", e)
    }
  }, [])

  // Presentation-only: Chainlink tick updates USD suffix without touching wei targets.
  useEffect(() => {
    if (submitFrozenRef.current) return
    if (currentWeiRef.current === null) return
    formatAndCommitFromCurrent()
  }, [ethUsdKey, formatAndCommitFromCurrent])

  const startRafLoop = useCallback((): void => {
    if (rafRef.current !== null) return
    const tick = () => {
      try {
        const target = targetWeiRef.current
        const current = currentWeiRef.current
        if (target === null || current === null) {
          rafRef.current = null
          return
        }
        if (target === current) {
          rafRef.current = null
          return
        }

        const tCfg = tuningRef.current
        const delta = target - current
        const absDelta = absBigInt(delta)
        const baseRef = current === 0n ? 1n : current
        const absRef = absBigInt(baseRef) || 1n
        const relativeBps = (absDelta * 10000n) / absRef

        const baseAlpha =
          relativeBps < 500n ? tCfg.alphaSmall : tCfg.alphaLarge

        const isSlow =
          getStakingGasMetricsSnapshot().tuningMode === "slow"
        const downwardDivisor = isSlow ? 3 : 2
        const effectiveAlphaBps =
          target < current
            ? Math.max(1, Math.floor(baseAlpha / downwardDivisor))
            : baseAlpha

        const step = (delta * BigInt(effectiveAlphaBps)) / 10000n
        if (step === 0n && delta !== 0n) {
          currentWeiRef.current = target
        } else {
          currentWeiRef.current = current + step
        }

        const curAfter = currentWeiRef.current
        if (curAfter !== null) {
          try {
            const next = buildNetworkFeeDisplayLine({
              maxFeeWei: curAfter,
              ethUsd: ethUsdRef.current,
            })
            if (next !== lastFormattedRef.current) {
              lastFormattedRef.current = next
              queueMicrotask(() => {
                setSmoothedLine(next)
              })
            }
          } catch (e) {
            logger.warn("[stakingFeeSmoothing] format error", e)
          }
        }

        if (currentWeiRef.current === target) {
          rafRef.current = null
          return
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch (e) {
        logger.warn("[stakingFeeSmoothing] tick error", e)
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const commitTarget = useCallback(
    (nextTarget: bigint): void => {
      targetWeiRef.current = nextTarget
      if (currentWeiRef.current === null) {
        currentWeiRef.current = nextTarget
        formatAndCommitFromCurrent()
        return
      }
      if (currentWeiRef.current === nextTarget) {
        formatAndCommitFromCurrent()
        return
      }
      startRafLoop()
    },
    [formatAndCommitFromCurrent, startRafLoop]
  )

  const scheduleAcceptedTarget = useCallback(
    (accepted: bigint): void => {
      const tCfg = tuningRef.current
      const now = performance.now()
      const elapsed = now - lastCommitTsRef.current
      if (elapsed >= tCfg.minDisplayMs) {
        lastCommitTsRef.current = now
        commitTarget(accepted)
        return
      }
      pendingTargetWeiRef.current = accepted
      if (pendingCommitTimeoutRef.current !== null) return
      const wait = tCfg.minDisplayMs - elapsed
      pendingCommitTimeoutRef.current = setTimeout(() => {
        pendingCommitTimeoutRef.current = null
        const queued = pendingTargetWeiRef.current
        pendingTargetWeiRef.current = null
        if (queued === null) return
        lastCommitTsRef.current = performance.now()
        commitTarget(queued)
      }, wait)
    },
    [commitTarget]
  )

  useEffect(() => {
    if (upstreamMaxFeeWei === null) return

    if (submitFrozenRef.current) {
      targetWeiRef.current = upstreamMaxFeeWei
      return
    }

    const last = lastStableTargetWeiRef.current
    const tCfg = tuningRef.current

    if (last === null) {
      lastStableTargetWeiRef.current = upstreamMaxFeeWei
      currentWeiRef.current = upstreamMaxFeeWei
      targetWeiRef.current = upstreamMaxFeeWei
      lastCommitTsRef.current = performance.now()
      formatAndCommitFromCurrent()
      return
    }

    const delta = absBigInt(upstreamMaxFeeWei - last)
    const baseRef = last === 0n ? 1n : last
    const relativeBps = (delta * 10000n) / absBigInt(baseRef)

    const suppress =
      relativeBps < BigInt(tCfg.smoothingThresholdBps) &&
      delta < SMALL_DELTA_WEI_CUTOFF

    if (suppress) return

    lastStableTargetWeiRef.current = upstreamMaxFeeWei
    scheduleAcceptedTarget(upstreamMaxFeeWei)
  }, [upstreamMaxFeeWei, formatAndCommitFromCurrent, scheduleAcceptedTarget])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (pendingCommitTimeoutRef.current !== null) {
        clearTimeout(pendingCommitTimeoutRef.current)
        pendingCommitTimeoutRef.current = null
      }
    }
  }, [])

  const effectiveLine = (() => {
    if (upstream.submitPhaseActive && upstream.finalEstimate)
      return upstream.finalEstimate.feeDisplayLine
    if (upstream.nearZeroEth)
      return upstream.feeDisplayLine || lastFormattedRef.current || ""
    if (upstreamMaxFeeWei === null) {
      return lastFormattedRef.current || upstream.feeDisplayLine
    }
    return smoothedLine || upstream.feeDisplayLine
  })()

  void metrics

  return {
    ...upstream,
    feeDisplayLine: effectiveLine,
  }
}
