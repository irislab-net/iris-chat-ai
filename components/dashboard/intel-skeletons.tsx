"use client"

import { useTranslations } from "next-intl"

import {
  chatNewsGlassCardClass,
  chatNewsGlassTileClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
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

/** Lead / feed card bones — same glass plate + spacing as NewsCard (mobile/sidebar). */
function NewsCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className={cn(chatNewsGlassCardClass, "px-4 pt-4 pb-4")}>
      <div className="flex items-start gap-2.5">
        <Bone
          className={cn(
            "shrink-0 rounded-full",
            featured ? "size-11" : "size-9"
          )}
        />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <Bone
            className={cn(
              "w-[92%] rounded-full",
              featured ? "h-5" : "h-4"
            )}
          />
          {featured ? <Bone className="h-5 w-[70%] rounded-full" /> : null}
        </div>
      </div>
      <div className={cn("space-y-2", featured ? "mt-3" : "mt-2.5")}>
        <Bone className="h-3 w-full rounded-full" />
        <Bone className="h-3 w-[88%] rounded-full" />
        {featured ? <Bone className="h-3 w-[64%] rounded-full" /> : null}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Bone className="h-7 w-16 rounded-full" />
        <Bone className="h-7 w-7 rounded-full" />
        <Bone className="h-7 w-7 rounded-full" />
      </div>
    </div>
  )
}

function NewsBulletinSkeleton({
  sidebar = false,
  glass = false,
}: {
  /** Chat news layout: tape + lead + feed (mirrors NewsHeadlineList). */
  sidebar?: boolean
  /** Desk / mobile glass News layout — grid tape matching live UI. */
  glass?: boolean
}) {
  const t = useTranslations("dashboard")
  const useGlassLayout = sidebar || glass

  if (useGlassLayout) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col gap-10 pt-2 sm:pt-3"
        aria-busy="true"
        aria-label={t("loadingNews")}
      >
        {/* Asset tape — NewsAssetTape grid-cols-2 */}
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className={cn(chatNewsGlassTileClass, "space-y-2 p-3")}
            >
              <div className="flex items-center gap-2">
                <Bone className="size-7 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Bone className="h-2.5 w-10 rounded-full" />
                  <Bone className="h-2 w-16 rounded-full" />
                </div>
              </div>
              <Bone className="h-3 w-14 rounded-full" />
            </div>
          ))}
        </div>

        {/* Window tiles — 3-col NewsTapeWindows */}
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className={cn(chatNewsGlassTileClass, "space-y-2 p-3")}
            >
              <Bone className="h-2.5 w-10 rounded-full" />
              <Bone className="h-6 w-12 rounded-md" />
            </div>
          ))}
        </div>

        {/* Brief card */}
        <div className={cn(chatNewsGlassCardClass, "space-y-3 px-4 py-4")}>
          <div className="flex items-center gap-3">
            <Bone className="size-9 shrink-0 rounded-full" />
            <Bone className="h-4 w-36 rounded-full" />
          </div>
          <Bone className="h-3 w-full rounded-full" />
          <Bone className="h-3 w-[80%] rounded-full" />
        </div>

        <NewsCardSkeleton featured />

        <section className="flex flex-col gap-6">
          <Bone className="h-3 w-16 rounded-full" />
          <NewsCardSkeleton />
          <NewsCardSkeleton />
          <NewsCardSkeleton />
        </section>
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
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-4 pt-5 sm:gap-8 sm:px-6 sm:py-8 sm:pt-10 lg:max-w-4xl">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <Bone className="h-7 w-24 rounded-full sm:h-8 sm:w-28" />
          </div>
          <Bone className="size-10 shrink-0 rounded-full" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <NewsBulletinSkeleton sidebar={mobile} glass={mobile} />
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
