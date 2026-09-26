"use client"

import * as React from "react"

import { DashboardSkeleton } from "@/components/dashboard/intel-skeletons"
import { MarketContextWorkspace } from "@/components/dashboard/market-context-workspace"
import { useAuth } from "@/components/auth/auth-provider"
import {
  fetchInsightHome,
  fetchNewsHome,
  fetchNewsLatest,
} from "@/lib/api/data"
import {
  hasUsableInsight,
  hasUsableNews,
  mergeNewsHome,
} from "@/lib/dashboard/intel-load"
import type { InsightHome, NewsHome } from "@/lib/api/types"
import {
  insightUpdatedLabel,
  msUntilNextCandleBoundary,
  NEWS_REFRESH_INTERVAL_MS,
  newsFeedUpdatedLabel,
  shouldRefreshAfterResume,
  shouldRefreshNewsAfterResume,
} from "@/lib/format"
import { cn } from "@/lib/utils"

type DashboardProps = {
  /** Guest-safe SSR snapshot from the public API (optional). */
  initialInsight?: InsightHome | null
  initialNews?: NewsHome | null
  /**
   * Mobile bottom-nav section. `null` = desktop (show full stack).
   * tab ids = workspace panel only.
   */
  mobileSection?: "news" | null
  showWorkspace?: boolean
  preferIntel?: boolean
}

function Dashboard({
  initialInsight = null,
  initialNews = null,
  mobileSection = null,
  showWorkspace = true,
  preferIntel = false,
}: DashboardProps) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [insight, setInsight] = React.useState<InsightHome | null>(
    initialInsight
  )
  const [news, setNews] = React.useState<NewsHome | null>(initialNews)
  const [insightReady, setInsightReady] = React.useState(() =>
    hasUsableInsight(initialInsight)
  )
  const [newsReady, setNewsReady] = React.useState(() =>
    hasUsableNews(initialNews)
  )
  const [nowMs, setNowMs] = React.useState(() => Date.now())
  const mountedRef = React.useRef(true)
  const insightInFlightRef = React.useRef(false)
  const newsInFlightRef = React.useRef(false)
  const lastInsightFetchAtRef = React.useRef<number | null>(null)
  const lastNewsFetchAtRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    mountedRef.current = true
    const now = Date.now()
    if (initialInsight) lastInsightFetchAtRef.current = now
    if (initialNews) lastNewsFetchAtRef.current = now
    return () => {
      mountedRef.current = false
    }
  }, [initialInsight, initialNews])

  const loadInsight = React.useEffectEvent(async () => {
    if (insightInFlightRef.current) return
    insightInFlightRef.current = true
    try {
      const insightData = await fetchInsightHome().catch(() => null)
      if (!mountedRef.current) return
      lastInsightFetchAtRef.current = Date.now()
      if (insightData) setInsight(insightData)
    } catch {
      // Keep last insight; empty states stay usable.
    } finally {
      insightInFlightRef.current = false
      if (mountedRef.current) setInsightReady(true)
    }
  })

  const loadNews = React.useEffectEvent(async () => {
    if (newsInFlightRef.current) return
    newsInFlightRef.current = true
    try {
      const home = await fetchNewsHome().catch(() => null)
      const newsData = home?.news?.length
        ? home
        : mergeNewsHome(home, await fetchNewsLatest().catch(() => []))
      if (!mountedRef.current) return
      lastNewsFetchAtRef.current = Date.now()
      if (newsData) setNews(newsData)
    } catch {
      // News empty states stay usable; do not blank the page.
    } finally {
      newsInFlightRef.current = false
      if (mountedRef.current) setNewsReady(true)
    }
  })

  React.useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  React.useEffect(() => {
    if (hasUsableInsight(initialInsight) && hasUsableNews(initialNews)) return
    const id = window.setTimeout(() => {
      if (!hasUsableInsight(initialInsight)) void loadInsight()
      if (!hasUsableNews(initialNews)) void loadNews()
    }, 0)
    return () => window.clearTimeout(id)
  }, [initialInsight, initialNews])

  // Insight: refresh on 15m candle boundaries.
  React.useEffect(() => {
    let timeoutId = 0
    let cancelled = false

    function scheduleNext() {
      window.clearTimeout(timeoutId)
      const delay = msUntilNextCandleBoundary(Date.now())
      timeoutId = window.setTimeout(() => {
        void (async () => {
          if (cancelled) return
          await loadInsight()
          if (cancelled) return
          scheduleNext()
        })()
      }, delay)
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "visible" || cancelled) return
      const now = Date.now()
      const last = lastInsightFetchAtRef.current
      if (last != null && shouldRefreshAfterResume(last, now)) {
        window.clearTimeout(timeoutId)
        void (async () => {
          await loadInsight()
          if (cancelled) return
          scheduleNext()
        })()
        return
      }
      scheduleNext()
    }

    scheduleNext()
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  // News: refresh every 5 minutes (and on resume if the window elapsed).
  React.useEffect(() => {
    let cancelled = false

    const intervalId = window.setInterval(() => {
      if (cancelled) return
      void loadNews()
    }, NEWS_REFRESH_INTERVAL_MS)

    function onVisibilityChange() {
      if (document.visibilityState !== "visible" || cancelled) return
      const now = Date.now()
      const last = lastNewsFetchAtRef.current
      if (last == null || shouldRefreshNewsAfterResume(last, now)) {
        void loadNews()
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  const prediction = insight?.predictions[0] ?? null
  const analytics = news?.analytics?.[0] ?? null
  const symbol = insight?.summary.symbol?.trim() || "ETH"
  const timeframe = insight?.summary.timeframe?.trim() || "15m"
  const insightFreshness = insightUpdatedLabel(
    insight?.summary.generated_at,
    nowMs
  )
  const newsFreshness = newsFeedUpdatedLabel(analytics?.generated_at, nowMs)

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col gap-0 p-0 pb-0 md:p-0",
        mobileSection != null && "h-full min-h-0 flex-1"
      )}
    >
      {showWorkspace ? (
        <MarketContextWorkspace
          symbol={symbol}
          timeframe={timeframe}
          summary={insight?.summary ?? null}
          prediction={prediction}
          analytics={analytics}
          news={news?.news ?? []}
          newsLoading={!newsReady}
          analysisLoading={!insightReady}
          freshnessLabel={newsFreshness}
          insightFreshnessLabel={insightFreshness}
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          preferIntel={preferIntel}
          mobileSection={mobileSection === "news" ? mobileSection : null}
        />
      ) : null}
    </div>
  )
}

export { Dashboard, DashboardSkeleton }
