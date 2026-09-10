import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Fixed heights shared by the desk mock and its loading skeleton. The mock is
 * lazy-loaded, so both have to resolve to the exact same box or the hero
 * shifts when the chunk lands.
 */
const DESK_CHROME_H = "h-10"
const DESK_TICKER_H = "h-9"
/** Taller on phones — room for bottom tabs, step hint, trade form, and IRIS chat. */
const DESK_BODY_H = "h-[32rem] sm:h-[26rem] lg:h-[32rem] xl:h-[32rem] 2xl:h-[30rem]"
const DESK_FOOTER_H = "h-[4.5rem]"

const DESK_FRAME_CLASS =
  "relative w-full overflow-hidden rounded-xl border border-border/50 bg-card/80 text-card-foreground shadow-none backdrop-blur-md contain-layout contain-style"

/** In-frame tab pill — muted card tones, not app-shell background. */
const DESK_TAB_ACTIVE =
  "border border-border/60 bg-muted/30 dark:bg-muted/20"

/** Same box as `HeroDeskMock`, rendered until its chunk is ready. */
function HeroDeskSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(DESK_FRAME_CLASS, className)} aria-hidden>
      <div
        className={cn(
          DESK_CHROME_H,
          "flex items-center justify-between border-b border-border/70 px-3 sm:px-4"
        )}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>

      <div
        className={cn(
          DESK_TICKER_H,
          "flex items-center gap-5 border-b border-border/60 px-3 sm:px-4"
        )}
      >
        <Skeleton className="h-3 w-20" />
        <Skeleton className="hidden h-3 w-40 lg:block" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>

      <div
        className={cn(
          DESK_BODY_H,
          "flex min-h-0 flex-col sm:grid sm:grid-cols-[11rem_minmax(0,1fr)] lg:grid-cols-[12.5rem_minmax(0,1fr)_13.5rem]"
        )}
      >
        <div className="order-2 hidden flex-col gap-2 border-border/70 p-3 sm:order-0 sm:flex lg:border-r">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="mt-auto h-8 w-full" />
        </div>
        <div className="order-1 flex min-h-0 flex-1 flex-col sm:order-0 sm:flex-none sm:border-b-0 lg:border-r lg:border-b-0">
          <Skeleton className="size-full min-h-32" />
        </div>
        <div className="order-2 shrink-0 border-t border-border/70 px-3 py-2 sm:hidden">
          <Skeleton className="mx-auto h-9 max-w-md w-full" />
          <Skeleton className="mx-auto mt-2 h-8 max-w-sm w-full" />
        </div>
        <div className="hidden min-h-0 flex-col lg:flex">
          <Skeleton className="h-28 w-full shrink-0" />
          <Skeleton className="mt-auto h-36 w-full shrink-0" />
        </div>
      </div>

      <div
        className={cn(
          DESK_FOOTER_H,
          "hidden border-t border-border/70 px-3 py-3 sm:block sm:px-4"
        )}
      >
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-3 w-full" />
      </div>
    </div>
  )
}

export {
  DESK_BODY_H,
  DESK_CHROME_H,
  DESK_FOOTER_H,
  DESK_FRAME_CLASS,
  DESK_TAB_ACTIVE,
  DESK_TICKER_H,
  HeroDeskSkeleton,
}
