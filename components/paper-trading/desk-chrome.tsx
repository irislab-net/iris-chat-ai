"use client"

import { PencilLineIcon, WalletIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  getMarketStateActionPresentation,
  type MarketStateActionPresentation,
  type MarketStateKind,
} from "@/lib/market-state-action"
import { pctInt } from "@/lib/format"
import { formatTradingPrice } from "@/lib/trading/format"
import type { Classifier, InsightSummary, Prediction } from "@/lib/api/types"
import type { TradingMode } from "@/lib/trading/types"
import { cn } from "@/lib/utils"

const DESK_MODEL_LABEL: Record<
  keyof Prediction["classifiers"],
  string
> = {
  long: "Long",
  short: "Short",
  breakout: "Breakout",
  fast: "Fast",
}

type DeskSignalView = {
  label: string
  kind: MarketStateKind
  confidence: number
  hasModelSignal: boolean
  modelLabel: string
  edgePct: number
}

function classifierGo(c: Classifier) {
  return c.signal && c.p >= c.thr && c.edge > 0
}

function modelKind(
  key: keyof Prediction["classifiers"]
): MarketStateKind {
  if (key === "long") return "long"
  if (key === "short") return "short"
  return "wait"
}

function resolveDeskSignal(
  prediction: Prediction | null,
  stance: MarketStateActionPresentation | null
): DeskSignalView | null {
  if (!stance) return null

  if (!prediction) {
    return {
      label: stance.displayStatus,
      kind: stance.kind,
      confidence: 0,
      hasModelSignal: false,
      modelLabel: "—",
      edgePct: 0,
    }
  }

  const entries = Object.entries(prediction.classifiers) as Array<
    [keyof Prediction["classifiers"], Classifier]
  >

  const active = entries.filter(
    ([, c]) => c.policy_signal || classifierGo(c)
  )
  const leading = (active.length > 0 ? active : entries).sort(
    (a, b) => b[1].p - a[1].p
  )[0]

  if (!leading) {
    return {
      label: stance.displayStatus,
      kind: stance.kind,
      confidence: 0,
      hasModelSignal: false,
      modelLabel: "—",
      edgePct: 0,
    }
  }

  const [modelKey, classifier] = leading
  const hasModelSignal = active.length > 0
  const modelLabel = DESK_MODEL_LABEL[modelKey]
  const confidence = pctInt(classifier.p)
  const edgePct = Math.round(classifier.edge * 1000) / 10

  return {
    label: hasModelSignal
      ? modelKey.toUpperCase()
      : stance.displayStatus,
    kind: hasModelSignal ? modelKind(modelKey) : stance.kind,
    confidence,
    hasModelSignal,
    modelLabel,
    edgePct,
  }
}

function deskSignalGlowClass(
  kind: MarketStateKind,
  isHot: boolean
): string {
  if (isHot && kind === "long") {
    return "bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--color-emerald-500)_38%,transparent),transparent_68%)]"
  }
  if (isHot && kind === "short") {
    return "bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--color-red-500)_38%,transparent),transparent_68%)]"
  }
  if (kind === "wait") {
    return "bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--color-amber-500)_28%,transparent),transparent_68%)]"
  }
  return "bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--foreground)_9%,transparent),transparent_68%)]"
}

function DeskSignalBadge({
  signal,
}: {
  signal: DeskSignalView
}) {
  const isHot =
    signal.hasModelSignal &&
    (signal.kind === "long" || signal.kind === "short")

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="relative ml-auto shrink-0">
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute -inset-x-5 -inset-y-3 rounded-lg opacity-75 blur-lg",
                deskSignalGlowClass(signal.kind, isHot)
              )}
            />
            <div
              className={cn(
                "relative flex items-center gap-1.5 rounded-md border px-2 py-0.5 transition-colors",
                isHot
                  ? "border-foreground/40 bg-foreground text-background"
                  : "border-border/60 bg-background"
              )}
            >
            <span
              className={cn(
                "text-[10px]",
                isHot ? "text-background/70" : "text-muted-foreground"
              )}
            >
              Signal
            </span>
            <span className="text-[10px] font-semibold tracking-wide uppercase">
              {signal.label}
            </span>
            <span
              className={cn(
                "font-mono text-[10px] font-medium tabular-nums",
                isHot ? "text-background/90" : "text-foreground"
              )}
            >
              {signal.confidence}%
            </span>
            </div>
          </div>
        }
      />
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        {signal.hasModelSignal ? (
          <>
            {signal.modelLabel} model signal · {signal.confidence}% confidence
            · edge {signal.edgePct >= 0 ? "+" : ""}
            {signal.edgePct}%
          </>
        ) : (
          <>
            Desk stance {signal.label}
            {signal.confidence > 0
              ? ` · best model ${signal.confidence}% (${signal.modelLabel})`
              : ""}
          </>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

type DeskChromeProps = {
  symbol: string
  live: boolean
  mode: TradingMode
  onModeChange: (mode: TradingMode) => void
  markPrice: number | null
  changePct: number | null
  equityLabel: string | null
  availableLabel: string | null
  marginLabel: string | null
  summary: InsightSummary | null
  prediction: Prediction | null
  highlightBalances?: boolean
  demoBudgetLabel?: string | null
  onDemoBudgetClick?: () => void
}

function ModeToggle({
  mode,
  onModeChange,
  className,
}: {
  mode: TradingMode
  onModeChange: (mode: TradingMode) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative grid h-7 shrink-0 grid-cols-2 rounded-lg bg-muted/40 p-0.5 ring-1 ring-border/35",
        className
      )}
      role="group"
      aria-label="Trading mode"
    >
      {mode === "demo" ? (
        <span
          className="pointer-events-none absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-primary animate-pulse"
          aria-hidden
        />
      ) : null}
      {(["demo", "real"] as const).map((item) => (
        <Button
          key={item}
          type="button"
          size="xs"
          variant="ghost"
          className={cn(
            "relative z-10 h-full min-w-11 rounded-md border-0 px-2 text-[10px] font-semibold capitalize shadow-none hover:bg-transparent",
            mode === item
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/40"
              : "text-muted-foreground/75 hover:text-foreground/85"
          )}
          onClick={() => onModeChange(item)}
        >
          {item}
        </Button>
      ))}
    </div>
  )
}

