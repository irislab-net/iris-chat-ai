"use client"

import * as React from "react"
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BriefcaseIcon,
  CircleHelpIcon,
  CircleSlashIcon,
  CrosshairIcon,
  HourglassIcon,
  LockIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProBadge } from "@/components/dashboard/pro-badge"
import {
  CandleDesktopBackdrop,
  CandleMarketChrome,
  CandleMobileStrip,
} from "@/components/dashboard/candle-card-backdrop"
import { BulletReadButton } from "@/components/dashboard/bullet-read-button"
import { MarketStanceChime } from "@/components/dashboard/market-stance-chime"
import { trackProGateView } from "@/lib/analytics"
import { clamp, nextCandleCountdown, pct, pctInt } from "@/lib/format"
import {
  getMarketStateActionPresentation,
  type MarketStateKind,
} from "@/lib/market-state-action"
import type { Classifier, InsightSummary, Prediction } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const MODEL_META = [
  {
    key: "long" as const,
    label: "Long",
    blurb: "Buy the bounce",
    icon: ArrowUpRightIcon,
  },
  {
    key: "short" as const,
    label: "Short",
    blurb: "Sell the rip",
    icon: ArrowDownRightIcon,
  },
  {
    key: "breakout" as const,
    label: "Breakout",
    blurb: "Big move coming?",
    icon: ZapIcon,
  },
  {
    key: "fast" as const,
    label: "Fast scalp",
    blurb: "Quick in/out",
    icon: CrosshairIcon,
  },
]

/** Status badge chrome — icon + restrained semantic color per stance kind. */
const STATUS_BADGE: Record<
  MarketStateKind,
  { icon: LucideIcon; className: string; iconClass: string }
> = {
  wait: {
    icon: HourglassIcon,
    className:
      "border-amber-500/50 bg-amber-500 text-amber-950 dark:border-amber-400/60 dark:bg-amber-400 dark:text-amber-950",
    iconClass:
      "origin-center will-change-transform motion-safe:animate-[iris-hourglass_3.6s_cubic-bezier(0.45,0.05,0.55,0.95)_infinite]",
  },
  long: {
    icon: ArrowUpRightIcon,
    className:
      "border-emerald-500/50 bg-emerald-500 text-emerald-950 dark:border-emerald-400/60 dark:bg-emerald-400 dark:text-emerald-950",
    iconClass:
      "will-change-transform motion-safe:animate-[iris-nudge-up_2.4s_cubic-bezier(0.37,0,0.63,1)_infinite]",
  },
  short: {
    icon: ArrowDownRightIcon,
    className:
      "border-red-500/50 bg-red-500 text-red-50 dark:border-red-400/60 dark:bg-red-500 dark:text-red-50",
    iconClass:
      "will-change-transform motion-safe:animate-[iris-nudge-down_2.4s_cubic-bezier(0.37,0,0.63,1)_infinite]",
  },
  no_setup: {
    icon: CircleSlashIcon,
    className: "border-border bg-muted text-muted-foreground",
    iconClass:
      "will-change-transform motion-safe:animate-[iris-icon-pulse_2.8s_cubic-bezier(0.37,0,0.63,1)_infinite]",
  },
  unknown: {
    icon: CircleHelpIcon,
    className: "border-border bg-muted text-muted-foreground",
    iconClass:
      "will-change-transform motion-safe:animate-[iris-icon-pulse_2.8s_cubic-bezier(0.37,0,0.63,1)_infinite]",
  },
}

/** Soft own-color glow when the stance is active. */
const STATUS_BADGE_GLOW: Record<MarketStateKind, string> = {
  wait: "shadow-[0_0_0_1px_rgba(245,158,11,0.25),0_0_18px_rgba(245,158,11,0.35)]",
  long: "shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_0_18px_rgba(16,185,129,0.35)]",
  short: "shadow-[0_0_0_1px_rgba(239,68,68,0.25),0_0_18px_rgba(239,68,68,0.35)]",
  no_setup:
    "shadow-[0_0_0_1px_rgba(161,161,170,0.2),0_0_14px_rgba(161,161,170,0.25)]",
  unknown:
    "shadow-[0_0_0_1px_rgba(161,161,170,0.2),0_0_14px_rgba(161,161,170,0.25)]",
}

