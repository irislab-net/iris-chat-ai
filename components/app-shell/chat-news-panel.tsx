"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { NewsBulletin, NewsReadAllButton } from "@/components/dashboard/news-bulletin"
import { NewsBulletinSkeleton } from "@/components/dashboard/intel-skeletons"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  chatMobileHeaderButtonClass,
  chatNewsFreshnessBadgeClass,
  chatNewsPanelHeaderClass,
  chatNewsPanelShellClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { fetchNewsHome, fetchNewsLatest } from "@/lib/api/data"
import type { NewsHome } from "@/lib/api/types"
import {
  hasUsableNews,
  mergeNewsHome,
} from "@/lib/dashboard/intel-load"
import { newsFeedUpdatedLabel } from "@/lib/format"
import { localeDirection } from "@/lib/i18n/locale"
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
      <header className={cn(chatNewsPanelHeaderClass, headerClassName)}>
        <div className="min-w-0">
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">
            {t("news")}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <NewsReadAllButton news={news} glass />
          <span className={chatNewsFreshnessBadgeClass}>{freshnessLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(chatMobileHeaderButtonClass, "size-8 [&_svg]:size-4")}
            aria-label={t("closeNews")}
            onClick={onClose}
          >
            <XIcon />
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
  const dir = localeDirection(useLocale())
  if (!open) return null

  return (
    <aside
      data-slot="chat-news-panel"
      dir={dir}
      className={cn(
        "flex h-full min-h-0 w-[min(36rem,48vw)] min-w-104 shrink-0 flex-col overflow-hidden",
        chatNewsPanelShellClass
      )}
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
  const isRtl = localeDirection(useLocale()) === "rtl"
  const sheetSide = isRtl ? "left" : "right"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={sheetSide}
        dir={isRtl ? "rtl" : "ltr"}
        showCloseButton={false}
        data-slot="sheet-content"
        className={cn(
          "gap-0 border-0 p-0 shadow-none",
          isRtl
            ? "data-[side=left]:w-full data-[side=left]:max-w-none data-[side=left]:border-0"
            : "data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:border-0",
          chatNewsPanelShellClass
        )}
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
