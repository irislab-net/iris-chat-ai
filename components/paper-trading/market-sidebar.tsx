"use client"

/**
 * Desktop-only left rail for Paper Trading.
 * Tabs: Free (direction + analysis) | VIP Signal (Pro-gated setups).
 */
import * as React from "react"
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CrosshairIcon,
  LockIcon,
  ZapIcon,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { ProBadge } from "@/components/dashboard/pro-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { trackProGateView } from "@/lib/analytics"
import { clamp, pct, pctInt } from "@/lib/format"
import {
  getMarketStateActionPresentation,
  type MarketStateKind,
} from "@/lib/market-state-action"
import type { Classifier, InsightSummary, Prediction } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const MODEL_ROWS = [
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

const KIND_BADGE: Record<MarketStateKind, string> = {
  wait: "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  long: "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  short: "border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-300",
  no_setup: "border-border bg-muted text-muted-foreground",
  unknown: "border-border bg-muted text-muted-foreground",
}

function meterColor(p: number, thr: number) {
  const ratio = p / thr
  if (ratio >= 1) return "bg-emerald-500"
  if (ratio >= 0.85) return "bg-emerald-500/70"
  if (p < 0.05) return "bg-muted-foreground/50"
  return "bg-foreground"
}

function statusChip(c: Classifier) {
  if (c.signal && c.p >= c.thr && c.edge > 0) {
    return {
      t: "GO",
      className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
    }
  }
  if (c.p / c.thr >= 0.85) {
    return {
      t: "WATCH",
      className: "border-border bg-muted text-foreground",
    }
  }
  if (c.edge < 0) {
    return {
      t: "NO EDGE",
      className: "border-border bg-muted text-muted-foreground",
    }
  }
  return {
    t: "WAIT",
    className: "border-border bg-muted text-muted-foreground",
  }
}

function ExpandableMutedText({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false)
  // ~2 lines in the 320px rail at 11px — enough to decide whether to offer expand.
  const canExpand = text.trim().length > 110

  return (
    <div className="space-y-0.5">
      <p
        className={cn(
          "text-[11px] leading-relaxed text-muted-foreground",
          !expanded && "line-clamp-2"
        )}
      >
        {text}
      </p>
      {canExpand ? (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-auto px-0 text-[10px] text-muted-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      ) : null}
    </div>
  )
}

function FreeDirectionPanel({
  summary,
  prediction,
}: {
  summary: InsightSummary
  prediction: Prediction
}) {
  const action = getMarketStateActionPresentation(summary.stance)
  const { vol, rr, mae, mfe } = prediction.geometry
  const tot = mae + mfe || 1
  const contextLine = summary.explanation.replace(/\s+/g, " ").trim()
  const headline = summary.headline.trim()
  const showContext =
    Boolean(contextLine) &&
    (!headline || contextLine.toLowerCase() !== headline.toLowerCase())
  const expectedMove =
    typeof summary.expected_move_pct === "number"
      ? `${summary.expected_move_pct.toFixed(2)}% expected move`
      : null
  const dirConf = Math.max(
    ...MODEL_ROWS.map((m) => prediction.classifiers[m.key].p)
  )

  return (
    <div className="space-y-4">
      <section className="space-y-2.5" aria-labelledby="paper-direction-heading">
        <div className="flex items-center justify-between gap-2">
          <h3
            id="paper-direction-heading"
            className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase"
          >
            Market direction
          </h3>
          <span className="font-mono text-[10px] text-muted-foreground">
            {summary.symbol} · {summary.timeframe}
          </span>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "h-auto w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
            KIND_BADGE[action.kind]
          )}
        >
          {action.displayStatus}
        </Badge>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
            What to do
          </p>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {action.nextAction}
          </p>
          {action.interpretation ? (
            <ExpandableMutedText
              key={action.interpretation}
              text={action.interpretation}
            />
          ) : null}
        </div>

        {headline || showContext ? (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
              Bullet
            </p>
            {headline ? (
              <p className="text-[12px] leading-snug font-medium text-foreground/90">
                {headline}
              </p>
            ) : null}
            {showContext ? (
              <ExpandableMutedText key={contextLine} text={contextLine} />
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-2.5">
          {summary.bias?.trim() ? (
            <div className="min-w-0">
              <div className="text-[9px] tracking-wide text-muted-foreground/70 uppercase">
                Bias
              </div>
              <div className="mt-0.5 text-xs font-medium break-words">
                {summary.bias}
              </div>
            </div>
          ) : null}
          {summary.calmness_label ? (
            <div className="min-w-0">
              <div className="text-[9px] tracking-wide text-muted-foreground/70 uppercase">
                Volatility
              </div>
              <div className="mt-0.5 text-xs font-medium">
                {summary.calmness_label}
              </div>
              {expectedMove ? (
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {expectedMove}
                </div>
              ) : null}
            </div>
          ) : null}
          {typeof summary.reward_risk_ratio === "number" ? (
            <div className="min-w-0">
              <div className="text-[9px] tracking-wide text-muted-foreground/70 uppercase">
                Reward / Risk
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                {summary.reward_risk_ratio.toFixed(2)}x
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <Separator className="bg-border/50" />

      <section className="space-y-3" aria-labelledby="paper-analytics-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3
            id="paper-analytics-heading"
            className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase"
          >
            Analysis
          </h3>
          <p className="font-mono text-[10px] text-muted-foreground">
            Best model{" "}
            <span className="font-semibold text-foreground">{pct(dirConf)}%</span>
          </p>
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Prob vs threshold. Bar fills to the threshold line. GO needs signal +
          edge.
        </p>

        <div className="space-y-2.5">
          {MODEL_ROWS.map((m) => {
            const c = prediction.classifiers[m.key]
            const fill = clamp((c.p / c.thr) * 100, 0, 100)
            const chip = statusChip(c)
            const Icon = m.icon
            return (
              <div
                key={m.key}
                className="space-y-1.5 rounded-sm bg-muted/25 px-2 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-[11px] font-medium">
                      <Icon
                        className="size-3 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="truncate">{m.label}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {m.blurb}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "mb-0.5 h-5 px-1.5 text-[9px]",
                        chip.className
                      )}
                    >
                      {chip.t}
                    </Badge>
                    <div
                      className={cn(
                        "font-mono text-[10px] tabular-nums",
                        c.edge >= 0 ? "text-emerald-600" : "text-red-500"
                      )}
                    >
                      Edge {(c.edge * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between gap-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                  <span>
                    {pct(c.p)}%{" "}
                    <span className="text-muted-foreground/70">prob</span>
                  </span>
                  <span>
                    {pctInt(c.thr)}%{" "}
                    <span className="text-muted-foreground/70">need</span>
                  </span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="absolute inset-y-0 right-0 z-10 w-px bg-foreground/70" />
                  <div
                    className={cn("h-full rounded-full", meterColor(c.p, c.thr))}
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-medium tracking-[0.14em] text-muted-foreground/70 uppercase">
            Risk metrics
          </p>
          <div className="space-y-1.5 rounded-sm bg-muted/30 px-2.5 py-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Expected vol</span>
              <span className="font-mono tabular-nums">
                {(vol * 100).toFixed(3)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">R:R (geometry)</span>
              <span className="font-mono tabular-nums">{rr.toFixed(2)}x</span>
            </div>
            <div className="pt-1">
              <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                <span>MAE (down) {mae.toFixed(2)}%</span>
                <span>MFE (up) {mfe.toFixed(2)}%</span>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-red-500/70"
                  style={{ width: `${(mae / tot) * 100}%` }}
                />
                <div
                  className="h-full bg-emerald-500/70"
                  style={{ width: `${(mfe / tot) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/** Decorative VIP setup pattern — blurred under the lock. Not live signals. */
function VipSignalPattern({
  summary,
}: {
  summary: InsightSummary
}) {
  const rows: { label: string; value: string; emphasize?: boolean }[] = [
    { label: "Side", value: "Long", emphasize: true },
    { label: "Entry", value: "— — —.— —" },
    { label: "Stop", value: "— — —.— —" },
    { label: "Take profit", value: "— — —.— —" },
    { label: "Suggested R:R", value: "1 : 2.1" },
  ]

  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-tight">VIP Signal</span>
          <ProBadge className="h-4 px-1.5 text-[9px] [&_svg]:size-2.5!" />
        </div>
        <Badge
          variant="outline"
          className="border-border bg-muted font-mono text-[10px]"
        >
          Setup ready
        </Badge>
      </div>

      <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-2">
        <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
          Selected market
        </p>
        <p className="font-mono text-xs font-medium">
          {summary.symbol} · {summary.timeframe}
        </p>
      </div>

      <div className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-2 rounded-sm bg-muted/50 px-2.5 py-2 text-[11px]"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span
              className={cn(
                "font-mono tabular-nums",
                row.emphasize && "font-semibold text-foreground"
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 rounded-sm border border-border/60 bg-muted/25 px-2.5 py-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Signal confidence</span>
          <span className="font-mono">78%</span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[78%] bg-foreground/70" />
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Desk note: wait for reclaim of local structure; invalidation below
          stop.
        </p>
      </div>
    </div>
  )
}

function VipSignalPanel({ summary }: { summary: InsightSummary }) {
  const { isProUser, isAuthenticated, login } = useAuth()

  React.useEffect(() => {
    if (!isProUser) trackProGateView(isAuthenticated)
  }, [isProUser, isAuthenticated])

  return (
    <div className="relative min-h-[22rem] overflow-hidden rounded-sm">
      <div
        className={cn(
          "pointer-events-none select-none",
          isProUser
            ? "blur-[2px] saturate-75"
            : "blur-[3px] saturate-50"
        )}
      >
        <VipSignalPattern summary={summary} />
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-background/45 p-3 backdrop-blur-[1.5px]">
        <div className="w-full rounded-md border border-border/70 bg-card p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-muted">
              <LockIcon className="size-3.5 text-foreground" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="text-sm font-semibold tracking-tight">
                  {isProUser ? "VIP Signal" : "VIP Signal locked"}
                </h4>
                <ProBadge className="h-4 px-1.5 text-[9px] [&_svg]:size-2.5!" />
              </div>
            </div>
          </div>

          {isProUser ? (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Your Pro desk is entitled, but live VIP setups are not available in
              this build yet. The pattern behind is the layout you will get per
              market.
            </p>
          ) : (
            <>
              <p className="mt-2 text-[11px] leading-relaxed text-foreground">
                Side, entry, stop / take, and risk framing: precise setups
                matched to this market.
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {isAuthenticated
                  ? "Locked on free accounts. Start a trial or upgrade to Pro."
                  : "Connect Google and activate a trial or Pro to unlock."}
              </p>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Not order execution. Preview values are not live signals.
              </p>
              {!isAuthenticated ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => login()}
                >
                  Continue with Google
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type PaperMarketSidebarProps = {
  summary: InsightSummary
  prediction: Prediction
}

function PaperMarketSidebar({ summary, prediction }: PaperMarketSidebarProps) {
  return (
    <aside
      className="hidden w-64 shrink-0 flex-col overflow-hidden border-r border-border/60 bg-background lg:flex xl:w-80"
      aria-label="Market direction and VIP signals"
    >
      <Tabs
        defaultValue="free"
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <TabsList
          variant="line"
          className="h-9 w-full shrink-0 gap-0 rounded-none border-b border-border/50 p-0"
        >
          <TabsTrigger
            value="free"
            className="h-full rounded-none px-3 text-[11px] font-semibold tracking-wide after:bottom-0"
          >
            Free
          </TabsTrigger>
          <TabsTrigger
            value="vip"
            className="h-full rounded-none px-3 text-[11px] font-semibold tracking-wide after:bottom-0"
            aria-label="VIP Signal, Pro"
          >
            VIP Signal
            <ProBadge className="h-3.5 px-1 text-[8px] [&_svg]:size-2!" />
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="free"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 py-3 outline-none"
        >
          <FreeDirectionPanel summary={summary} prediction={prediction} />
        </TabsContent>

        <TabsContent
          value="vip"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 py-3 outline-none"
        >
          <VipSignalPanel summary={summary} />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

export { PaperMarketSidebar }
