import { Bone } from "@/components/app-shell/shell-skeletons"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function NewsRowSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Bone className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Bone className="h-2.5 w-28" />
        <Bone className="h-3.5 w-[88%]" />
        <Bone className="h-3 w-[70%]" />
      </div>
    </div>
  )
}

function NewsBulletinSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-5"
      aria-busy="true"
      aria-label="Loading headlines"
    >
      <div className="space-y-3 rounded-2xl bg-muted/18 px-4 py-3">
        <div className="flex justify-between">
          <Bone className="h-2.5 w-12" />
          <Bone className="h-2.5 w-28" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <Bone className="h-16 rounded-lg" />
          <Bone className="h-16 rounded-lg" />
          <Bone className="h-16 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Bone className="h-14 rounded-xl" />
          <Bone className="h-14 rounded-xl" />
          <Bone className="h-14 rounded-xl" />
          <Bone className="h-14 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3 rounded-2xl bg-muted/18 p-4">
        <Bone className="h-5 w-20 rounded-full" />
        <Bone className="h-5 w-[86%]" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-[74%]" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }, (_, index) => (
          <NewsRowSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

function DistanceRowSkeleton() {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between gap-2">
        <Bone className="h-2.5 w-16" />
        <Bone className="h-2.5 w-20" />
      </div>
      <Bone className="h-1.5 w-full rounded-full" />
    </div>
  )
}

function AnalysisAsideSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex h-full min-h-0 flex-1 flex-col", className)}
      aria-busy="true"
      aria-label="Loading analysis"
    >
      <header className="flex h-12 shrink-0 items-center bg-muted/18 pr-3 pl-5">
        <div className="space-y-1.5">
          <Bone className="h-3.5 w-16" />
          <Bone className="h-2.5 w-28" />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden p-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-4 rounded-2xl bg-muted/18 p-3">
            <div className="space-y-3">
              <Bone className="h-2.5 w-24" />
              {Array.from({ length: 4 }, (_, index) => (
                <DistanceRowSkeleton key={index} />
              ))}
            </div>
            <div className="space-y-3">
              <Bone className="h-2.5 w-20" />
              <div className="flex justify-between">
                <Bone className="h-2.5 w-16" />
                <Bone className="h-2.5 w-16" />
              </div>
              <Bone className="h-2.5 w-full rounded-full" />
              <div className="flex justify-between">
                <Bone className="h-2.5 w-10" />
                <Bone className="h-2.5 w-20" />
                <Bone className="h-2.5 w-10" />
              </div>
              <Bone className="h-9 w-full rounded-lg" />
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-muted/18 p-3">
            <div className="flex justify-between gap-2">
              <Bone className="h-2.5 w-14" />
              <Bone className="h-2.5 w-28" />
            </div>
            {Array.from({ length: 4 }, (_, index) => (
              <Bone key={index} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalysisPanelSkeleton({
  embedded = false,
  aside = false,
  mobile = false,
}: {
  embedded?: boolean
  aside?: boolean
  mobile?: boolean
}) {
  if (aside) return <AnalysisAsideSkeleton />

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        mobile ? "gap-3" : "gap-5"
      )}
      aria-busy="true"
      aria-label="Loading analysis"
    >
      {embedded || mobile ? null : (
        <div className="space-y-2">
          <Bone className="h-3.5 w-20" />
          <Bone className="h-3 w-56" />
        </div>
      )}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4",
          !mobile && "lg:grid lg:grid-cols-2 lg:gap-6"
        )}
      >
        <div className="flex flex-col gap-4 rounded-2xl bg-muted/18 p-3">
          <Bone className="h-3 w-28" />
          <Bone className="h-2 w-full" />
          <Bone className="h-2 w-[80%]" />
          <Bone className="h-2 w-[64%]" />
          <div className="mt-auto space-y-2">
            <Bone className="h-9 w-full rounded-xl" />
            <Bone className="h-9 w-full rounded-xl" />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-muted/18 p-3">
          <Bone className="h-3 w-16" />
          {Array.from({ length: 4 }, (_, index) => (
            <Bone key={index} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroPulseSkeleton() {
  return (
    <Card className="shrink-0" aria-busy="true" aria-label="Loading market state">
      <CardContent className="space-y-4 p-5 md:p-6">
        <div className="flex justify-between px-1">
          <Bone className="h-2.5 w-20" />
          <Bone className="h-2.5 w-16" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(14rem,17rem)]">
          <div className="space-y-3 rounded-lg bg-muted/45 px-4 py-4 md:px-5 md:py-5">
            <div className="flex gap-2">
              <Bone className="h-6 w-16 rounded-full" />
              <Bone className="h-6 w-14 rounded-full" />
              <Bone className="h-6 w-20 rounded-full" />
            </div>
            <Bone className="h-5 w-[78%]" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-[72%]" />
          </div>
          <div className="space-y-3">
            <Bone className="h-3 w-24" />
            <Bone className="h-2 w-full" />
            <Bone className="h-2 w-[86%]" />
            <Bone className="h-2 w-[60%]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IntelWorkspaceSkeleton({
  panel = "news",
  mobile = false,
  className,
}: {
  panel?: "news" | "analysis"
  mobile?: boolean
  className?: string
}) {
  return (
    <Card
      data-slot="context-workspace"
      className={cn(
        "min-h-0 flex-1 gap-0 overflow-hidden border-0 bg-transparent py-0 shadow-none",
        className
      )}
      aria-busy="true"
      aria-label={panel === "analysis" ? "Loading analysis" : "Loading news"}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {mobile ? (
          <div className="flex shrink-0 items-center justify-between gap-2 bg-muted/12 px-3 py-2.5">
            <div className="space-y-1.5">
              <Bone className="h-4 w-16" />
              <Bone className="h-3 w-28" />
            </div>
            {panel === "news" ? <Bone className="h-8 w-16 rounded-md" /> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4 border-b border-border/50 px-4 pt-5 pb-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Bone className="h-2.5 w-10" />
                <Bone className="h-5 w-16" />
                <Bone className="h-3 w-56" />
              </div>
              <div className="flex items-center gap-2">
                <Bone className="h-5 w-14 rounded-md" />
                <Bone className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        )}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            mobile ? "px-3 py-3 pb-24" : "px-4 py-5 sm:px-6"
          )}
        >
          {panel === "analysis" ? (
            <AnalysisPanelSkeleton embedded mobile={mobile} />
          ) : (
            <NewsBulletinSkeleton />
          )}
        </div>
      </div>
    </Card>
  )
}

export {
  AnalysisAsideSkeleton,
  AnalysisPanelSkeleton,
  HeroPulseSkeleton,
  IntelWorkspaceSkeleton,
  NewsBulletinSkeleton,
}
