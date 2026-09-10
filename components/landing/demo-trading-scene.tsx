"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { BriefcaseIcon, CheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TICKET = [
  { label: "Side", value: "Long" },
  { label: "Size", value: "0.35 ETH" },
  { label: "Stop", value: "3,412" },
  { label: "Target", value: "3,520" },
] as const

const MARK_STEPS = ["3,468.2", "3,512.4", "3,551.8"] as const
const PNL_STEPS = [0, 0.84, 1.62, 2.41] as const

type Point = { x: number; y: number }

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }
    const id = window.setTimeout(() => resolve(), ms)
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id)
        reject(new DOMException("Aborted", "AbortError"))
      },
      { once: true }
    )
  })
}

function centerIn(root: HTMLElement, el: HTMLElement | null): Point {
  if (!el) return { x: 40, y: 40 }
  const a = root.getBoundingClientRect()
  const b = el.getBoundingClientRect()
  return {
    x: b.left - a.left + b.width / 2,
    y: b.top - a.top + b.height / 2,
  }
}

function DemoCursor({
  point,
  clicking,
  visible,
}: {
  point: Point
  clicking: boolean
  visible: boolean
}) {
  if (!visible) return null
  return (
    <motion.div
      className="pointer-events-none absolute top-0 left-0 z-30 hidden sm:block"
      animate={{
        x: point.x,
        y: point.y,
        scale: clicking ? 0.86 : 1,
      }}
      transition={{
        x: { type: "spring", stiffness: 90, damping: 28, mass: 1.05 },
        y: { type: "spring", stiffness: 90, damping: 28, mass: 1.05 },
        scale: { duration: 0.22 },
      }}
      style={{ marginLeft: -2, marginTop: -2 }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-sm"
        aria-hidden
      >
        <path
          d="M5.5 3.5L19 12.2L12.4 13.5L9.8 20.5L5.5 3.5Z"
          className="fill-foreground stroke-background"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  )
}

function MiniChart({ signalOn }: { signalOn: boolean }) {
  const t = useTranslations("landing.scenes")
  const candles = [
    { x: 20, open: 56, close: 50, high: 46, low: 60 },
    { x: 40, open: 50, close: 44, high: 40, low: 54 },
    { x: 60, open: 44, close: 48, high: 42, low: 52 },
    { x: 80, open: 48, close: 40, high: 36, low: 52 },
    { x: 100, open: 40, close: 34, high: 30, low: 46 },
    { x: 120, open: 34, close: 38, high: 32, low: 42 },
    { x: 140, open: 38, close: 32, high: 28, low: 42 },
  ]

  return (
    <div className="relative h-[5.5rem] shrink-0 overflow-hidden border-b border-border/60 bg-muted/15">
      <svg viewBox="0 0 160 64" className="absolute inset-0 size-full" aria-hidden>
        {[18, 34, 50].map((y) => (
          <line
            key={y}
            x1="8"
            x2="152"
            y1={y}
            y2={y}
            className="stroke-border/45"
            strokeWidth="0.5"
          />
        ))}
        {candles.map((c) => {
          const bodyTop = Math.min(c.open, c.close)
          const bodyH = Math.max(Math.abs(c.close - c.open), 2)
          const up = c.close <= c.open
          return (
            <g key={c.x}>
              <line
                x1={c.x}
                x2={c.x}
                y1={c.high}
                y2={c.low}
                className="stroke-foreground/20"
                strokeWidth="1"
              />
              <rect
                x={c.x - 4}
                y={bodyTop}
                width="8"
                height={bodyH}
                className={cn(
                  "fill-foreground",
                  up ? "opacity-30" : "opacity-14"
                )}
                rx="0.5"
              />
            </g>
          )
        })}
        <line
          x1="8"
          x2="152"
          y1="40"
          y2="40"
          className="stroke-foreground/50"
          strokeWidth="1"
          strokeDasharray="3 2"
          style={{ opacity: signalOn ? 1 : 0 }}
        />
        <circle
          cx="100"
          cy="36"
          r="3"
          className="fill-foreground"
          style={{ opacity: signalOn ? 1 : 0 }}
        />
      </svg>
      <Badge
        variant={signalOn ? "default" : "secondary"}
        className={cn(
          "absolute top-2 right-2 rounded-full px-2 py-0 text-[9px] font-medium transition-opacity duration-300",
          signalOn ? "opacity-100" : "opacity-0"
        )}
      >
        {t("irisLong")}
      </Badge>
    </div>
  )
}

function TicketField({
  label,
  value,
  filled,
}: {
  label: string
  value: string
  filled: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1.5 transition-colors duration-300",
        filled
          ? "border-border/55 bg-muted/30"
          : "border-border/40 bg-muted/15"
      )}
    >
      <dt className="text-[8px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 h-3.5 font-mono text-[11px] font-semibold tabular-nums text-foreground">
        {filled ? (
          value
        ) : (
          <span className="inline-block h-2.5 w-10 rounded-sm bg-foreground/8" />
        )}
      </dd>
    </div>
  )
}

