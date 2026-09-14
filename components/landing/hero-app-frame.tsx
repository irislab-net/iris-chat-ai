import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const APP_CHROME_H = "h-10 sm:h-11"
const APP_MAIN_H = "h-[24rem] sm:h-[26rem] lg:h-[26rem]"

const APP_FRAME_CLASS = cn(
  "relative w-full overflow-hidden rounded-[1.75rem]",
  "border border-border/50 bg-card/90 text-card-foreground",
  "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),0_18px_40px_-18px_rgba(0,0,0,0.28)]",
  "dark:shadow-[0_2px_10px_-2px_rgba(255,255,255,0.06),0_20px_48px_-16px_rgba(255,255,255,0.16)]",
  "ring-1 ring-border/30 backdrop-blur-xl backdrop-saturate-150",
  "contain-layout contain-style"
)

function HeroAppSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(APP_FRAME_CLASS, className)} aria-hidden>
      <div
        className={cn(
          APP_CHROME_H,
          "flex items-center justify-between gap-3 border-b border-border/50 px-3 sm:px-4"
        )}
      >
        <Skeleton className="h-6 w-12 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>

      <div className={cn(APP_MAIN_H, "flex min-h-0 flex-col p-3 sm:p-4")}>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-3 h-24 w-full rounded-2xl" />
        <Skeleton className="mt-2 h-3 w-16" />
        <Skeleton className="mt-2 h-14 w-full rounded-2xl" />
        <Skeleton className="mt-2 h-14 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export { APP_CHROME_H, APP_FRAME_CLASS, APP_MAIN_H, HeroAppSkeleton }
