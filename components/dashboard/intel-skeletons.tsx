"use client"

import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/55", className)}
      aria-hidden
    />
  )
}

function NewsBulletinSkeleton({
  sidebar = false,
}: {
  /** Chat news layout: lead + feed rows (bones only — no real card chrome). */
  sidebar?: boolean
}) {
  const t = useTranslations("dashboard")

  if (sidebar) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col gap-4"
        aria-busy="true"
        aria-label={t("loadingNews")}
      >
        {/* Lead — mirrors featured sidebar card spacing */}
        <div className="flex flex-col gap-2.5 px-1 py-1 sm:px-0.5">
          <Bone className="h-4 w-10 rounded-full" />
          <div className="flex items-start gap-2.5">
            <Bone className="size-9 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <Bone className="h-4 w-[92%]" />
              <Bone className="h-4 w-[68%]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-[90%]" />
            <Bone className="h-3 w-[55%]" />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Bone className="size-7 rounded-full" />
            <Bone className="size-7 rounded-full" />
            <Bone className="ms-auto h-2.5 w-14" />
          </div>
        </div>

        {/* Feed rows */}
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-1.5 px-1 py-1 sm:px-0.5"
          >
            <div className="flex items-start gap-2">
              <Bone className="size-8 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <Bone className="h-3.5 w-[88%]" />
                <Bone className="h-3.5 w-[52%]" />
              </div>
            </div>
            <div className="space-y-1.5 ps-10">
              <Bone className="h-2.5 w-full" />
              <Bone className="h-2.5 w-[70%]" />
            </div>
            <div className="flex items-center gap-2 ps-10">
              <Bone className="size-7 rounded-full" />
              <Bone className="size-7 rounded-full" />
              <Bone className="ms-auto h-2.5 w-12" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" aria-busy="true">
      <div className="space-y-2">
        <Bone className="h-3.5 w-28" />
        <Bone className="h-3 w-48" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex gap-3 rounded-2xl p-3">
            <Bone className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-3 w-[88%]" />
              <Bone className="h-2.5 w-[64%]" />
              <Bone className="h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function IntelWorkspaceSkeleton({
  panel: _panel = "news",
  mobile = false,
  className,
}: {
  panel?: "news" | "analysis"
  mobile?: boolean
  className?: string
}) {
  const t = useTranslations("dashboard")

  return (
    <Card
      data-slot="context-workspace"
      className={cn(
        "min-h-0 flex-1 gap-0 overflow-hidden border-0 bg-transparent py-0 shadow-none",
        className
      )}
      aria-busy="true"
      aria-label={t("loadingNews")}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {mobile ? (
          <div className="flex shrink-0 items-center justify-between gap-2 bg-muted/12 px-3 py-2.5">
            <div className="space-y-1.5">
              <Bone className="h-4 w-16" />
              <Bone className="h-3 w-28" />
            </div>
            <Bone className="h-8 w-16 rounded-md" />
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
          <NewsBulletinSkeleton />
        </div>
      </div>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <IntelWorkspaceSkeleton panel="news" />
    </div>
  )
}

export { IntelWorkspaceSkeleton, NewsBulletinSkeleton, DashboardSkeleton }
