import type { ProfitManagerStatus } from "@/hooks/useProfitManagerStatus"
import {
  computeRollingStakedModel,
  parseIsoMs,
  resolveRollingWindowWithGrace,
  rollingRenderEpsilon,
  SETTLEMENT_GRACE_MS,
  type RollingBalanceCommittedWindow,
  type RollingStakedDisplayInput,
} from "@/lib/stakingRollingBalanceDisplay"
import { formatUnits } from "ethers"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react"

const DT_REFERENCE_MS = 1000 / 60
const DT_ANIM_CLAMP_MIN_MS = 1
const DT_ANIM_CLAMP_MAX_MS = 50
/** ~0.1 at 60fps reference for exponential smoothing toward `targetBase`. */
const K_BASE_SMOOTH = 0.1

function bigintToTokenFloat(value: bigint, tokenDecimals: number): number {
  if (value <= 0n) return 0
  try {
    const n = parseFloat(formatUnits(value, tokenDecimals))
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

function clampDtAnimation(dtMs: number): number {
  if (!Number.isFinite(dtMs)) return DT_ANIM_CLAMP_MIN_MS
  return Math.min(
    Math.max(dtMs, DT_ANIM_CLAMP_MIN_MS),
    DT_ANIM_CLAMP_MAX_MS
  )
}

function dtScaledAlphaToward(lerpFactor: number, dtMs: number): number {
  const f = Math.min(Math.max(lerpFactor, 1e-6), 0.95)
  const dt = clampDtAnimation(dtMs)
  return 1 - (1 - f) ** (dt / DT_REFERENCE_MS)
}

export type UseRollingStakedDisplayParams = {
  principalWei: bigint
  tokenDecimals: number | null
  profitStatus: ProfitManagerStatus
  serverOffsetMs: number
  /** Wallet connected, correct network, non-zero stake path. */
  isActive: boolean
  prefersReducedMotion: boolean
  animatedRef: MutableRefObject<number>
}

type RollingRefsBundle = {
  profitRef: MutableRefObject<ProfitManagerStatus>
  principalRef: MutableRefObject<bigint>
  offsetRef: MutableRefObject<number>
  decimalsRef: MutableRefObject<number | null>
  smoothedBaseRef: MutableRefObject<number>
  lastRafTsRef: MutableRefObject<number | null>
  committedWindowRef: MutableRefObject<RollingBalanceCommittedWindow | null>
  justBecameVisibleRef: MutableRefObject<boolean>
}

/**
 * Single-frame advance: grace-extended profit window until chain principal updates, then smoothing.
 * Reads/writes only refs (safe to call from rAF or layout).
 */
function advanceRollingFrame(
  r: RollingRefsBundle,
  nowRaf: number,
  opts: { forceDtMs?: number } = {}
): {
  safe: number
  targetBase: number
  dec: number
} {
  const dec = r.decimalsRef.current
  if (dec === null) {
    return { safe: 0, targetBase: 0, dec: 8 }
  }

  const p = r.profitRef.current
  const targetBase = bigintToTokenFloat(r.principalRef.current, dec)
  const serverTimeMs =
    performance.timeOrigin + performance.now() + r.offsetRef.current

  const apiLastMs = parseIsoMs(p.last_processed_at)
  const apiNextMs = parseIsoMs(p.next_profit_share_at)

  const resolved = resolveRollingWindowWithGrace({
    committed: r.committedWindowRef.current,
    profitLastIso: p.last_processed_at,
    profitNextIso: p.next_profit_share_at,
    apiLastMs,
    apiNextMs,
    principalWei: r.principalRef.current,
    serverTimeMs,
    graceMs: SETTLEMENT_GRACE_MS,
  })

  if (resolved.nextCommitted !== undefined) {
    r.committedWindowRef.current = resolved.nextCommitted
  }

  if (resolved.snapSmoothedBase) {
    r.smoothedBaseRef.current = targetBase
    r.lastRafTsRef.current = nowRaf
  }

  if (r.justBecameVisibleRef.current) {
    r.justBecameVisibleRef.current = false
    r.smoothedBaseRef.current = targetBase
    r.lastRafTsRef.current = nowRaf
  }

  const input: RollingStakedDisplayInput = {
    baseFloat: targetBase,
    apyPercentage: p.apy_percentage,
    shareIntervalSeconds: p.share_interval_seconds,
    lastProcessedAtIso: p.last_processed_at,
    nextProfitShareAtIso: p.next_profit_share_at,
    serverTimeMs,
    ...(resolved.windowLastMs != null && resolved.windowNextMs != null
      ? { windowLastMs: resolved.windowLastMs, windowNextMs: resolved.windowNextMs }
      : {}),
  }
  const model = computeRollingStakedModel(input)
  const rawProgress = model.rawProgress
  const rPeriod = model.rPeriod

  let dtMs =
    r.lastRafTsRef.current === null
      ? DT_ANIM_CLAMP_MIN_MS
      : nowRaf - r.lastRafTsRef.current
  r.lastRafTsRef.current = nowRaf
  dtMs = opts.forceDtMs ?? clampDtAnimation(dtMs)

  const sb0 = r.smoothedBaseRef.current
  let smoothedBase = sb0

  if (targetBase === 0) {
    smoothedBase = 0
  } else if (
    targetBase > 0 &&
    Math.abs(targetBase - smoothedBase) / targetBase > 0.01
  ) {
    smoothedBase = targetBase
  } else {
    const alpha = dtScaledAlphaToward(K_BASE_SMOOTH, dtMs)
    smoothedBase = smoothedBase + (targetBase - smoothedBase) * alpha
  }

  r.smoothedBaseRef.current = smoothedBase

  const smoothedPeriodProfit = smoothedBase * rPeriod
  const display = Math.min(
    smoothedBase + rawProgress * smoothedPeriodProfit,
    smoothedBase + smoothedPeriodProfit
  )

  const safe =
    Number.isFinite(display) && display >= 0 ? display : smoothedBase

  return { safe, targetBase, dec }
}

/**
 * rAF-driven rolling display with base smoothing, raw time progress, adaptive epsilon on state.
 */
export function useRollingStakedDisplayFloat({
  principalWei,
  tokenDecimals,
  profitStatus,
  serverOffsetMs,
  isActive,
  prefersReducedMotion,
  animatedRef,
}: UseRollingStakedDisplayParams): number {
  const [displayFloat, setDisplayFloat] = useState(0)

  const profitRef = useRef(profitStatus)
  const offsetRef = useRef(serverOffsetMs)
  const principalRef = useRef(principalWei)
  const decimalsRef = useRef(tokenDecimals)

  useEffect(() => {
    profitRef.current = profitStatus
  }, [profitStatus])
  useEffect(() => {
    offsetRef.current = serverOffsetMs
  }, [serverOffsetMs])
  useEffect(() => {
    principalRef.current = principalWei
  }, [principalWei])
  useEffect(() => {
    decimalsRef.current = tokenDecimals
  }, [tokenDecimals])

  const displayDecimals =
    tokenDecimals === null ? 8 : Math.max(tokenDecimals, 8)

  const smoothedBaseRef = useRef(0)
  const lastRafTsRef = useRef<number | null>(null)
  const committedWindowRef = useRef<RollingBalanceCommittedWindow | null>(null)
  const prevEmittedRef = useRef<number>(Number.NaN)
  const prevDecimalsForEpsilonRef = useRef(displayDecimals)
  const rafIdRef = useRef(0)
  const docVisibleRef = useRef(
    typeof document !== "undefined" && document.visibilityState === "visible"
  )
  const justBecameVisibleRef = useRef(false)

  const bundleRef = useRef<RollingRefsBundle | null>(null)
  if (bundleRef.current === null) {
    bundleRef.current = {
      profitRef,
      principalRef,
      offsetRef,
      decimalsRef,
      smoothedBaseRef,
      lastRafTsRef,
      committedWindowRef,
      justBecameVisibleRef,
    }
  }

  const emitIfNeeded = useCallback((display: number, decimals: number) => {
    const eps = rollingRenderEpsilon(decimals)
    if (
      !Number.isFinite(prevEmittedRef.current) ||
      Math.abs(display - prevEmittedRef.current) > eps
    ) {
      setDisplayFloat(display)
      prevEmittedRef.current = display
    }
  }, [])

  const advanceFrame = useCallback((nowRaf: number, opts?: { forceDtMs?: number }) => {
    const b = bundleRef.current!
    return advanceRollingFrame(b, nowRaf, opts)
  }, [])

  /** Reduced motion: same settlement + model as rAF path, one step per dep change. */
  useLayoutEffect(() => {
    if (!prefersReducedMotion) return
    if (!isActive || tokenDecimals === null) {
      smoothedBaseRef.current = 0
      lastRafTsRef.current = null
      prevEmittedRef.current = Number.NaN
      animatedRef.current = 0
      committedWindowRef.current = null
      setDisplayFloat(0)
      return
    }

    const nowRaf = performance.now()
    const { safe, dec } = advanceFrame(nowRaf, {
      forceDtMs: DT_ANIM_CLAMP_MIN_MS,
    })
    animatedRef.current = safe

    const decShown = Math.max(dec, 8)
    if (prevDecimalsForEpsilonRef.current !== decShown) {
      prevDecimalsForEpsilonRef.current = decShown
      prevEmittedRef.current = Number.NaN
    }
    emitIfNeeded(safe, decShown)
  }, [
    prefersReducedMotion,
    isActive,
    tokenDecimals,
    principalWei,
    profitStatus.apy_percentage,
    profitStatus.share_interval_seconds,
    profitStatus.last_processed_at,
    profitStatus.next_profit_share_at,
    serverOffsetMs,
    displayDecimals,
    animatedRef,
    emitIfNeeded,
    advanceFrame,
  ])

  useEffect(() => {
    if (prefersReducedMotion) return

    if (!isActive || tokenDecimals === null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = 0
      smoothedBaseRef.current = 0
      lastRafTsRef.current = null
      committedWindowRef.current = null
      prevEmittedRef.current = Number.NaN
      animatedRef.current = 0
      setDisplayFloat(0)
      return
    }

    const tick = (nowRaf: number) => {
      const dec = decimalsRef.current
      if (dec === null) {
        if (docVisibleRef.current) {
          rafIdRef.current = requestAnimationFrame(tick)
        } else {
          rafIdRef.current = 0
        }
        return
      }

      const { safe } = advanceFrame(nowRaf)

      animatedRef.current = safe

      const decShown = Math.max(dec, 8)
      if (prevDecimalsForEpsilonRef.current !== decShown) {
        prevDecimalsForEpsilonRef.current = decShown
        prevEmittedRef.current = Number.NaN
      }
      emitIfNeeded(safe, decShown)

      if (docVisibleRef.current) {
        rafIdRef.current = requestAnimationFrame(tick)
      } else {
        rafIdRef.current = 0
      }
    }

    const scheduleTick = () => {
      if (!docVisibleRef.current) return
      rafIdRef.current = requestAnimationFrame(tick)
    }

    const onVis = () => {
      const visible = document.visibilityState === "visible"
      if (visible && !docVisibleRef.current) {
        justBecameVisibleRef.current = true
      }
      docVisibleRef.current = visible
      if (!visible) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = 0
      } else {
        scheduleTick()
      }
    }
    document.addEventListener("visibilitychange", onVis)
    docVisibleRef.current = document.visibilityState === "visible"
    scheduleTick()

    return () => {
      document.removeEventListener("visibilitychange", onVis)
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = 0
    }
  }, [
    isActive,
    tokenDecimals,
    displayDecimals,
    prefersReducedMotion,
    animatedRef,
    emitIfNeeded,
    advanceFrame,
  ])

  return displayFloat
}
