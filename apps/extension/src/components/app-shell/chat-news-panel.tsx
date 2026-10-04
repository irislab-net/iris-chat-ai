"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { ExurLogo } from "@/components/brand/exur-logo"
import { ChatMobileSlidePanel } from "@/components/app-shell/chat-mobile-slide-panel"
import {
  NewsBulletin,
  NewsReadAllButton,
} from "@/components/dashboard/news-bulletin"
import { NewsBulletinSkeleton } from "@/components/dashboard/intel-skeletons"
import { Button } from "@/components/ui/button"
import {
  chatDesktopSidebarIconButtonClass,
  chatMobileHeaderButtonClass,
  chatMobileHeaderScrimClass,
  chatMobileHeaderShellClass,
  chatMobileThreadTopSpacerClass,
  chatNewsFreshnessBadgeClass,
  chatNewsFreshnessBadgeDesktopClass,
  chatNewsPanelHeaderClass,
  chatNewsPanelHeaderDesktopClass,
  chatNewsPanelHeaderDesktopScrimClass,
  chatNewsPanelHeaderDesktopWrapClass,
  chatNewsPanelShellClass,
  chatNewsPanelShellMobileClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { fetchNewsHome, fetchNewsLatest } from "@/lib/api/data"
import type { NewsHome, NewsItem } from "@/lib/api/types"
import { hasUsableNews, mergeNewsHome } from "@/lib/dashboard/intel-load"
import {
  NEWS_REFRESH_INTERVAL_MS,
  formatRelativeAge,
  newsFeedUpdatedLabel,
  shouldRefreshNewsAfterResume,
} from "@/lib/format"
import { localeDirection } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

function useChatNewsFeed(enabled: boolean) {
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
    if (!enabled) return
    let cancelled = false

    void loadNews()

    const intervalId = window.setInterval(() => {
      if (cancelled) return
      void loadNews()
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
  }, [enabled])

  const analytics = newsHome?.analytics?.[0] ?? null
  const freshnessLabel = newsFeedUpdatedLabel(analytics?.generated_at, nowMs)
  const freshnessAge =
    analytics?.generated_at != null
      ? (formatRelativeAge(analytics.generated_at, nowMs) ?? "—")
      : "—"
  const loading = enabled && !ready && !hasUsableNews(newsHome)

  return {
    analytics,
    news: newsHome?.news ?? [],
    freshnessLabel,
    freshnessAge,
    loading,
  }
}

type ChatNewsPanelBodyProps = {
  onClose: () => void
  className?: string
  headerClassName?: string
  mobile?: boolean
  onAnalyzeNews?: (item: NewsItem) => void
}

function ChatNewsPanelBody({
  onClose,
  className,
  headerClassName,
  mobile = false,
  onAnalyzeNews,
}: ChatNewsPanelBodyProps) {
  const t = useTranslations("workspace")
  const { analytics, news, freshnessLabel, freshnessAge, loading } =
    useChatNewsFeed(true)

  const headerIconButtonClass = mobile
    ? chatMobileHeaderButtonClass
    : chatDesktopSidebarIconButtonClass
  const headerRowClass = mobile ? "h-11" : "h-9"

  const headerInner = (
    <>
      <div
        className={cn(
          "flex min-w-0 items-center justify-start gap-2",
          headerRowClass
        )}
      >
        <ExurLogo
          decorative
          variant="gradient"
          shimmer
          priority
          size={mobile ? 44 : 36}
          className={cn(
            "shrink-0 overflow-hidden rounded-full",
            mobile ? "size-11" : "size-9"
          )}
        />
        <h2 className="truncate text-[17px] font-normal leading-none tracking-tight text-foreground">
          {t("news")}
        </h2>
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center justify-end gap-2",
          headerRowClass
        )}
      >
        <span
          className={
            mobile
              ? chatNewsFreshnessBadgeClass
              : chatNewsFreshnessBadgeDesktopClass
          }
        >
          {freshnessAge}
        </span>
        <NewsReadAllButton
          news={news}
          glass
          iconOnly
          className={headerIconButtonClass}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(headerIconButtonClass, "relative self-center")}
          aria-label={t("closeNews")}
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
    </>
  )

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", className)}>
      {mobile ? (
        <div className={chatMobileHeaderShellClass}>
          <div aria-hidden className={chatMobileHeaderScrimClass} />
          <header className={cn(chatNewsPanelHeaderClass, headerClassName)}>
            {headerInner}
          </header>
        </div>
      ) : (
        <div className={chatNewsPanelHeaderDesktopWrapClass}>
          <div aria-hidden className={chatNewsPanelHeaderDesktopScrimClass} />
          <header
            className={cn(chatNewsPanelHeaderDesktopClass, headerClassName)}
          >
            {headerInner}
          </header>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain select-text [-webkit-overflow-scrolling:touch]">
        {mobile ? (
          <div aria-hidden className={chatMobileThreadTopSpacerClass} />
        ) : null}
        <div className={cn("px-4 pb-10", mobile ? "pt-6" : "pt-1")}>
          {loading ? (
            <NewsBulletinSkeleton sidebar />
          ) : (
            <NewsBulletin
              analytics={analytics}
              news={news}
              loading={loading}
              freshnessLabel={freshnessLabel}
              embedded
              sidebar
              active
              mobile={mobile}
              className="select-text"
              onAnalyzeNews={onAnalyzeNews}
            />
          )}
        </div>
      </div>
    </div>
  )
}

type ChatNewsSidePanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAnalyzeNews?: (item: NewsItem) => void
}

function ChatNewsSidePanel({
  open,
  onOpenChange,
  onAnalyzeNews,
}: ChatNewsSidePanelProps) {
  const t = useTranslations("workspace")
  const dir = localeDirection(useLocale())
  if (!open) return null

  return (
    <aside
      data-slot="chat-news-panel"
      dir={dir}
      className={cn(
        "flex h-full min-h-0 w-[min(29rem,38vw)] min-w-88 shrink-0 flex-col overflow-hidden",
        chatNewsPanelShellClass
      )}
      aria-label={t("news")}
    >
      <ChatNewsPanelBody
        onClose={() => onOpenChange(false)}
        onAnalyzeNews={onAnalyzeNews}
      />
    </aside>
  )
}

type ChatNewsMobileSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAnalyzeNews?: (item: NewsItem) => void
}

function ChatNewsMobileSheet({
  open,
  onOpenChange,
  onAnalyzeNews,
}: ChatNewsMobileSheetProps) {
  const t = useTranslations("workspace")
  const dir = localeDirection(useLocale())

  return (
    <ChatMobileSlidePanel
      open={open}
      onOpenChange={onOpenChange}
      side="end"
      label={t("news")}
      panelClassName={cn(chatNewsPanelShellMobileClass, "bg-background")}
    >
      <div dir={dir} className="flex h-full min-h-0 flex-col">
        <ChatNewsPanelBody
          mobile
          onClose={() => onOpenChange(false)}
          onAnalyzeNews={onAnalyzeNews}
          className="h-full"
        />
      </div>
    </ChatMobileSlidePanel>
  )
}

export { ChatNewsMobileSheet, ChatNewsSidePanel }
