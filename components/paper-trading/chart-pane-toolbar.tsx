"use client"

import {
  CandlestickChartIcon,
  LayoutListIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ChartOverlayToggles,
  type ChartOverlayToolState,
} from "@/components/paper-trading/chart-overlay-toggles"
import { hyperliquidInterval } from "@/lib/api/candles"
import { cn } from "@/lib/utils"

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const

type ChartPaneView = "chart" | "book"

type ChartPaneToolbarProps = {
  view: ChartPaneView
  onViewChange: (view: ChartPaneView) => void
  timeframe: string
  onTimeframeChange: (timeframe: string) => void
  bookDisabled?: boolean
  overlayTools?: ChartOverlayToolState[]
  className?: string
}

function ChartPaneToolbar({
  view,
  onViewChange,
  timeframe,
  onTimeframeChange,
  bookDisabled = false,
  overlayTools = [],
  className,
}: ChartPaneToolbarProps) {
  const activeIndex = view === "chart" ? 0 : 1

  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 border-b border-border/60 px-2 lg:h-8 lg:px-3",
        className
      )}
    >
      <div
        role="tablist"
        aria-label="Market view"
        className="relative grid h-7 w-(7.5rem) shrink-0 grid-cols-2 rounded-lg bg-muted/40 p-0.5 ring-1 ring-border/35 lg:hidden"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-md bg-background shadow-sm transition-transform duration-200 ease-out"
          style={{
            width: "calc(50% - 2px)",
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 2}px))`,
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="xs"
          role="tab"
          aria-selected={view === "chart"}
          className={cn(
            "relative z-10 h-full min-w-0 gap-1 rounded-md border-0 px-1.5 text-[10px] font-semibold shadow-none hover:bg-transparent",
            view === "chart"
              ? "text-foreground"
              : "text-muted-foreground/75 hover:text-foreground/85"
          )}
          onClick={() => onViewChange("chart")}
        >
          <CandlestickChartIcon className="size-3 shrink-0" aria-hidden />
          Chart
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          role="tab"
          aria-selected={view === "book"}
          disabled={bookDisabled}
          className={cn(
            "relative z-10 h-full min-w-0 gap-1 rounded-md border-0 px-1.5 text-[10px] font-semibold shadow-none hover:bg-transparent",
            view === "book"
              ? "text-foreground"
              : "text-muted-foreground/75 hover:text-foreground/85"
          )}
          onClick={() => onViewChange("book")}
        >
          <LayoutListIcon className="size-3 shrink-0" aria-hidden />
          Book
        </Button>
      </div>

      <ChartOverlayToggles tools={overlayTools} />

      {view === "chart" ? (
        <div
          className="flex min-w-0 flex-1 items-end gap-3 overflow-x-auto"
          role="group"
          aria-label="Timeframe"
        >
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf}
              type="button"
              size="xs"
              variant="ghost"
              className={cn(
                "relative h-7 shrink-0 rounded-none px-0 font-mono text-[11px] uppercase text-muted-foreground hover:bg-transparent hover:text-foreground lg:h-6",
                hyperliquidInterval(timeframe) === tf &&
                  "pointer-events-none text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-foreground"
              )}
              onClick={() => onTimeframeChange(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      ) : (
        <p className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground lg:hidden">
          Live order book
        </p>
      )}
    </div>
  )
}

export { ChartPaneToolbar, type ChartPaneView }
