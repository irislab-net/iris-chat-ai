"use client"

import * as React from "react"
import { useLocale } from "next-intl"

import { DashboardSkeleton } from "@/components/dashboard/intel-skeletons"
import { MarketContextWorkspace } from "@/components/dashboard/market-context-workspace"
import { fetchNewsHome, fetchNewsLatest } from "@/lib/api/data"
import { hasUsableNews, mergeNewsHome } from "@/lib/dashboard/intel-load"
import type { NewsHome } from "@/lib/api/types"
import {
  NEWS_REFRESH_INTERVAL_MS,
  newsFeedUpdatedLabel,
  shouldRefreshNewsAfterResume,
} from "@/lib/format"
import { cn } from "@/lib/utils"

type DashboardProps = {
  /** Guest-safe SSR snapshot from the public API (optional). */
  initialNews?: NewsHome | null
  /** Mobile layout — fill height and compact news chrome. */
  mobile?: boolean
  showWorkspace?: boolean
}

function Dashboard({
  initialNews = null,
  mobile = false,
  showWorkspace = true,
}: DashboardProps) {
  const locale = useLocale()
  const [news, setNews] = React.useState<NewsHome | null>(initialNews)
  const [newsReady, setNewsReady] = React.useState(() =>
    hasUsableNews(initialNews)
  )
  const [nowMs, setNowMs] = React.useState(() => Date.now())
  const mountedRef = React.useRef(true)
  const newsInFlightRef = React.useRef(false)
  const lastNewsFetchAtRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    mountedRef.current = true
    if (initialNews) lastNewsFetchAtRef.current = Date.now()
    return () => {
      mountedRef.current = false
    }
  }, [initialNews])

  const loadNews = React.useEffectEvent(async () => {
    if (newsInFlightRef.current) return
    newsInFlightRef.current = true
    try {
      const query = { lang: locale }
      const home = await fetchNewsHome(query).catch(() => null)
      const newsData = home?.news?.length
        ? home
        : mergeNewsHome(home, await fetchNewsLatest(query).catch(() => []))
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

  // Fetch in the UI locale; refresh every 5 minutes (and on resume).
  React.useEffect(() => {
    let cancelled = false
    let initialTimeoutId: number | undefined

    if (hasUsableNews(initialNews)) {
      // SSR seed may be a different lang — refresh once for the active locale.
      void loadNews()
    } else {
      initialTimeoutId = window.setTimeout(() => {
        if (!cancelled) void loadNews()
      }, 0)
    }

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
      if (initialTimeoutId !== undefined) window.clearTimeout(initialTimeoutId)
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [initialNews, locale])

  const analytics = news?.analytics?.[0] ?? null
  const newsFreshness = newsFeedUpdatedLabel(analytics?.generated_at, nowMs)

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col gap-0 p-0 pb-0 md:p-0",
        mobile && "h-full min-h-0 flex-1"
      )}
    >
      {showWorkspace ? (
        <MarketContextWorkspace
          analytics={analytics}
          news={news?.news ?? []}
          newsLoading={!newsReady}
          freshnessLabel={newsFreshness}
          mobile={mobile}
        />
      ) : null}
    </div>
  )
}

export { Dashboard, DashboardSkeleton }
