"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { NewsBulletin, NewsReadAllButton } from "@/components/dashboard/news-bulletin"
import { NewsBulletinSkeleton } from "@/components/dashboard/intel-skeletons"
import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { fetchNewsHome, fetchNewsLatest } from "@/lib/api/data"
import type { NewsHome } from "@/lib/api/types"
import {
  hasUsableNews,
  mergeNewsHome,
} from "@/lib/dashboard/intel-load"
import { newsFeedUpdatedLabel } from "@/lib/format"
import { cn } from "@/lib/utils"

function useChatNewsFeed(enabled: boolean) {
  const [newsHome, setNewsHome] = React.useState<NewsHome | null>(null)
  const [ready, setReady] = React.useState(false)
  const [nowMs, setNowMs] = React.useState(() => Date.now())

  React.useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  React.useEffect(() => {
    if (!enabled) return
    let cancelled = false

    void (async () => {
      try {
        const home = await fetchNewsHome().catch(() => null)
        const merged =
          home?.news?.length
            ? home
            : mergeNewsHome(
                home,
                await fetchNewsLatest().catch(() => [])
              )
        if (!cancelled) setNewsHome(merged)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled])

  const analytics = newsHome?.analytics?.[0] ?? null
  const freshnessLabel = newsFeedUpdatedLabel(analytics?.generated_at, nowMs)
  const loading = enabled && !ready && !hasUsableNews(newsHome)

  return {
    analytics,
    news: newsHome?.news ?? [],
    freshnessLabel,
    loading,
  }
}

type ChatNewsPanelBodyProps = {
  onClose: () => void
  className?: string
  headerClassName?: string
  mobile?: boolean
}

function ChatNewsPanelBody({
  onClose,
  className,
  headerClassName,
  mobile = false,
}: ChatNewsPanelBodyProps) {
  const t = useTranslations("workspace")
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { analytics, news, freshnessLabel, loading } = useChatNewsFeed(true)

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <header
        className={cn(
          "flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3",
          headerClassName
        )}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Intel
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
            {t("news")}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <NewsReadAllButton news={news} />
          <Badge variant="secondary" className="font-mono text-[10px] font-normal">
            {freshnessLabel}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 shrink-0"
            aria-label={t("closeNews")}
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain select-text [-webkit-overflow-scrolling:touch]">
        <div className="px-4 py-4">
          {loading ? (
            <NewsBulletinSkeleton />
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
              isAuthenticated={isAuthenticated}
              authLoading={authLoading}
              className="select-text"
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
}

function ChatNewsSidePanel({ open, onOpenChange }: ChatNewsSidePanelProps) {
  if (!open) return null

  return (
    <aside
      data-slot="chat-news-panel"
      className="flex h-full min-h-0 w-[min(36rem,48vw)] min-w-104 shrink-0 flex-col overflow-hidden border-l border-border/60 bg-sidebar text-sidebar-foreground"
      aria-label="News"
    >
      <ChatNewsPanelBody onClose={() => onOpenChange(false)} />
    </aside>
  )
}

type ChatNewsMobileSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ChatNewsMobileSheet({ open, onOpenChange }: ChatNewsMobileSheetProps) {
  const t = useTranslations("workspace")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:max-w-none"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{t("news")}</SheetTitle>
        </SheetHeader>
        <ChatNewsPanelBody
          mobile
          onClose={() => onOpenChange(false)}
          className="h-full"
        />
      </SheetContent>
    </Sheet>
  )
}

export { ChatNewsMobileSheet, ChatNewsSidePanel }
