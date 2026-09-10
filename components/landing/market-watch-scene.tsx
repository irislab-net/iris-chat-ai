"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"
import { BellRingIcon, RadarIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const WATCH_MARKETS = [
  { symbol: "ETH", score: 84, stanceKey: "long" as const, hot: true },
  { symbol: "BTC", score: 61, stanceKey: "neutral" as const, hot: false },
  { symbol: "XAU", score: 52, stanceKey: "watch" as const, hot: false },
] as const

const TOAST_TEXT = "toastSignal"

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

function RingingBell({
  bellRef,
  ringing,
}: {
  bellRef: React.RefObject<HTMLDivElement | null>
  ringing: boolean
}) {
  return (
    <div
      ref={bellRef}
      className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50"
    >
      <motion.div
        animate={{
          rotate: ringing ? [0, -14, 14, -10, 10, -6, 6, 0] : 0,
        }}
        transition={{
          duration: ringing ? 0.65 : 0.2,
          ease: "easeInOut",
        }}
        style={{ originX: "50%", originY: "0%" }}
      >
        <BellRingIcon className="size-3.5 text-foreground/85" aria-hidden />
      </motion.div>

      <motion.span
        aria-hidden
        className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-foreground ring-2 ring-background"
        animate={{
          scale: ringing ? [1, 1.35, 1, 1.2, 1] : 1,
          opacity: ringing ? [1, 1, 0.85, 1] : 1,
        }}
        transition={{
          duration: ringing ? 0.65 : 0.2,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

function FloatingToast({
  point,
  toastKey,
  label,
}: {
  point: { x: number; y: number }
  toastKey: number
  label: string
}) {
  return (
    <motion.div
      key={toastKey}
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: [0, 1, 1, 0], y: [8, -2, -18, -58], scale: [0.9, 1, 1, 0.94] }}
      transition={{
        duration: 2.6,
        ease: [0.22, 1, 0.36, 1],
        times: [0, 0.1, 0.42, 1],
      }}
      className={cn(
        "pointer-events-none absolute top-0 left-0 z-30 -translate-x-1/2",
        "whitespace-nowrap rounded-full border border-border/70 bg-background px-3 py-1.5",
        "text-[10px] font-medium tracking-tight text-foreground",
        "shadow-[0_10px_28px_-10px_color-mix(in_oklch,var(--foreground)_28%,transparent)] backdrop-blur-md"
      )}
      style={{ left: point.x, top: point.y }}
    >
      {label}
    </motion.div>
  )
}

export function MarketWatchScene() {
  const t = useTranslations("landing.scenes")
  const common = useTranslations("common")
  const reduceMotion = useReducedMotion()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const bellRef = React.useRef<HTMLDivElement>(null)

  const [onScreen, setOnScreen] = React.useState(false)
  const [loop, setLoop] = React.useState(0)
  const [ringing, setRinging] = React.useState(false)
  const [toastOn, setToastOn] = React.useState(false)
  const [toastKey, setToastKey] = React.useState(0)
  const [toastPoint, setToastPoint] = React.useState({ x: 0, y: 0 })
  const [signalOn, setSignalOn] = React.useState(false)

  const still = reduceMotion === true
  const showSignal = still || signalOn
  const showRinging = !still && ringing
  const showToast = !still && toastOn

  const syncToastPoint = React.useEffectEvent(() => {
    const root = rootRef.current
    const bell = bellRef.current
    if (!root || !bell) return
    const rootBox = root.getBoundingClientRect()
    const bellBox = bell.getBoundingClientRect()
    setToastPoint({
      x: bellBox.left - rootBox.left + bellBox.width / 2,
      y: bellBox.top - rootBox.top,
    })
  })

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

  React.useEffect(() => {
    if (still || !onScreen) return

    const ac = new AbortController()
    const { signal } = ac

    async function play() {
      try {
        setRinging(false)
        setToastOn(false)
        setSignalOn(false)

        await wait(1200, signal)
        setRinging(true)
        syncToastPoint()
        setToastKey((n) => n + 1)
        setToastOn(true)
        await wait(700, signal)
        setSignalOn(true)
        await wait(2200, signal)
        setRinging(false)
        await wait(2800, signal)
        setToastOn(false)
        await wait(800, signal)
        setLoop((n) => n + 1)
      } catch {
        /* aborted */
      }
    }

    void play()
    return () => ac.abort()
  }, [loop, onScreen, still])

  return (
    <div
      ref={rootRef}
      data-reveal
      className="relative mx-auto w-full max-w-88 overflow-visible"
      aria-hidden
    >
      {showToast ? (
        <FloatingToast
          point={toastPoint}
          toastKey={toastKey}
          label={t(TOAST_TEXT)}
        />
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-[4%] -z-10 rounded-[2.5rem] bg-foreground/14 opacity-55 blur-3xl dark:bg-foreground/22"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[10%] -z-10 rounded-[2rem] bg-foreground/18 opacity-60 blur-2xl dark:bg-foreground/28"
      />

      <div
        className={cn(
          "relative overflow-visible rounded-[1.75rem]",
          "bg-card/80 text-card-foreground backdrop-blur-md",
          "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_18px_40px_-18px_rgba(0,0,0,0.28)]",
          "dark:shadow-[0_2px_10px_-2px_rgba(255,255,255,0.06),0_20px_48px_-16px_rgba(255,255,255,0.16)]"
        )}
      >
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50">
            <RadarIcon className="size-4 text-foreground/85" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 text-start">
            <p className="text-[15px] font-semibold tracking-tight text-foreground">
              {t("pulseTitle")}
            </p>
            <p className="text-[12px] text-muted-foreground">{t("pulseSubtitle")}</p>
          </div>
          <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
            {common("live")}
          </Badge>
        </div>

        <div className="flex flex-col gap-2 px-4 py-3">
          {WATCH_MARKETS.map((market) => (
            <div
              key={market.symbol}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors duration-500",
                market.hot && showSignal
                  ? "border-foreground/15 bg-muted/30"
                  : market.hot
                    ? "border-border/60 bg-muted/15"
                    : "border-border/60 bg-muted/15"
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                  {market.symbol}
                </span>
                <Badge
                  variant={market.hot && showSignal ? "default" : "outline"}
                  className="rounded-full px-2 py-0 text-[9px] font-medium"
                >
                  {t(market.stanceKey)}
                </Badge>
              </div>
              <div className="text-end">
                <p className="text-[9px] text-muted-foreground">{t("conviction")}</p>
                <p
                  className={cn(
                    "font-mono text-sm font-semibold tabular-nums transition-colors duration-500",
                    market.hot && showSignal ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {market.score}%
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-visible border-t border-border/60 px-4 py-3">
          <div
            className={cn(
              "overflow-visible rounded-2xl border border-border/60 transition-all duration-500",
              "bg-linear-to-b from-muted/35 via-background/80 to-background",
              "shadow-[0_14px_36px_-24px_color-mix(in_oklch,var(--foreground)_22%,transparent)]",
              showSignal ? "opacity-100" : "opacity-55"
            )}
          >
            <div className="flex items-start gap-3 overflow-visible px-3 py-3">
              <RingingBell bellRef={bellRef} ringing={showRinging} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t("strongSignal")}
                </p>
                <div
                  className={cn(
                    "mt-1.5 flex flex-wrap items-center gap-1.5 transition-opacity duration-500",
                    showSignal ? "opacity-100" : "opacity-40"
                  )}
                >
                  <Badge className="rounded-full px-2 py-0 text-[10px] font-medium">
                    {t("ethLong")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full px-2 py-0 text-[10px] font-medium"
                  >
                    15m
                  </Badge>
                </div>
                <p
                  className={cn(
                    "mt-2 text-[11px] leading-5 text-muted-foreground transition-opacity duration-500",
                    showSignal ? "opacity-100" : "opacity-40"
                  )}
                >
                  {t("tapeAlign")}
                </p>
              </div>
            </div>

            <dl
              className={cn(
                "grid grid-cols-3 gap-1 border-t border-border/45 bg-muted/15 p-2 transition-opacity duration-500",
                showSignal ? "opacity-100" : "opacity-40"
              )}
            >
              {[
                { label: t("ticketEntry"), value: "3,468" },
                { label: t("ticketStop"), value: "3,412" },
                { label: t("ticketTarget"), value: "3,520" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-md border border-border/55 bg-muted/25 px-2 py-1.5 text-center"
                >
                  <dt className="text-[8px] text-muted-foreground">{row.label}</dt>
                  <dd className="mt-0.5 font-mono text-[10px] font-semibold tabular-nums text-foreground">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
