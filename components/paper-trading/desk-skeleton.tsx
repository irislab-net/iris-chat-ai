import { Bone } from "@/components/app-shell/shell-skeletons"
import { cn } from "@/lib/utils"

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const

/** Close path 0–100 from the bottom of the pane. */
const CLOSES = [
  38, 41, 39, 44, 48, 46, 51, 54, 50, 47, 43, 46, 52, 57, 55, 50, 47, 51, 56,
  60, 58, 53, 49, 52, 57, 61, 59, 55, 52, 56, 62, 65, 63, 58, 54, 57,
] as const

const VOLUMES = [
  42, 28, 55, 36, 70, 31, 48, 62, 24, 40, 58, 33, 72, 45, 29, 51, 38, 64, 27,
  46, 59, 34, 41, 53, 22, 67, 39, 44, 30, 56, 48, 35, 61, 26, 43, 50,
] as const

function skeletonCandle(index: number) {
  const close = CLOSES[index] ?? 50
  const prev = CLOSES[index - 1] ?? close
  const open = prev
  const wick = 2.5 + (index % 5)
  return {
    open,
    close,
    high: Math.min(96, Math.max(open, close) + wick),
    low: Math.max(8, Math.min(open, close) - wick * 0.7),
    up: close >= open,
  }
}

function SkeletonCandle({ index }: { index: number }) {
  const { open, close, high, low, up } = skeletonCandle(index)
  const bodyTop = 100 - Math.max(open, close)
  const bodyH = Math.max(Math.abs(close - open), 1.4)
  const wickTop = 100 - high
  const wickH = Math.max(high - low, 2)
  return (
    <div className="relative h-full min-w-0 flex-1">
      <div
        className="absolute left-1/2 w-px -translate-x-1/2 bg-foreground/20"
        style={{ top: `${wickTop}%`, height: `${wickH}%` }}
      />
      <div
        className={cn(
          "absolute left-1/2 w-[55%] min-w-px max-w-2 -translate-x-1/2",
          up ? "bg-foreground/22" : "bg-foreground/10"
        )}
        style={{ top: `${bodyTop}%`, height: `${bodyH}%` }}
      />
    </div>
  )
}

function ChartPaneSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative min-h-0 flex-1 overflow-hidden bg-background", className)}
    >
      <div className="absolute inset-x-3 inset-y-5 right-12 flex flex-col justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-px w-full bg-border/50" />
        ))}
      </div>
      <div className="absolute inset-y-5 right-3 flex w-8 flex-col justify-between">
        <Bone className="h-2 w-8" />
        <Bone className="h-2 w-7" />
        <Bone className="h-2 w-8" />
        <Bone className="h-2 w-6" />
        <Bone className="h-2 w-8" />
      </div>
      <div className="absolute inset-x-3 top-5 right-12 bottom-11 flex">
        {CLOSES.map((_, i) => (
          <SkeletonCandle key={i} index={i} />
        ))}
      </div>
      <div className="absolute inset-x-3 right-12 bottom-2 flex h-7 items-end gap-px">
        {VOLUMES.map((height, i) => (
          <div
            key={i}
            className="min-w-0 flex-1 bg-foreground/6"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function MobileDeskTabsSkeleton() {
  return (
    <div className="shrink-0 border-b border-border/60 bg-background/88 px-3 py-1.5 lg:hidden">
      <div className="grid w-full grid-cols-3 gap-0.5 rounded-lg border border-border/50 bg-muted/20 p-0.5">
        {[52, 44, 36].map((width) => (
          <div
            key={width}
            className="flex h-8 items-center justify-center gap-1 rounded-lg"
          >
            <Bone className="size-3 rounded-sm" />
            <Bone className="h-2" style={{ width }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function DeskChromeSkeleton() {
  return (
    <header className="shrink-0 border-b border-border/60">
      <div className="flex h-10 min-w-0 items-center justify-between gap-2 border-b border-border/70 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Bone className="h-3 w-16" />
          <Bone className="hidden h-2 w-8 sm:block" />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Bone className="hidden h-2 w-8 sm:block" />
          <Bone className="h-7 w-[4.5rem] rounded-md border border-dashed border-primary/20" />
          <Bone className="h-7 w-[5.5rem] rounded-lg" />
        </div>
      </div>
      <div className="flex h-9 min-w-0 items-center gap-2 overflow-hidden px-3 sm:gap-x-4 sm:px-4">
        <div className="flex shrink-0 items-baseline gap-1.5">
          <Bone className="h-3.5 w-20" />
          <Bone className="h-2.5 w-10" />
        </div>
        <Bone className="hidden h-2.5 w-[4.5rem] sm:block" />
        <Bone className="h-2.5 w-14" />
        <Bone className="hidden h-2.5 w-14 lg:block" />
        <Bone className="ml-auto h-6 w-24 shrink-0 rounded-md" />
      </div>
    </header>
  )
}

function ChartPaneToolbarSkeleton() {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border/60 px-2 lg:h-8 lg:px-3">
      <Bone className="h-7 w-[7.5rem] shrink-0 rounded-lg lg:hidden" />
      <div className="hidden items-center gap-1 sm:flex">
        <Bone className="h-6 w-6 rounded-md" />
        <Bone className="h-6 w-6 rounded-md" />
        <Bone className="h-6 w-6 rounded-md" />
      </div>
      <div className="flex min-w-0 flex-1 items-end gap-3 overflow-hidden">
        {TIMEFRAMES.map((tf) => (
          <Bone key={tf} className="mb-1.5 h-2 w-5 shrink-0" />
        ))}
      </div>
    </div>
  )
}

function DeskWorkspaceSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="desk-skeleton"
      aria-busy="true"
      aria-label="Loading desk"
      className={cn("flex h-full min-h-0 flex-1 flex-col", className)}
    >
      <MobileDeskTabsSkeleton />
      <DeskChromeSkeleton />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChartPaneToolbarSkeleton />
        <ChartPaneSkeleton />
      </div>

      <div className="flex h-33 shrink-0 flex-col border-t border-border/60 bg-background max-lg:hidden lg:h-50">
        <div className="flex h-8 items-center gap-4 border-b border-border/50 px-3">
          <Bone className="h-2.5 w-16" />
          <Bone className="h-2.5 w-14" />
          <Bone className="h-2.5 w-12" />
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Bone className="h-2.5 w-28" />
        </div>
      </div>
    </div>
  )
}

export { ChartPaneSkeleton, DeskWorkspaceSkeleton }
