import { cn } from "@/lib/utils"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

function trimTrailingZeros(s: string) {
  if (!s.includes(".")) return s
  return s.replace(/\.?0+$/, "") || "0"
}

function formatTokenAmount(n: number, decimals: number) {
  if (!Number.isFinite(n) || n <= 0) return "0"
  return trimTrailingZeros(n.toFixed(decimals))
}

/** Fractional slot count: keep all `decimals` columns while `toFixed` has any non-zero frac (stable rolling). */
function fracSlotCount(v: number, decimals: number) {
  if (!Number.isFinite(v) || v <= 0) return 0
  const frac = v.toFixed(decimals).split(".")[1] ?? ""
  if (frac.length === 0 || /^0+$/.test(frac)) return 0
  return decimals
}

function layoutFromValue(v: number, decimals: number) {
  const v0 = Math.max(0, v)
  const iv = Math.floor(v0)
  const intPlaces = iv === 0 ? 1 : Math.floor(Math.log10(iv)) + 1
  const fracSlots = fracSlotCount(v0, decimals)
  return { intPlaces, fracSlots }
}

const DIGIT_STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const STRIP_MAX_SCROLL = DIGIT_STRIP.length - 1

/** ~60fps reference for exponential smoothing from per-frame lerp factors */
const DT_REFERENCE_MS = 1000 / 60
const DT_MS_MIN = 1
const DT_MS_MAX = 72

/** Max scroll-index motion per frame (after long `dt`, e.g. returning from a hidden tab) */
const MAX_STRIP_STEP_PER_FRAME = 2.75

/** Per-digit snap in strip units (1 == one digit height) */
const SNAP_THRESHOLD_STRIP = 2.2e-4

/** Skip writing transform when scroll value barely changed */
const DOM_WRITE_EPSILON = 4e-5

function lerpFactorFromStripDelta(delta: number): number {
  const d = Math.abs(delta)
  if (d >= 2) return 0.2
  if (d <= 0.3) return 0.032
  const u = (d - 0.3) / (2 - 0.3)
  return 0.032 + u * (0.09 - 0.032)
}

function dtScaledAlpha(lerpFactor: number, dtMs: number): number {
  const f = Math.min(Math.max(lerpFactor, 1e-6), 0.95)
  const dt = Math.min(Math.max(dtMs, DT_MS_MIN), DT_MS_MAX)
  return 1 - (1 - f) ** (dt / DT_REFERENCE_MS)
}

function targetMotionEpsilon(v: number, decimals: number): number {
  return Math.max(1e-12, Math.abs(v) * 1e-12, 10 ** (-decimals - 2))
}

/** Vertical fade at top/bottom so digits ease out instead of snapping on a hard clip line. */
const rollColumnMask: CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
  maskImage:
    "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
}

const digitColumnShell =
  "inline-block h-[1em] min-w-[1ch] overflow-hidden align-baseline rounded-[2px]"

const ROLLING_AMOUNT_PREFIX = "$"

function pickDigitScrollTarget(cur: number, t: number): number {
  const a = t
  const b = t + 10
  const candidates = [a, b].filter((x) => x >= 0 && x <= STRIP_MAX_SCROLL)
  let best = candidates[0] ?? t
  let bestD = Math.abs(best - cur)
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i]!
    const d = Math.abs(c - cur)
    if (d < bestD) {
      best = c
      bestD = d
    }
  }
  return best
}

function stepRollingDigit(
  cur: number,
  t: number,
  dtMs: number,
  snapThreshold: number
): number {
  while (cur >= 10) cur -= 10
  while (cur < 0) cur += 10

  const targetScroll = pickDigitScrollTarget(cur, t)
  const rawDelta = Math.abs(targetScroll - cur)
  const factor = lerpFactorFromStripDelta(rawDelta)
  let alpha = dtScaledAlpha(factor, dtMs)
  if (rawDelta > 1e-9) {
    const maxAlpha = MAX_STRIP_STEP_PER_FRAME / rawDelta
    if (alpha > maxAlpha) alpha = maxAlpha
  }

  let nv = cur + (targetScroll - cur) * alpha
  if (Math.abs(nv - targetScroll) < snapThreshold) {
    nv = targetScroll
    while (nv >= 10) nv -= 10
  }
  return nv
}

/** Exact strip scroll for digit `t`, shortest shift from current visual `cur`. */
function snapDigitScrollToTarget(cur: number | undefined, t: number): number {
  const c0 = cur === undefined ? t : cur
  let ts = pickDigitScrollTarget(c0, t)
  while (ts >= 10) ts -= 10
  while (ts < 0) ts += 10
  return ts
}

function digitScrollSettled(
  cur: number | undefined,
  t: number,
  snapThreshold: number
): boolean {
  if (cur === undefined) return true
  let c = cur
  while (c >= 10) c -= 10
  while (c < 0) c += 10
  const targetScroll = pickDigitScrollTarget(c, t)
  return Math.abs(c - targetScroll) < snapThreshold
}

