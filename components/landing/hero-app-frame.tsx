import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const APP_CHROME_H = "h-10"
const APP_MAIN_H = "h-[22rem] sm:h-[24rem] lg:h-[26rem]"

const APP_FRAME_CLASS =
  "relative w-full overflow-hidden rounded-xl border border-border/50 bg-card/80 text-card-foreground shadow-none backdrop-blur-md contain-layout contain-style"

function HeroAppSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(APP_FRAME_CLASS, className)} aria-hidden>
      <div
        className={cn(
          APP_CHROME_H,
          "flex items-center justify-between border-b border-border/70 px-3 sm:px-4"
        )}
      >
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      <div
        className={cn(
          APP_MAIN_H,
          "grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_17rem]"
        )}
      >
        <div className="flex min-h-0 flex-col border-b border-border/60 lg:border-b-0 lg:border-r">
          <Skeleton className="mx-3 mt-3 h-3 w-24 sm:mx-4" />
          <div className="space-y-2 px-3 py-3 sm:px-4">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="hidden h-14 w-full rounded-xl sm:block" />
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <Skeleton className="mx-3 mt-3 h-8 w-32" />
          <Skeleton className="mx-3 mt-auto mb-3 h-10 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export { APP_CHROME_H, APP_FRAME_CLASS, APP_MAIN_H, HeroAppSkeleton }
