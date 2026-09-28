"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  NewsBulletin,
  NewsReadAllButton,
} from "@/components/dashboard/news-bulletin"
import { IntelWorkspaceSkeleton } from "@/components/dashboard/intel-skeletons"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { NewsAnalytics, NewsItem } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type MarketContextWorkspaceProps = {
  analytics: NewsAnalytics | null
  news: NewsItem[]
  newsLoading?: boolean
  freshnessLabel: string
  /** Mobile — compact chrome and fill-height scroll. */
  mobile?: boolean
}

function MarketContextWorkspaceInner({
  analytics,
  news,
  newsLoading = false,
  freshnessLabel,
  mobile = false,
}: MarketContextWorkspaceProps) {
  const t = useTranslations("dashboard")
  const mobileScrollClass =
    "min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-3 py-3 pb-24"

  return (
    <Card
      data-slot="context-workspace"
      aria-label={t("marketNews")}
      className="h-full min-h-0 flex-1 gap-0 overflow-hidden border-0 bg-transparent py-0 shadow-none"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {mobile ? null : (
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
            mobile
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
            mobile={mobile}
          />
        </div>
      </div>
    </Card>
  )
}

function MarketContextWorkspace(props: MarketContextWorkspaceProps) {
  return (
    <React.Suspense fallback={<IntelWorkspaceSkeleton />}>
      <MarketContextWorkspaceInner {...props} />
    </React.Suspense>
  )
}

export { MarketContextWorkspace }
