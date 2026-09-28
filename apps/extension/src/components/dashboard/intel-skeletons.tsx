"use client"

import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn("chat-skeleton-shimmer rounded-md", className)}
      aria-hidden
    />
  )
}

function NewsBulletinSkeleton({
  sidebar = false,
}: {
  /** Chat news layout: lead + feed rows (flat shimmer matching card layers). */
  sidebar?: boolean
}) {
  const t = useTranslations("dashboard")

  if (sidebar) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col gap-3"
        aria-busy="true"
        aria-label={t("loadingNews")}
      >
        <Bone className="h-44 w-full rounded-[1.75rem]" />
        {Array.from({ length: 5 }, (_, index) => (
          <Bone key={index} className="h-24 w-full rounded-[1.75rem]" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" aria-busy="true">
      <div className="space-y-2">
        <Bone className="h-3.5 w-28 rounded-full" />
        <Bone className="h-3 w-48 rounded-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Bone key={index} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

function IntelWorkspaceSkeleton({
  mobile = false,
  className,
}: {
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
          <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5">
            <Bone className="h-8 w-28 rounded-full" />
            <Bone className="h-8 w-16 rounded-full" />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-6">
            <Bone className="h-10 w-40 rounded-full" />
            <div className="flex items-center gap-2">
              <Bone className="h-7 w-14 rounded-full" />
              <Bone className="h-7 w-20 rounded-full" />
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
      <IntelWorkspaceSkeleton />
    </div>
  )
}

export { IntelWorkspaceSkeleton, NewsBulletinSkeleton, DashboardSkeleton }
