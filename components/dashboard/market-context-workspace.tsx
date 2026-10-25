"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  NewsBulletin,
  NewsReadAllButton,
} from "@/components/dashboard/news-bulletin"
import { IntelWorkspaceSkeleton } from "@/components/dashboard/intel-skeletons"
import { DeskPageFrame } from "@/components/desk/desk-page-frame"
import { Badge } from "@/components/ui/badge"
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

  return (
    <div
      data-slot="context-workspace"
      aria-label={t("marketNews")}
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <DeskPageFrame
        pageId="news"
        title={t("newsTitle")}
        badge={
          <div className="flex shrink-0 items-center gap-2">
            {!mobile ? <NewsReadAllButton news={news} /> : null}
            <Badge
              variant="secondary"
              className="font-mono text-xs font-normal"
            >
              {freshnessLabel}
            </Badge>
          </div>
        }
        className={cn(
          "min-h-0 flex-1 gap-6 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] sm:gap-8",
          mobile
            ? "py-4 pt-5 max-lg:pb-[calc(var(--desk-bottom-nav,4.75rem)+1.25rem+env(safe-area-inset-bottom,0px))]"
            : "py-5 sm:py-8"
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
      </DeskPageFrame>
    </div>
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
