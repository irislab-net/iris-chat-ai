"use client"

import * as React from "react"

import { Dashboard, DashboardSkeleton } from "@/components/dashboard/dashboard"
import { cn } from "@/lib/utils"
import type { NewsHome } from "@/lib/api/types"
import { useIsDesktop } from "@/hooks/use-media-query"

type HomeViewProps = {
  initialNews?: NewsHome | null
}

function HomeViewInner({ initialNews = null }: HomeViewProps) {
  const isDesktop = useIsDesktop()
  const isMobile = isDesktop !== true

  return (
    <div
      className={cn(
        "flex min-h-full w-full flex-1 flex-col",
        "h-full min-h-0"
      )}
    >
      <Dashboard initialNews={initialNews} mobile={isMobile} />
    </div>
  )
}

function HomeViewFallback() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <DashboardSkeleton />
    </div>
  )
}

function HomeView(props: HomeViewProps) {
  return (
    <React.Suspense fallback={<HomeViewFallback />}>
      <HomeViewInner {...props} />
    </React.Suspense>
  )
}

export { HomeView }