function DeskChrome({
  symbol,
  live,
  mode,
  onModeChange,
  markPrice,
  changePct,
  equityLabel,
  availableLabel,
  marginLabel,
  summary,
  prediction,
  highlightBalances = false,
  demoBudgetLabel = null,
  onDemoBudgetClick,
}: DeskChromeProps) {
  const stance = summary
    ? getMarketStateActionPresentation(summary.stance)
    : null
  const deskSignal = resolveDeskSignal(prediction, stance)

  const tickerStats = [
    equityLabel ? { key: "equity", label: "Equity", value: equityLabel } : null,
    availableLabel
      ? { key: "avail", label: "Avail", value: availableLabel }
      : null,
    marginLabel ? { key: "margin", label: "Margin", value: marginLabel } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; value: string }>

  return (
    <header className="shrink-0 border-b border-border/60">
      {/* Chrome — symbol + mode (matches hero desk mock) */}
      <div className="flex h-10 min-w-0 items-center justify-between gap-2 border-b border-border/70 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[11px] font-semibold tracking-tight">
            {symbol}-USD
          </span>
          <span className="hidden text-[10px] text-muted-foreground sm:inline">
            Perp
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden items-center gap-1.5 text-[10px] text-muted-foreground sm:inline-flex">
            <span
              className={cn(
                "size-1.5 rounded-full",
                live ? "bg-emerald-500" : "bg-muted-foreground/40"
              )}
            />
            {live ? "Live" : "Connecting"}
          </span>

          {mode === "demo" && demoBudgetLabel && onDemoBudgetClick ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Edit demo budget, ${demoBudgetLabel}`}
                    onClick={onDemoBudgetClick}
                    className="group inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-dashed border-primary/40 bg-primary/5 px-2 text-[10px] transition-all hover:border-primary/60 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <WalletIcon className="size-3 shrink-0 text-primary/75" />
                    <span className="font-mono font-semibold tabular-nums text-foreground">
                      {demoBudgetLabel}
                    </span>
                    <PencilLineIcon className="size-2.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </button>
                }
              />
              <TooltipContent side="bottom">Edit demo budget</TooltipContent>
            </Tooltip>
          ) : null}

          <ModeToggle mode={mode} onModeChange={onModeChange} />
        </div>
      </div>

      {/* Ticker — price, account, signal (matches hero desk mock) */}
      <div className="flex h-9 min-w-0 items-center gap-2 overflow-x-auto px-3 sm:gap-x-4 sm:px-4 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 items-baseline gap-1.5 sm:gap-2">
          <span className="font-mono text-[13px] font-semibold tabular-nums tracking-tight sm:text-sm">
            {markPrice != null ? formatTradingPrice(markPrice) : "—"}
          </span>
          {changePct != null ? (
            <span
              className={cn(
                "shrink-0 font-mono text-[10px] tabular-nums",
                changePct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(2)}%
            </span>
          ) : null}
        </div>

        {tickerStats.map((stat) => (
          <div
            key={stat.key}
            data-slot="desk-wallet-balance"
            className={cn(
              "flex shrink-0 items-baseline gap-1.5 transition-colors",
              stat.key === "margin" && "hidden lg:flex",
              stat.key === "equity" && "hidden sm:flex",
              stat.key === "avail" && "flex",
              highlightBalances && "rounded px-1.5 py-0.5 bg-primary/10 ring-1 ring-primary/25"
            )}
          >
            <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            <span className="font-mono text-[10px] tabular-nums text-foreground/90">
              {stat.value}
            </span>
          </div>
        ))}

        <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground sm:hidden">
          <span
            className={cn(
              "size-1.5 rounded-full",
              live ? "bg-emerald-500" : "bg-muted-foreground/40"
            )}
          />
          {live ? "Live" : "…"}
        </span>

        {deskSignal ? <DeskSignalBadge signal={deskSignal} /> : null}
      </div>
    </header>
  )
}

export { DeskChrome }
