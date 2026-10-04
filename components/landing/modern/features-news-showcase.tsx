"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  DeskNewsBoard,
  DeskNewsBoardPreview,
} from "@/components/landing/modern/desk-news-board"
import { Badge } from "@/components/ui/badge"
import { fetchNewsHome, fetchNewsLatest } from "@/lib/api/data"
import type { NewsHome, NewsItem } from "@/lib/api/types"
import { hasUsableNews, mergeNewsHome } from "@/lib/dashboard/intel-load"
import {
  NEWS_REFRESH_INTERVAL_MS,
  formatRelativeAge,
  newsFeedUpdatedLabel,
  shouldRefreshNewsAfterResume,
} from "@/lib/format"
import {
  DESK_NEWS_META,
  type DeskNewsItem,
} from "@/lib/landing-modern-data"
import { cn } from "@/lib/utils"

function scoreImpact(item: NewsItem) {
  const raw = item.metrics?.impact_score
  if (typeof raw !== "number" || Number.isNaN(raw)) return 64
  // API may return 0–10; desk UI expects a two-digit impact feel.
  const scaled = raw <= 10 ? raw * 10 : raw
  return Math.max(1, Math.min(99, Math.round(scaled)))
}

function mapLiveBoard(news: NewsItem[]): {
  board: DeskNewsItem[]
  copyById: Record<string, { source: string; time: string; headline: string }>
} {
  const top = [...news]
    .sort((a, b) => scoreImpact(b) - scoreImpact(a))
    .slice(0, 3)

  const board = top.map((entry, index) => {
    const slot = DESK_NEWS_META[index] ?? DESK_NEWS_META[0]!
    return {
      id: slot.id,
      impact: scoreImpact(entry),
      tone: "neutral" as const,
    } as DeskNewsItem
  })

  const copyById: Record<
    string,
    { source: string; time: string; headline: string }
  > = {}
  top.forEach((entry, index) => {
    const id = board[index]?.id
    if (!id) return
    copyById[id] = {
      source: entry.source?.trim() || "Source",
      time: formatRelativeAge(entry.published_at) ?? "—",
      headline: entry.title.trim(),
    }
  })

  return { board, copyById }
}

function useFeaturesNewsFeed() {
  const [newsHome, setNewsHome] = React.useState<NewsHome | null>(null)
  const [ready, setReady] = React.useState(false)
  const [nowMs, setNowMs] = React.useState(() => Date.now())
  const lastFetchAtRef = React.useRef<number | null>(null)
  const inFlightRef = React.useRef(false)
  const mountedRef = React.useRef(true)

  const loadNews = React.useEffectEvent(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      const home = await fetchNewsHome().catch(() => null)
      const merged = home?.news?.length
        ? home
        : mergeNewsHome(home, await fetchNewsLatest().catch(() => []))
      if (!mountedRef.current) return
      setNewsHome(merged)
      lastFetchAtRef.current = Date.now()
    } finally {
      inFlightRef.current = false
      if (mountedRef.current) setReady(true)
    }
  })

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    void loadNews()
    const intervalId = window.setInterval(() => {
      if (!cancelled) void loadNews()
    }, NEWS_REFRESH_INTERVAL_MS)

    function onVisibilityChange() {
      if (document.visibilityState !== "visible" || cancelled) return
      const last = lastFetchAtRef.current
      if (last == null || shouldRefreshNewsAfterResume(last, Date.now())) {
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

  const analytics = newsHome?.analytics?.[0] ?? null
  const freshnessLabel = newsFeedUpdatedLabel(analytics?.generated_at, nowMs)
  const readyWithNews = ready && hasUsableNews(newsHome)
  const mapped = readyWithNews
    ? mapLiveBoard(newsHome?.news ?? [])
    : null

  return { freshnessLabel, mapped, showFallback: !mapped }
}

/** Three live headlines in the homepage desk glass language. */
export function FeaturesNewsShowcase({ className }: { className?: string }) {
  const t = useTranslations("workspace")
  const { freshnessLabel, mapped, showFallback } = useFeaturesNewsFeed()

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3 px-3.5">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {t("news")}
        </p>
        <Badge
          variant="secondary"
          className="rounded-full px-2.5 font-mono text-[11px] font-normal"
        >
          {showFallback ? "…" : freshnessLabel}
        </Badge>
      </div>

      {showFallback || !mapped ? (
        <DeskNewsBoardPreview stageWash className="bg-white/48" />
      ) : (
        <DeskNewsBoard
          board={mapped.board}
          live={false}
          stageWash
          resolveCopy={(item) =>
            mapped.copyById[item.id] ?? {
              source: "—",
              time: "—",
              headline: "—",
            }
          }
        />
      )}
    </div>
  )
}