function MarketStatusBadge({
  kind,
  label,
  active = true,
  size = "default",
}: {
  kind: MarketStateKind
  label: string
  /** When false: muted / disabled look, no icon motion. */
  active?: boolean
  size?: "default" | "sm"
}) {
  const meta = STATUS_BADGE[kind]
  const Icon = meta.icon
  const compact = size === "sm"
  return (
    <Badge
      variant="outline"
      aria-current={active ? "true" : undefined}
      className={cn(
        "h-auto w-fit gap-1.5 rounded-full font-semibold tracking-wide uppercase transition-[box-shadow,opacity,filter,transform] duration-300",
        compact
          ? "gap-1.5 px-3.5 py-1.5 text-sm [&>svg]:size-3.5!"
          : "gap-2 px-5 py-1.5 text-base md:px-6 md:py-2 md:text-lg [&>svg]:size-4! md:[&>svg]:size-5!",
        meta.className,
        active
          ? STATUS_BADGE_GLOW[kind]
          : "pointer-events-none scale-[0.96] opacity-35 grayscale saturate-0 shadow-none"
      )}
    >
      <Icon className={active ? meta.iconClass : undefined} aria-hidden />
      {label}
    </Badge>
  )
}

const STATUS_BADGE_PREVIEW: ReadonlyArray<{
  kind: MarketStateKind
  label: string
}> = [
  { kind: "wait", label: "WAIT" },
  { kind: "long", label: "LONG" },
  { kind: "short", label: "SHORT" },
  { kind: "no_setup", label: "NO SETUP" },
  { kind: "unknown", label: "UNKNOWN" },
]

function meterColor(p: number, thr: number) {
  const ratio = p / thr
  if (ratio >= 1) return "bg-emerald-500/70"
  if (ratio >= 0.85) return "bg-emerald-500/45"
  if (p < 0.05) return "bg-muted-foreground/35"
  return "bg-foreground/55"
}

function statusChip(c: Classifier) {
  if (c.signal && c.p >= c.thr && c.edge > 0) {
    return {
      t: "GO",
      className:
        "border-0 bg-emerald-500/10 text-emerald-800/85 dark:text-emerald-200/90",
    }
  }
  if (c.p / c.thr >= 0.85) {
    return {
      t: "WATCH",
      className: "border-0 bg-amber-500/10 text-amber-900/80 dark:text-amber-200/90",
    }
  }
  if (c.edge < 0) {
    return {
      t: "NO EDGE",
      className: "border-0 bg-red-500/8 text-red-800/75 dark:text-red-200/85",
    }
  }
  return {
    t: "WAIT",
    className: "border-0 bg-foreground/[0.05] text-muted-foreground",
  }
}

function modelStatusSurface(chip: ReturnType<typeof statusChip>) {
  if (chip.t === "GO") {
    return "bg-emerald-500/[0.07] dark:bg-emerald-400/[0.05]"
  }
  if (chip.t === "WATCH") {
    return "bg-amber-500/[0.06] dark:bg-amber-400/[0.04]"
  }
  if (chip.t === "NO EDGE") {
    return "bg-red-500/[0.05] dark:bg-red-400/[0.04]"
  }
  return "bg-muted/22"
}

const ANALYSIS_PANEL_CLASS = "flex min-h-0 flex-col rounded-2xl bg-muted/18"
const ANALYSIS_PANEL_PADDING = {
  compact: "gap-4 p-3",
  default: "justify-between gap-6 p-4",
} as const

