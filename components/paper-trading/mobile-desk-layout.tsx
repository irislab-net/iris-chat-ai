"use client"

import * as React from "react"
import {
  CandlestickChartIcon,
  LayoutListIcon,
  ReceiptIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type MobileDeskPane = "chart" | "trade" | "portfolio"

type MobileDeskLayoutProps = {
  pane: MobileDeskPane
  onPaneChange: (pane: MobileDeskPane) => void
  placing?: boolean
  positionsCount?: number
  ordersCount?: number
  chart: React.ReactNode
  trade: React.ReactNode
  portfolio: React.ReactNode
  /** In-flow strip below tabs (e.g. symbol bar) — not sticky. */
  header?: React.ReactNode
  className?: string
}

const PANES: {
  id: MobileDeskPane
  label: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}[] = [
  { id: "chart", label: "Chart", icon: CandlestickChartIcon },
  { id: "trade", label: "Trade", icon: ReceiptIcon },
  { id: "portfolio", label: "Book", icon: LayoutListIcon },
]

function mobileDeskTabClass(active: boolean) {
  return cn(
    "h-8 min-w-0 flex-row items-center justify-center gap-1 rounded-lg border-0 px-2 text-[11px] tracking-tight shadow-none transition-colors hover:bg-transparent active:bg-transparent dark:hover:bg-transparent",
    active
      ? "bg-background font-semibold text-foreground shadow-sm ring-1 ring-border/50"
      : "font-medium text-muted-foreground/70 hover:text-foreground/85"
  )
}

function MobileDeskLayout({
  pane,
  onPaneChange,
  placing = false,
  positionsCount = 0,
  ordersCount = 0,
  chart,
  trade,
  portfolio,
  header,
  className,
}: MobileDeskLayoutProps) {
  React.useEffect(() => {
    if (placing) onPaneChange("chart")
  }, [placing, onPaneChange])

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      {placing ? (
        <div className="shrink-0 border-b border-primary/20 bg-primary/5 px-3 py-2 text-center text-[11px] leading-5 text-muted-foreground">
          Drag on the chart to place your level. Press Esc to cancel.
        </div>
      ) : null}

      {!placing ? (
        <div
          className="shrink-0 border-b border-border/60 bg-background/88 px-3 py-1.5 backdrop-blur-xl backdrop-saturate-150"
          role="tablist"
          aria-label="Desk views"
        >
          <div className="grid w-full grid-cols-3 gap-0.5 rounded-lg border border-border/50 bg-muted/20 p-0.5">
            {PANES.map((item) => {
              const Icon = item.icon
              const active = pane === item.id
              const count =
                item.id === "portfolio"
                  ? positionsCount + ordersCount
                  : 0

              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  className={mobileDeskTabClass(active)}
                  onClick={() => onPaneChange(item.id)}
                >
                  <Icon
                    className={cn(
                      "size-3 shrink-0 transition-[transform,color] duration-200",
                      active
                        ? "stroke-[2.25] text-foreground"
                        : "stroke-[1.75] text-muted-foreground/70"
                    )}
                    aria-hidden
                  />
                  <span className="truncate leading-none">{item.label}</span>
                  {count > 0 ? (
                    <Badge
                      variant={active ? "secondary" : "outline"}
                      className="h-3.5 min-w-3.5 shrink-0 rounded-full px-1 py-0 text-[8px] font-mono leading-none"
                    >
                      {count}
                    </Badge>
                  ) : null}
                </Button>
              )
            })}
          </div>
        </div>
      ) : null}

      {header ? <div className="shrink-0">{header}</div> : null}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 flex flex-col overflow-hidden",
            pane !== "chart" && "hidden"
          )}
        >
          {chart}
        </div>
        <div
          className={cn(
            "absolute inset-0 overflow-y-auto overscroll-contain bg-background [-webkit-overflow-scrolling:touch]",
            pane !== "trade" && "hidden"
          )}
        >
          {trade}
        </div>
        <div
          className={cn(
            "absolute inset-0 flex flex-col overflow-hidden bg-background",
            pane !== "portfolio" && "hidden"
          )}
        >
          {portfolio}
        </div>
      </div>
    </div>
  )
}

export { MobileDeskLayout, type MobileDeskPane }