type RollingTokenAmountProps = {
  valueRef: React.MutableRefObject<number>
  principalFloat: number
  decimals: number
  className?: string
  active: boolean
  reducedMotion: boolean
  staticValue?: number
  resetKey: string
}

export function RollingTokenAmount({
  valueRef,
  principalFloat,
  decimals,
  className,
  active,
  reducedMotion,
  staticValue,
  resetKey,
}: RollingTokenAmountProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const visualsRef = useRef<Map<string, number>>(new Map())
  const innerStripRefs = useRef<Map<string, HTMLSpanElement>>(new Map())
  const lastDomVisRef = useRef<Map<string, number>>(new Map())
  const lastSignificantTargetRef = useRef<number>(Number.NaN)
  const dotRef = useRef<HTMLSpanElement | null>(null)
  const rafRef = useRef(0)

  const [layout, setLayout] = useState(() =>
    layoutFromValue(Math.max(0, principalFloat), decimals)
  )
  const layoutRef = useRef(layout)
  const [isVisible, setIsVisible] = useState(true)
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => document.visibilityState === "visible")

  const registerStrip = useCallback((key: string) => (el: HTMLSpanElement | null) => {
    if (el) innerStripRefs.current.set(key, el)
    else innerStripRefs.current.delete(key)
  }, [])

  /**
   * Only reset digit scroll state when the semantic identity of the display
   * changes (`resetKey` / `decimals`). Clearing on every `principalFloat` tick
   * snaps digits to targets and kills smooth rolling (e.g. 1 → 6 jumps).
   * Ongoing layout changes follow `valueRef` inside the RAF loop.
   */
  useEffect(() => {
    visualsRef.current.clear()
    lastDomVisRef.current.clear()
    lastSignificantTargetRef.current = Number.NaN
    const nextLayout = layoutFromValue(Math.max(0, principalFloat), decimals)
    layoutRef.current = nextLayout
    setLayout(nextLayout)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- principalFloat intentionally omitted; see block comment above.
  }, [resetKey, decimals])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !("IntersectionObserver" in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(Boolean(entry?.isIntersecting)),
      { rootMargin: "120px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const syncDocumentVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible")
    }

    document.addEventListener("visibilitychange", syncDocumentVisibility)
    return () => document.removeEventListener("visibilitychange", syncDocumentVisibility)
  }, [])

  useEffect(() => {
    if (!active || reducedMotion || !isVisible || !isDocumentVisible) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    let lastTickAt = performance.now()

    const clampVis = (x: number) =>
      Math.min(STRIP_MAX_SCROLL + 0.999, Math.max(0, x))

    const applyStripTransform = (key: string, visRaw: number) => {
      const el = innerStripRefs.current.get(key)
      if (!el) return
      const vis = clampVis(visRaw)
      const prev = lastDomVisRef.current.get(key)
      if (prev !== undefined && Math.abs(vis - prev) < DOM_WRITE_EPSILON) {
        return
      }
      lastDomVisRef.current.set(key, vis)
      el.style.transform = `translate3d(0, calc(-1em * ${vis}), 0)`
    }

    const tick = (now: number) => {
      const dtMs = Math.min(Math.max(now - lastTickAt, DT_MS_MIN), DT_MS_MAX)
      lastTickAt = now

      const v = Math.max(0, valueRef.current)
      const iv = Math.floor(v)
      const intPlaces = iv === 0 ? 1 : Math.floor(Math.log10(iv)) + 1
      const fracSlots = fracSlotCount(v, decimals)
      const currentLayout = layoutRef.current

      if (
        currentLayout.intPlaces !== intPlaces ||
        currentLayout.fracSlots !== fracSlots
      ) {
        const nextLayout = { intPlaces, fracSlots }
        layoutRef.current = nextLayout
        setLayout(nextLayout)
      }

      if (dotRef.current) {
        dotRef.current.style.display = fracSlots > 0 ? "" : "none"
      }

      const visuals = visualsRef.current
      const lastSig = lastSignificantTargetRef.current
      const tEps = targetMotionEpsilon(v, decimals)
      const micro =
        Number.isFinite(lastSig) && Math.abs(v - lastSig) < tEps

      if (micro) {
        for (let k = 0; k < intPlaces; k++) {
          const key = `i${k}`
          const t = Math.floor(iv / 10 ** k) % 10
          visuals.set(key, snapDigitScrollToTarget(visuals.get(key), t))
        }
        for (const key of [...visuals.keys()]) {
          if (key.startsWith("i")) {
            const kk = Number(key.slice(1))
            if (kk >= intPlaces) {
              visuals.delete(key)
              lastDomVisRef.current.delete(key)
            }
          }
        }
        const frac = v - iv
        for (let j = 1; j <= fracSlots; j++) {
          const key = `f${j}`
          const t = Math.floor(frac * 10 ** j) % 10
          visuals.set(key, snapDigitScrollToTarget(visuals.get(key), t))
        }
        for (const key of [...visuals.keys()]) {
          if (key.startsWith("f")) {
            const jj = Number(key.slice(1))
            if (jj > fracSlots) {
              visuals.delete(key)
              lastDomVisRef.current.delete(key)
            }
          }
        }
        for (let k = intPlaces - 1; k >= 0; k--) {
          const key = `i${k}`
          applyStripTransform(key, visuals.get(key) ?? 0)
        }
        for (let j = 1; j <= fracSlots; j++) {
          const key = `f${j}`
          applyStripTransform(key, visuals.get(key) ?? 0)
        }
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      for (let k = 0; k < intPlaces; k++) {
        const key = `i${k}`
        const t = Math.floor(iv / 10 ** k) % 10
        let cur = visuals.get(key)
        if (cur === undefined) cur = t
        visuals.set(key, stepRollingDigit(cur, t, dtMs, SNAP_THRESHOLD_STRIP))
      }
      for (const key of [...visuals.keys()]) {
        if (key.startsWith("i")) {
          const kk = Number(key.slice(1))
          if (kk >= intPlaces) {
            visuals.delete(key)
            lastDomVisRef.current.delete(key)
          }
        }
      }

      const frac = v - iv
      for (let j = 1; j <= fracSlots; j++) {
        const key = `f${j}`
        const t = Math.floor(frac * 10 ** j) % 10
        let cur = visuals.get(key)
        if (cur === undefined) cur = t
        visuals.set(key, stepRollingDigit(cur, t, dtMs, SNAP_THRESHOLD_STRIP))
      }
      for (const key of [...visuals.keys()]) {
        if (key.startsWith("f")) {
          const jj = Number(key.slice(1))
          if (jj > fracSlots) {
            visuals.delete(key)
            lastDomVisRef.current.delete(key)
          }
        }
      }

      for (let k = intPlaces - 1; k >= 0; k--) {
        const key = `i${k}`
        applyStripTransform(key, visuals.get(key) ?? 0)
      }
      for (let j = 1; j <= fracSlots; j++) {
        const key = `f${j}`
        applyStripTransform(key, visuals.get(key) ?? 0)
      }

      let allSettled = true
      for (let k = 0; k < intPlaces; k++) {
        const key = `i${k}`
        const t = Math.floor(iv / 10 ** k) % 10
        if (!digitScrollSettled(visuals.get(key), t, SNAP_THRESHOLD_STRIP)) {
          allSettled = false
          break
        }
      }
      if (allSettled) {
        for (let j = 1; j <= fracSlots; j++) {
          const key = `f${j}`
          const t = Math.floor(frac * 10 ** j) % 10
          if (!digitScrollSettled(visuals.get(key), t, SNAP_THRESHOLD_STRIP)) {
            allSettled = false
            break
          }
        }
      }
      if (allSettled) {
        lastSignificantTargetRef.current = v
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, reducedMotion, isVisible, isDocumentVisible, decimals, valueRef, resetKey])

  if (!active) {
    return (
      <span className={cn(className)}>
        {ROLLING_AMOUNT_PREFIX}0
      </span>
    )
  }

  if (reducedMotion) {
    const v = staticValue ?? valueRef.current
    return (
      <span className={cn(className)}>
        {ROLLING_AMOUNT_PREFIX}
        {formatTokenAmount(v, decimals)}
      </span>
    )
  }

  const { intPlaces, fracSlots } = layout

  const cols: ReactNode[] = []
  for (let k = intPlaces - 1; k >= 0; k--) {
    const key = `i${k}`
    cols.push(
      <span
        key={key}
        className={digitColumnShell}
        style={rollColumnMask}
        aria-hidden
      >
        <span
          ref={registerStrip(key)}
          className='block will-change-transform'
          style={{ transform: "translate3d(0,0,0)" }}
        >
          {DIGIT_STRIP.map((d, idx) => (
            <span
              key={`${key}-${idx}`}
              className='flex h-[1em] items-center justify-center leading-none tabular-nums'
            >
              {d}
            </span>
          ))}
        </span>
      </span>
    )
  }

  if (fracSlots > 0) {
    cols.push(
      <span
        key='dot'
        ref={(el) => {
          dotRef.current = el
        }}
        className='mx-px inline align-baseline'
        aria-hidden
      >
        .
      </span>
    )
    for (let j = 1; j <= fracSlots; j++) {
      const key = `f${j}`
      cols.push(
        <span
          key={key}
          className={digitColumnShell}
          style={rollColumnMask}
          aria-hidden
        >
          <span
            ref={registerStrip(key)}
            className='block will-change-transform'
            style={{ transform: "translate3d(0,0,0)" }}
          >
            {DIGIT_STRIP.map((d, idx) => (
              <span
                key={`${key}-${idx}`}
                className='flex h-[1em] items-center justify-center leading-none tabular-nums'
              >
                {d}
              </span>
            ))}
          </span>
        </span>
      )
    }
  }

  return (
    <span
      ref={containerRef}
      className={cn("inline-flex items-baseline", className)}
      aria-live='off'
    >
      <span className="inline align-baseline" aria-hidden>
        {ROLLING_AMOUNT_PREFIX}
      </span>
      {cols}
    </span>
  )
}
