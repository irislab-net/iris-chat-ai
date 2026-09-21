"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { Dashboard, DashboardSkeleton } from "@/components/dashboard/dashboard"
import { cn } from "@/lib/utils"
import type { InsightHome, NewsHome } from "@/lib/api/types"
import {
  resolveWorkspaceTab,
  WORKSPACE_TAB_NEWS,
  type WorkspaceTab,
} from "@/lib/workspace-tab"
import { useIsDesktop } from "@/hooks/use-media-query"

type HomeViewProps = {
  initialInsight?: InsightHome | null
  initialNews?: NewsHome | null
  initialTab?: WorkspaceTab | null
}

function HomeViewInner({
  initialInsight = null,
  initialNews = null,
  initialTab = null,
}: HomeViewProps) {
  const isDesktop = useIsDesktop()
  const searchParams = useSearchParams()
  const tab = resolveWorkspaceTab(
    searchParams.get("tab"),
    initialTab ?? WORKSPACE_TAB_NEWS
  )

  const isMobile = isDesktop !== true
  const mobileSection = isMobile ? tab : null
  const mobileWorkspace = isMobile && mobileSection === WORKSPACE_TAB_NEWS
  const desktopNews = !isMobile && tab === WORKSPACE_TAB_NEWS

  return (
    <div
      className={cn(
        "flex min-h-full w-full flex-1 flex-col",
        (desktopNews || mobileWorkspace) && "h-full min-h-0"
      )}
    >
      <Dashboard
        initialInsight={initialInsight}
        initialNews={initialNews}
        mobileSection={mobileSection}
        preferIntel={desktopNews}
      />
    </div>
  )
}

function HomeViewFallback({
  initialTab: _initialTab = WORKSPACE_TAB_NEWS,
}: Pick<HomeViewProps, "initialTab">) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <DashboardSkeleton />
    </div>
  )
}

function HomeView(props: HomeViewProps) {
  return (
    <React.Suspense
      fallback={<HomeViewFallback initialTab={props.initialTab} />}
    >
      <HomeViewInner {...props} />
    </React.Suspense>
  )
}

export { HomeView }
