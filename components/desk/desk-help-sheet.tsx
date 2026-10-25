"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  ActivityIcon,
  ArrowDownUpIcon,
  BookmarkIcon,
  CandlestickChartIcon,
  EyeOffIcon,
  FilterIcon,
  FlameIcon,
  HistoryIcon,
  LineChartIcon,
  NewspaperIcon,
  SearchIcon,
  SparklesIcon,
  ViewIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCompactContentClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatSheetDoneCheck } from "@/components/app-shell/chat-sheet-done-check"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export type DeskPageId = "news" | "markets" | "trade" | "profile"

type HelpFeature = {
  title: string
  detail: string
}

type DeskHelpSheetProps = {
  pageId: DeskPageId
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PAGE_FEATURE_ICONS: Record<DeskPageId, LucideIcon[]> = {
  news: [ActivityIcon, FilterIcon, FlameIcon, NewspaperIcon],
  markets: [LineChartIcon, SearchIcon, BookmarkIcon, ViewIcon],
  trade: [CandlestickChartIcon, ZapIcon, HistoryIcon, SparklesIcon],
  profile: [WalletIcon, ArrowDownUpIcon, ActivityIcon, EyeOffIcon],
}

function FeatureIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className={cn(
        "relative isolate flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-white/70 dark:border-white/18",
        "bg-white/60 backdrop-blur-[24px] dark:bg-white/12",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)]",
        "dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]",
        "text-foreground/75"
      )}
      aria-hidden
    >
      <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
      <Icon className="relative z-10 size-4 stroke-[1.65]" />
    </span>
  )
}

function HelpBody({ pageId }: { pageId: DeskPageId }) {
  const t = useTranslations("deskHelp")
  const features = (t.raw(`${pageId}.features`) as HelpFeature[]) ?? []
  const icons = PAGE_FEATURE_ICONS[pageId]

  return (
    <div
      className={cn(
        chatMobileSheetBodyClass,
        "flex flex-col gap-5 overflow-y-auto pt-3 pb-7"
      )}
    >
      <p
        dir="auto"
        className="text-[15px] leading-relaxed text-muted-foreground"
      >
        {t(`${pageId}.intro`)}
      </p>

      <div className="flex flex-col gap-2">
        <p className="px-0.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {t("featuresLabel")}
        </p>
        <ul className="flex flex-col gap-2">
          {features.map((feature, index) => {
            const Icon = icons[index] ?? SparklesIcon
            return (
              <li
                key={feature.title}
                className={cn(
                  "relative isolate flex items-start gap-3 overflow-hidden rounded-2xl px-3.5 py-3",
                  "border border-white/70 dark:border-white/14",
                  "bg-white/45 supports-[backdrop-filter]:bg-white/35 dark:bg-white/8 dark:supports-[backdrop-filter]:bg-white/6",
                  "backdrop-blur-[28px]",
                  "shadow-[0_1px_2px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,0.85)]",
                  "dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]"
                )}
              >
                <span
                  aria-hidden
                  className={cn(landingGlassSheen, "rounded-2xl")}
                />
                <FeatureIcon icon={Icon} />
                <div className="relative z-10 min-w-0 flex-1 pt-0.5">
                  <p
                    dir="auto"
                    className="text-[14px] font-semibold tracking-tight text-foreground"
                  >
                    {feature.title}
                  </p>
                  <p
                    dir="auto"
                    className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground"
                  >
                    {feature.detail}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function DeskHelpSheet({ pageId, open, onOpenChange }: DeskHelpSheetProps) {
  const t = useTranslations("deskHelp")
  const isDesktop = useIsDesktop()
  const title = t(`${pageId}.title`)
  const intro = t(`${pageId}.intro`)

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            chatDesktopDialogClass,
            "max-h-[min(85dvh,36rem)] gap-0 overflow-hidden p-0 sm:max-w-md"
          )}
        >
          <DialogHeader className={cn(chatMobileSheetHeaderClass, "px-5 pt-5")}>
            <DialogTitle className={chatMobileSheetTitleClass}>{title}</DialogTitle>
            <DialogDescription className="sr-only">{intro}</DialogDescription>
          </DialogHeader>
          {open ? <HelpBody pageId={pageId} /> : null}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(chatMobileSheetCompactContentClass, "max-h-[min(88dvh,40rem)]")}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0 pe-5")}>
          <div className="flex items-center gap-2">
            <SheetTitle
              className={cn(chatMobileSheetTitleClass, "min-w-0 flex-1")}
            >
              {title}
            </SheetTitle>
            <ChatSheetDoneCheck onClick={() => onOpenChange(false)} />
          </div>
          <SheetDescription className="sr-only">{intro}</SheetDescription>
        </SheetHeader>
        {open ? <HelpBody pageId={pageId} /> : null}
      </SheetContent>
    </Sheet>
  )
}

export { DeskHelpSheet }