export function DemoTradingScene() {
  const t = useTranslations("landing.scenes")
  const common = useTranslations("common")
  const reduceMotion = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const buyRef = React.useRef<HTMLSpanElement>(null)

  const [onScreen, setOnScreen] = React.useState(false)
  const [loop, setLoop] = React.useState(0)
  const [cursor, setCursor] = React.useState<Point>({ x: 48, y: 36 })
  const [cursorOn, setCursorOn] = React.useState(false)
  const [clicking, setClicking] = React.useState(false)
  const [signalOn, setSignalOn] = React.useState(false)
  const [filledCount, setFilledCount] = React.useState(0)
  const [placing, setPlacing] = React.useState(false)
  const [filled, setFilled] = React.useState(false)
  const [positionOn, setPositionOn] = React.useState(false)
  const [pnlIndex, setPnlIndex] = React.useState(0)
  const [markIndex, setMarkIndex] = React.useState(0)

  const still = reduceMotion === true
  const showSignal = still || signalOn
  const showFilled = still || filled
  const showPosition = still || positionOn
  const showCursor = !still && cursorOn

  const pnl = still ? PNL_STEPS[PNL_STEPS.length - 1] : (PNL_STEPS[pnlIndex] ?? 0)
  const mark = still ? MARK_STEPS[MARK_STEPS.length - 1] : (MARK_STEPS[markIndex] ?? MARK_STEPS[0])
  const ticketFilled = still ? TICKET.length : filledCount

  React.useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.35 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const moveTo = React.useEffectEvent(
    async (el: HTMLElement | null, signal: AbortSignal) => {
      const root = rootRef.current
      if (!root) return
      setCursorOn(true)
      setCursor(centerIn(root, el))
      await wait(1000, signal)
    }
  )

  const clickAt = React.useEffectEvent(async (signal: AbortSignal) => {
    setClicking(true)
    await wait(220, signal)
    setClicking(false)
    await wait(180, signal)
  })

  React.useEffect(() => {
    if (still || !onScreen) return
    const ac = new AbortController()
    const { signal } = ac

    async function play() {
      try {
        setSignalOn(false)
        setFilledCount(0)
        setPlacing(false)
        setFilled(false)
        setPositionOn(false)
        setPnlIndex(0)
        setMarkIndex(0)
        setClicking(false)
        setCursorOn(false)

        await wait(700, signal)
        setSignalOn(true)
        await wait(800, signal)

        for (let i = 1; i <= TICKET.length; i++) {
          setFilledCount(i)
          await wait(340, signal)
        }

        await wait(400, signal)
        await moveTo(buyRef.current, signal)
        await clickAt(signal)
        setPlacing(true)
        await wait(700, signal)
        setPlacing(false)
        setFilled(true)
        setCursorOn(false)

        await wait(400, signal)
        setPositionOn(true)

        for (let i = 1; i < PNL_STEPS.length; i++) {
          setPnlIndex(i)
          setMarkIndex(Math.min(i, MARK_STEPS.length - 1))
          await wait(500, signal)
        }

        await wait(3000, signal)
        setLoop((n) => n + 1)
      } catch {
        /* aborted */
      }
    }

    void play()
    return () => ac.abort()
  }, [loop, onScreen, still])

  const positionLabel = showPosition ? "Long 0.35 ETH" : "—"
  const pnlLabel = showPosition ? `+${pnl.toFixed(2)}%` : "—"
  const markLabel = showPosition ? mark : "—"

  return (
    <div
      ref={rootRef}
      data-reveal
      className="relative mx-auto w-full max-w-88"
      aria-hidden
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[4%] -z-10 rounded-[2.5rem] bg-foreground/14 opacity-55 blur-3xl dark:bg-foreground/22"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[10%] -z-10 rounded-[2rem] bg-foreground/18 opacity-60 blur-2xl dark:bg-foreground/28"
      />

      <DemoCursor point={cursor} clicking={clicking} visible={showCursor} />

      <div
        className={cn(
          "relative overflow-hidden rounded-[1.75rem]",
          "bg-card/80 text-card-foreground backdrop-blur-md",
          "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_18px_40px_-18px_rgba(0,0,0,0.28)]",
          "dark:shadow-[0_2px_10px_-2px_rgba(255,255,255,0.06),0_20px_48px_-16px_rgba(255,255,255,0.16)]"
        )}
      >
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50">
            <BriefcaseIcon className="size-4 text-foreground/85" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 text-start">
            <p className="text-[15px] font-semibold tracking-tight text-foreground">
              {t("ticketTitle")}
            </p>
            <p className="text-[12px] text-muted-foreground">{t("ticketSubtitle")}</p>
          </div>
          <Badge
            variant={showFilled ? "default" : "secondary"}
            className="min-w-12 justify-center rounded-full px-2 py-0 text-[10px]"
          >
            {showFilled ? common("filled") : common("demo")}
          </Badge>
        </div>

        <MiniChart signalOn={showSignal} />

        <div className="flex flex-col gap-2.5 px-4 py-3">
          <div className="shrink-0 rounded-xl border border-border/60 bg-muted/20 p-2.5">
            <p className="mb-2 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t("ticketSection")}
            </p>
            <dl className="grid grid-cols-2 gap-1.5">
              {TICKET.map((row, index) => (
                <TicketField
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  filled={ticketFilled > index}
                />
              ))}
            </dl>
          </div>

          <span ref={buyRef} className="block w-full shrink-0">
            <Button
              type="button"
              size="sm"
              variant={showFilled ? "default" : "secondary"}
              tabIndex={-1}
              className="pointer-events-none h-9 w-full rounded-xl font-semibold"
            >
              {placing ? (
                t("ticketPlacing")
              ) : showFilled ? (
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon className="size-3.5" />
                  {t("ticketFilled")}
                </span>
              ) : (
                t("ticketBuy")
              )}
            </Button>
          </span>

          <div className="flex shrink-0 flex-col gap-2">
            <div className="flex min-h-[3.25rem] items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
              <div>
                <p className="text-[10px] text-muted-foreground">{t("ticketPosition")}</p>
                <p
                  className={cn(
                    "font-mono text-[13px] font-semibold tabular-nums transition-opacity duration-300",
                    showPosition ? "text-foreground opacity-100" : "text-muted-foreground opacity-40"
                  )}
                >
                  {positionLabel}
                </p>
              </div>
              <div className="text-end">
                <p className="text-[10px] text-muted-foreground">{t("ticketUnrealized")}</p>
                <p
                  className={cn(
                    "font-mono text-[13px] font-semibold tabular-nums transition-opacity duration-300",
                    showPosition ? "text-foreground opacity-100" : "text-muted-foreground opacity-40"
                  )}
                >
                  {pnlLabel}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: t("ticketEntry"), value: showPosition ? "3,468.2" : "—" },
                { label: t("ticketMark"), value: markLabel },
                { label: t("ticketRR"), value: showPosition ? "2.1×" : "—" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-md border border-border/55 bg-muted/25 px-2 py-1.5 text-center"
                >
                  <p className="text-[8px] text-muted-foreground">{row.label}</p>
                  <p
                    className={cn(
                      "mt-0.5 font-mono text-[10px] font-semibold tabular-nums transition-opacity duration-300",
                      showPosition ? "text-foreground opacity-100" : "text-muted-foreground opacity-40"
                    )}
                  >
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