function NextCandleCountdown() {
  const [countdown, setCountdown] = React.useState(nextCandleCountdown)

  React.useEffect(() => {
    const id = window.setInterval(() => setCountdown(nextCandleCountdown()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <span className="text-muted-foreground/60"> · Next update in {countdown}</span>
  )
}

function HeroPulse({
  summary,
  prediction,
  freshnessLabel,
}: {
  summary: InsightSummary
  prediction: Prediction
  /** Factual payload age — never auth-inferred Live/6h. */
  freshnessLabel: string
}) {
  const contextLine = summary.explanation.replace(/\s+/g, " ").trim() || null
  const stateAction = getMarketStateActionPresentation(summary.stance)
  const headline = summary.headline.trim()
  const showHeadline = Boolean(headline)
  const showContext =
    Boolean(contextLine) &&
    (!headline ||
      contextLine!.toLowerCase() !== headline.toLowerCase())
  const bias = summary.bias?.trim() || null
  const volatility = summary.calmness_label
    ? {
        value: summary.calmness_label,
        hint:
          typeof summary.expected_move_pct === "number"
            ? `${summary.expected_move_pct.toFixed(2)}% expected move`
            : null,
      }
    : null
  const rewardRisk =
    typeof prediction.geometry.rr === "number" ? prediction.geometry.rr : null
  const hasSideDrivers = Boolean(bias || volatility || rewardRisk != null)

  return (
    <Card className="shrink-0">
      <MarketStanceChime stance={summary.stance} symbol={summary.symbol} />
      <CardContent className="space-y-4 p-5 md:p-6">
        {/* Compact metadata — quietest layer */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1 text-[11px] text-muted-foreground/80 md:px-2">
          <span className="font-medium tracking-wide uppercase">
            {summary.symbol} · {summary.timeframe}
          </span>
          <span className="font-mono" aria-label={freshnessLabel}>
            {freshnessLabel}
            <NextCandleCountdown />
          </span>
        </div>

        {/*
          Bullet = distilled deliverable.
          Status / action / headline / context, then Bias · Vol · R:R underneath.
          Outer aside: model distance
        */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(14rem,17rem)] lg:items-stretch lg:gap-8">
          <div
            className="relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-lg bg-muted/45 px-4 py-4 md:px-5 md:py-5"
            data-slot="bullet"
          >
            <CandleMarketChrome
              symbol={summary.symbol}
              timeframe={summary.timeframe}
              summary={summary}
              prediction={prediction}
            >
              <CandleDesktopBackdrop />
              <div className="relative z-10 min-w-0 space-y-2.5">
                <div
                  className="flex flex-wrap items-center gap-2"
                  aria-label="Market status"
                >
                  {[
                    ...STATUS_BADGE_PREVIEW.filter(
                      ({ kind }) => kind === stateAction.kind
                    ),
                    ...STATUS_BADGE_PREVIEW.filter(
                      ({ kind }) => kind !== stateAction.kind
                    ),
                  ].map(({ kind, label }) => (
                    <MarketStatusBadge
                      key={kind}
                      kind={kind}
                      label={label}
                      size="sm"
                      active={kind === stateAction.kind}
                    />
                  ))}
                </div>
                <div className="max-w-xl space-y-1">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/80 uppercase">
                    What to do
                  </p>
                  <p className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {stateAction.nextAction}
                  </p>
                  {stateAction.interpretation ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {stateAction.interpretation}
                    </p>
                  ) : null}
                </div>
                {showHeadline || showContext ? (
                  <div className="max-w-2xl space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/80 uppercase">
                        Bullet
                      </p>
                      <BulletReadButton
                        text={[headline, contextLine].filter(Boolean).join(". ")}
                      />
                    </div>
                    {showHeadline ? (
                      <h2 className="text-base leading-snug font-medium tracking-tight text-foreground/90 md:text-lg md:leading-snug">
                        {headline}
                      </h2>
                    ) : null}
                    {showContext ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        <span className="sr-only">Context: </span>
                        {contextLine}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {hasSideDrivers ? (
                  <div
                    className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3 sm:grid-cols-3"
                    aria-label="Bias, volatility, and reward risk"
                  >
                    {bias ? (
                      <div className="min-w-0">
                        <div className="text-[10px] tracking-wide text-muted-foreground/70 uppercase">
                          Bias
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-foreground">
                          {bias}
                        </div>
                      </div>
                    ) : null}
                    {volatility ? (
                      <div className="min-w-0">
                        <div className="text-[10px] tracking-wide text-muted-foreground/70 uppercase">
                          Volatility
                        </div>
                        <div className="mt-0.5 text-sm font-medium text-foreground">
                          {volatility.value}
                        </div>
                        {volatility.hint ? (
                          <div className="mt-0.5 text-[11px] text-muted-foreground/80">
                            {volatility.hint}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {rewardRisk != null ? (
                      <div className="min-w-0">
                        <div className="text-[10px] tracking-wide text-muted-foreground/70 uppercase">
                          Reward / Risk
                        </div>
                        <div className="mt-0.5 font-mono text-lg font-semibold tracking-tight text-foreground">
                          {rewardRisk.toFixed(2)}x
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <CandleMobileStrip />
            </CandleMarketChrome>
          </div>

          <aside
            className="flex flex-col rounded-lg bg-muted/25 px-3 py-3 lg:h-full lg:min-h-full lg:px-4 lg:py-4"
            aria-label="Models checked for this bullet"
          >
            <ModelDistanceSection prediction={prediction} density="compact" />
          </aside>
        </div>
      </CardContent>
    </Card>
  )
}

function ModelDistanceSection({
  prediction,
  density = "default",
}: {
  prediction: Prediction
  density?: "default" | "compact"
}) {
  const models = MODEL_META.map((m) => ({ ...m, c: prediction.classifiers[m.key] }))
  const compact = density === "compact"

  return (
    <div
      className={cn(
        compact
          ? "flex flex-col gap-3 lg:h-full lg:min-h-0 lg:flex-1"
          : "space-y-3"
      )}
    >
      <h4
        className={cn(
          "shrink-0 font-medium tracking-[0.14em] text-muted-foreground/70 uppercase",
          compact ? "text-[10px]" : "text-xs font-semibold text-muted-foreground"
        )}
      >
        Model distance
      </h4>
      <div
        className={cn(
          compact
            ? "flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:justify-between lg:gap-2"
            : "space-y-4"
        )}
      >
        {models.map((m) => {
          const fill = clamp((m.c.p / m.c.thr) * 100, 0, 100)
          return (
            <div
              key={m.key}
              className={cn(
                "min-w-0",
                compact ? "space-y-1.5 lg:space-y-1" : "space-y-1.5"
              )}
            >
              <div
                className={cn(
                  "flex justify-between gap-2",
                  compact ? "text-xs" : "text-sm"
                )}
              >
                <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <m.icon
                    className={cn("shrink-0", compact ? "size-3.5" : "size-4")}
                    aria-hidden
                  />
                  <span className="truncate">{m.label}</span>
                </span>
                <span className="font-mono tabular-nums">
                  {pct(m.c.p)}%
                  <span className="text-muted-foreground">
                    {" "}
                    / {pctInt(m.c.thr)}%
                  </span>
                </span>
              </div>
              <div
                className={cn(
                  "relative overflow-hidden rounded-full bg-foreground/6",
                  compact ? "h-1.5" : "h-2"
                )}
              >
                <div className="absolute inset-y-0 right-0 z-10 w-px bg-foreground/25" />
                <div
                  className={`h-full ${meterColor(m.c.p, m.c.thr)}`}
                  style={{ width: `${fill}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ModelsSection({
  prediction,
  layout = "grid",
  fill = false,
}: {
  prediction: Prediction
  layout?: "grid" | "stack"
  fill?: boolean
}) {
  const models = MODEL_META.map((m) => ({ ...m, c: prediction.classifiers[m.key] }))
  const dirConf = Math.max(...models.map((m) => m.c.p))

  return (
    <div
      className={cn(
        fill ? "flex h-full min-h-0 flex-1 flex-col gap-3" : "space-y-3"
      )}
    >
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
        <h4 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Models
        </h4>
        <p className="font-mono text-sm text-muted-foreground">
          Direction confidence{" "}
          <span className="font-semibold text-foreground">{pct(dirConf)}%</span>
        </p>
      </div>
      <div
        className={cn(
          "gap-2",
          layout === "stack" ? "flex flex-col" : "grid sm:grid-cols-2",
          fill && "min-h-0 flex-1 justify-between"
        )}
      >
        {models.map((m) => {
          const chip = statusChip(m.c)
          return (
            <div
              key={m.key}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5",
                modelStatusSurface(chip)
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <m.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {m.label}
                </div>
                <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {pct(m.c.p)}% vs threshold {pctInt(m.c.thr)}%
                </div>
              </div>
              <div className="shrink-0 text-right">
                <Badge variant="secondary" className={cn("mb-1", chip.className)}>
                  {chip.t}
                </Badge>
                <div
                  className={cn(
                    "font-mono text-xs",
                    m.c.edge >= 0
                      ? "text-emerald-700/85 dark:text-emerald-300/90"
                      : "text-red-700/85 dark:text-red-300/90"
                  )}
                >
                  Edge {(m.c.edge * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RiskMetricsSection({ prediction }: { prediction: Prediction }) {
  const { mae, mfe, rr, vol } = prediction.geometry
  const tot = mae + mfe || 1

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        Risk metrics
      </h4>
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground sm:text-sm">
          <span>Downside (MAE)</span>
          <span>Upside (MFE)</span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-foreground/6">
          <div className="h-full bg-red-500/55" style={{ width: `${(mae / tot) * 100}%` }} />
          <div className="h-full bg-emerald-500/55" style={{ width: `${(mfe / tot) * 100}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-xs sm:text-sm">
          <span className="text-red-700/85 dark:text-red-300/90">{mae.toFixed(2)}%</span>
          <span className="text-muted-foreground">Reward / risk {rr.toFixed(2)}×</span>
          <span className="text-emerald-700/85 dark:text-emerald-300/90">{mfe.toFixed(2)}%</span>
        </div>
      </div>
      <div className="flex justify-between rounded-xl bg-background/35 px-3 py-2 text-sm dark:bg-background/20">
        <span className="text-muted-foreground">Expected volatility</span>
        <span className="font-mono font-medium">{(vol * 100).toFixed(3)}%</span>
      </div>
    </div>
  )
}

function AnalysisBody({
  prediction,
  compact = false,
}: {
  prediction: Prediction
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        compact ? "gap-3" : "flex-1 gap-6 lg:grid lg:grid-cols-2 lg:items-stretch"
      )}
    >
      <div
        className={cn(
          ANALYSIS_PANEL_CLASS,
          compact ? ANALYSIS_PANEL_PADDING.compact : ANALYSIS_PANEL_PADDING.default
        )}
      >
        <ModelDistanceSection
          prediction={prediction}
          density={compact ? "compact" : "default"}
        />
        <RiskMetricsSection prediction={prediction} />
      </div>
      <div
        className={cn(
          ANALYSIS_PANEL_CLASS,
          compact ? ANALYSIS_PANEL_PADDING.compact : "p-4"
        )}
      >
        <ModelsSection
          prediction={prediction}
          layout="stack"
          fill={!compact}
        />
      </div>
    </div>
  )
}

/** Analysis tab panel — UI-03 content without a second Show/Hide disclosure. */
function AnalysisPanel({
  prediction,
  embedded = false,
  aside = false,
  mobile = false,
  freshnessLabel,
}: {
  prediction: Prediction
  embedded?: boolean
  /** Compact stacked rail — same chrome as the order ticket aside. */
  aside?: boolean
  mobile?: boolean
  freshnessLabel?: string
}) {
  if (aside) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 flex-col"
        data-slot="analysis"
      >
        <header className="flex h-12 shrink-0 items-center gap-2 bg-muted/18 px-3 pr-3 pl-5">
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Analysis</span>
            <span className="block truncate text-xs text-muted-foreground">
              {freshnessLabel ?? "Model distance for this candle"}
            </span>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <AnalysisBody prediction={prediction} compact />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        mobile ? "gap-3" : "min-h-0 flex-1 gap-5"
      )}
      data-slot="analysis"
      aria-labelledby={embedded || mobile ? undefined : "analysis-panel-heading"}
    >
      {embedded || mobile ? null : (
        <div className="shrink-0 space-y-1">
          <h3
            id="analysis-panel-heading"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Model distance and technical detail for this update.
          </p>
        </div>
      )}
      <AnalysisBody prediction={prediction} compact={mobile || aside} />
    </div>
  )
}

/** Decorative Pro desk layout — not live signals; shown under blur when locked. */
function TradeDeskSignalPattern() {
  const rows: { label: string; value: string; emphasize?: boolean }[] = [
    { label: "Side", value: "Long", emphasize: true },
    { label: "Entry", value: "3,248.50" },
    { label: "Stop", value: "3,210.20" },
    { label: "Take profit", value: "3,318.40" },
    { label: "Suggested R:R", value: "1 : 2.1" },
  ]

  return (
    <Card
      className="gap-0 bg-card py-0"
      aria-hidden
    >
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <BriefcaseIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold tracking-tight">
              Trade Desk
            </span>
            <ProBadge className="h-5 px-1.5 text-[10px] [&_svg]:size-2.5!" />
          </div>
          <Badge
            variant="outline"
            className="border-border bg-muted font-mono text-xs text-foreground"
          >
            Setup ready
          </Badge>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Selected market
          </p>
          <p className="font-mono text-sm font-medium text-foreground">
            ETH · 15M
          </p>
        </div>

        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2.5 text-sm"
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  row.emphasize
                    ? "font-semibold text-foreground"
                    : "text-foreground"
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Signal confidence</span>
            <span className="font-mono">78%</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full border border-border bg-muted">
            <div className="h-full w-[78%] bg-foreground/70" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Desk note: wait for reclaim of local structure; invalidation below
            stop. Sized for the selected market volatility band.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function TradeDeskLockCard({
  isAuthenticated,
  onLogin,
}: {
  isAuthenticated: boolean
  onLogin: () => void
}) {
  return (
    <Card className="relative z-10 w-full max-w-md gap-0 bg-card py-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-muted">
            <LockIcon className="size-4 text-foreground" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Trade Desk locked
              </h3>
              <ProBadge />
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          This is the Pro signal pattern for the market you select: side, entry,
          stop / take, and risk framing as professional trade guidance.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isAuthenticated
            ? "It stays locked on free accounts. Start a trial or upgrade to Pro for precise, market-matched setups."
            : "It stays locked until you connect Google and activate a trial or Pro."}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Not order execution on this site. Preview values are not live signals.
        </p>
        {!isAuthenticated ? (
          <Button
            type="button"
            className="mt-4 w-full sm:w-auto"
            onClick={onLogin}
          >
            Continue with Google
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

function TradeDesk({
  isProUser,
  isAuthenticated,
  onLogin,
}: {
  isProUser: boolean
  isAuthenticated: boolean
  onLogin: () => void
}) {
  React.useEffect(() => {
    if (!isProUser) trackProGateView(isAuthenticated)
  }, [isProUser, isAuthenticated])

  // Pro tier from /v1/me — desk payload still BLOCKED; show pattern without fake unlock.
  if (isProUser) {
    return (
      <div
        className="relative min-h-72 flex-1 overflow-hidden rounded-xl sm:min-h-80"
        data-slot="desk"
      >
        <div className="pointer-events-none select-none blur-[2.5px] saturate-75">
          <TradeDeskSignalPattern />
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/35 p-4 backdrop-blur-[2px]">
          <Card className="w-full max-w-md gap-0 bg-card py-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <BriefcaseIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                <h3 className="text-base font-semibold tracking-tight">
                  Trade Desk
                </h3>
                <ProBadge />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Your Pro desk is entitled, but live market signals are not
                available in this build yet. The pattern below is the layout you
                will get per selected market.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-72 flex-1 overflow-hidden rounded-xl sm:min-h-80"
      data-slot="desk"
    >
      <div className="pointer-events-none select-none blur-[3px] saturate-50">
        <TradeDeskSignalPattern />
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/40 p-4 backdrop-blur-[1.5px]">
        <TradeDeskLockCard
          isAuthenticated={isAuthenticated}
          onLogin={onLogin}
        />
      </div>
    </div>
  )
}

export { HeroPulse, AnalysisPanel, TradeDesk, MODEL_META }
