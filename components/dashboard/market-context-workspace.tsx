"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import {
  NewsBulletin,
  NewsReadAllButton,
} from "@/components/dashboard/news-bulletin"
import { IntelWorkspaceSkeleton } from "@/components/dashboard/intel-skeletons"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useIsDesktop } from "@/hooks/use-media-query"
import type {
  InsightSummary,
  NewsAnalytics,
  NewsItem,
  Prediction,
} from "@/lib/api/types"
import { cn } from "@/lib/utils"
import {
  resolveWorkspaceTab,
  WORKSPACE_TAB_NEWS,
  type WorkspaceTab,
} from "@/lib/workspace-tab"

type MarketContextWorkspaceProps = {
  symbol: string
  timeframe: string
  summary: InsightSummary | null
  prediction: Prediction | null
  analytics: NewsAnalytics | null
  news: NewsItem[]
  newsLoading?: boolean
  analysisLoading?: boolean
  freshnessLabel: string
  insightFreshnessLabel?: string
  isAuthenticated?: boolean
  authLoading?: boolean
  /** When set (mobile section nav), lock to that panel and fill height. */
  mobileSection?: WorkspaceTab | null
  /** Desktop News — Suspense fallback should not be the desk chart. */
  preferIntel?: boolean
}

function MarketContextWorkspaceInner({
  analytics,
  news,
  newsLoading = false,
  freshnessLabel,
  mobileSection = null,
  isAuthenticated = false,
  authLoading = false,
}: MarketContextWorkspaceProps) {
  const t = useTranslations("dashboard")
  const isDesktop = useIsDesktop()
  const searchParams = useSearchParams()
  const tabFromUrl = resolveWorkspaceTab(searchParams.get("tab"))
  const tab: WorkspaceTab = mobileSection ?? tabFromUrl
  const isMobileNews = isDesktop === false && tab === WORKSPACE_TAB_NEWS
  const mobileScrollClass =
    "min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-3 py-3 pb-24"

  return (
    <Card
      data-slot="context-workspace"
      aria-label={t("marketNews")}
      className="h-full min-h-0 flex-1 gap-0 overflow-hidden border-0 bg-transparent py-0 shadow-none"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {isMobileNews ? null : (
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border/50 px-4 pt-5 pb-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                Exur
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">
                {t("newsTitle")}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {t("newsSubtitle")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <NewsReadAllButton news={news} />
              <Badge
                variant="secondary"
                className="font-mono text-xs font-normal"
              >
                {freshnessLabel}
              </Badge>
            </div>
          </header>
        )}
        <div
          className={cn(
            isMobileNews
              ? mobileScrollClass
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 [-webkit-overflow-scrolling:touch] sm:px-6"
          )}
        >
          <NewsBulletin
            analytics={analytics}
            news={news}
            loading={newsLoading}
            freshnessLabel={freshnessLabel}
            embedded
            active
            mobile={isMobileNews}
            isAuthenticated={isAuthenticated}
            authLoading={authLoading}
          />
        </div>
      </div>
    </Card>
  )
}

function MarketContextWorkspaceFallback({
  preferIntel: _preferIntel = false,
}: Pick<MarketContextWorkspaceProps, "preferIntel">) {
  return <IntelWorkspaceSkeleton panel="news" />
}

function MarketContextWorkspace(props: MarketContextWorkspaceProps) {
  return (
    <React.Suspense
      fallback={
        <MarketContextWorkspaceFallback preferIntel={props.preferIntel} />
      }
    >
      <MarketContextWorkspaceInner {...props} />
    </React.Suspense>
  )
}

export { MarketContextWorkspace }
