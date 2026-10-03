"use client"

import * as React from "react"
import {
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  CrosshairIcon,
  FlagIcon,
  HexagonIcon,
  LayersIcon,
  ScaleIcon,
  ZapIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatSignalCardChipClass,
  chatSignalCardChipLongClass,
  chatSignalCardChipShortClass,
  chatSignalCardClass,
  chatSignalCardLongWashClass,
  chatSignalCardShortWashClass,
  chatSignalCardEntryShellClass,
  chatSignalCardIconShellClass,
  chatSignalCardInsetClass,
  chatSignalCardMetricTileClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { TermText } from "@/components/app-shell/term-text"
import { Button } from "@/components/ui/button"
import { trackChatSignalWatchlist } from "@/lib/analytics"
import { signalRewardRiskRatio } from "@/lib/chat/signal-setup"
import { formatTradePrice } from "@/lib/chat/trade-signal"
import type { PaperTradeTicket } from "@/lib/chat/signal-ticket"
import { cn } from "@/lib/utils"

type PriceColumn = {
  icon: LucideIcon
  label: string
  value: string
  reason?: string
  emphasis?: boolean
  iconClass?: string
  iconShellClass?: string
}

function PriceTile({
  column,
  reasonSkeleton,
}: {
  column: PriceColumn
  reasonSkeleton?: boolean
}) {
  const Icon = column.icon
  const hasReason = Boolean(column.reason) || reasonSkeleton

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col px-2.5 py-3 sm:px-3 sm:py-3.5",
        hasReason ? "items-start text-start" : "items-center text-center",
        column.emphasis
          ? chatSignalCardEntryShellClass
          : chatSignalCardMetricTileClass
      )}
    >
      <span className={cn(chatSignalCardIconShellClass, column.iconShellClass)}>
        <Icon
          className={cn("size-3.5", column.iconClass ?? "text-muted-foreground")}
          aria-hidden
        />
      </span>
      <p className="mt-2 text-[10px] leading-none font-medium tracking-[0.07em] text-muted-foreground uppercase">
        {column.label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-semibold tracking-tight text-foreground tabular-nums",
          column.emphasis
            ? "text-[1.15rem] leading-none sm:text-[1.25rem]"
            : "text-[15px] leading-none sm:text-base"
        )}
      >
        {column.value}
      </p>
      {reasonSkeleton ? (
        <span
          aria-hidden
          className="chat-skeleton-shimmer mt-2.5 h-3 w-[88%] rounded-sm"
        />
      ) : column.reason ? (
        <p className="mt-2.5 w-full wrap-break-word text-[11px] leading-snug text-foreground/65">
          <TermText text={column.reason} />
        </p>
      ) : null}
    </div>
  )
}

function PriceBand({
  columns,
  reasonSkeleton,
}: {
  columns: PriceColumn[]
  reasonSkeleton?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
      {columns.map((column) => (
        <PriceTile
          key={column.label}
          column={column}
          reasonSkeleton={reasonSkeleton}
        />
      ))}
    </div>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1">
      <span
        className={cn(chatSignalCardIconShellClass, "col-start-1 row-span-2")}
      >
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      </span>
      <p className="col-start-2 row-start-1 text-[10px] leading-none tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="col-start-2 row-start-2 text-[13px] leading-none font-medium text-foreground tabular-nums">
        {value}
      </p>
    </div>
  )
}

function ChatSignalCard({
  ticket,
  className,
  /** Landing demo: swap setup / reasons / thesis for shimmer bars. */
  proseSkeleton = false,
  /** Landing demo: monochrome glass — no long/short wash or metric accents. */
  tone = "accent",
}: {
  ticket: PaperTradeTicket
  className?: string
  proseSkeleton?: boolean
  tone?: "accent" | "neutral"
}) {
  const t = useTranslations("workspace")
  const ticketKey = `${ticket.symbol}:${ticket.side}`
  const [watchlistAddedFor, setWatchlistAddedFor] = React.useState<
    string | null
  >(null)
  const watchlistAdded = watchlistAddedFor === ticketKey
  const watchlistTimerRef = React.useRef(0)
  const isLong = ticket.side === "LONG"
  const isNeutral = tone === "neutral"
  const SideIcon = isLong ? TrendingUpIcon : TrendingDownIcon
  const rewardRisk = signalRewardRiskRatio(ticket)
  const hasLeverage = ticket.leverage > 0
  const hasSize = ticket.quantity > 0
  const setup = proseSkeleton ? "" : ticket.setup.trim()
  const thesis = proseSkeleton ? "" : ticket.thesis.trim()
  const timeHorizon = ticket.timeHorizon?.trim() ?? ""
  const stopLossReason = proseSkeleton
    ? ""
    : (ticket.stopLossReason?.trim() ?? "")
  const entryReason = proseSkeleton ? "" : (ticket.entryReason?.trim() ?? "")
  const takeProfitReason = proseSkeleton
    ? ""
    : (ticket.takeProfitReason?.trim() ?? "")

  React.useEffect(() => {
    return () => window.clearTimeout(watchlistTimerRef.current)
  }, [])

  React.useEffect(() => {
    window.clearTimeout(watchlistTimerRef.current)
  }, [ticketKey])

  function onAddToWatchlist() {
    if (watchlistAdded) return
    trackChatSignalWatchlist({
      symbol: ticket.symbol,
      side: ticket.side,
    })
    setWatchlistAddedFor(ticketKey)
    window.clearTimeout(watchlistTimerRef.current)
    watchlistTimerRef.current = window.setTimeout(
      () => setWatchlistAddedFor(null),
      2_000
    )
  }

  const priceColumns: PriceColumn[] = [
    {
      icon: HexagonIcon,
      label: t("signalCardStopLoss"),
      value: formatTradePrice(ticket.stopLoss),
      reason: stopLossReason || undefined,
      ...(isNeutral
        ? {}
        : {
            iconClass: "text-rose-600 dark:text-rose-400",
            iconShellClass:
              "bg-rose-500/18 supports-[backdrop-filter]:bg-rose-500/16 dark:bg-rose-400/22 dark:supports-[backdrop-filter]:bg-rose-400/18",
          }),
    },
    {
      icon: CrosshairIcon,
      label: t("signalCardEntry"),
      value: formatTradePrice(ticket.markPrice),
      reason: entryReason || undefined,
      emphasis: true,
      ...(isNeutral
        ? {}
        : {
            iconClass: "text-sky-600 dark:text-sky-400",
            iconShellClass:
              "bg-sky-500/18 supports-[backdrop-filter]:bg-sky-500/16 dark:bg-sky-400/22 dark:supports-[backdrop-filter]:bg-sky-400/18",
          }),
    },
    {
      icon: FlagIcon,
      label: t("signalCardTakeProfit"),
      value: formatTradePrice(ticket.takeProfit),
      reason: takeProfitReason || undefined,
      ...(isNeutral
        ? {}
        : {
            iconClass: "text-emerald-600 dark:text-emerald-400",
            iconShellClass:
              "bg-emerald-500/18 supports-[backdrop-filter]:bg-emerald-500/16 dark:bg-emerald-400/22 dark:supports-[backdrop-filter]:bg-emerald-400/18",
          }),
    },
  ]

  const metaItems = [
    hasLeverage ? (
      <MetaItem
        key="leverage"
        icon={ZapIcon}
        label={t("signalCardLeverage")}
        value={`${ticket.leverage}x`}
      />
    ) : null,
    hasSize ? (
      <MetaItem
        key="size"
        icon={LayersIcon}
        label={t("signalCardSize")}
        value={ticket.quantity.toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })}
      />
    ) : null,
    rewardRisk != null ? (
      <MetaItem
        key="rr"
        icon={ScaleIcon}
        label={t("signalCardRewardRisk")}
        value={`1 : ${rewardRisk.toFixed(2)}`}
      />
    ) : null,
    timeHorizon ? (
      <MetaItem
        key="horizon"
        icon={ClockIcon}
        label={t("signalCardTimeHorizon")}
        value={timeHorizon}
      />
    ) : null,
  ].filter(Boolean)

  return (
    <article
      className={cn(
        "mt-1.5",
        chatSignalCardClass,
        !isNeutral &&
          (isLong ? chatSignalCardLongWashClass : chatSignalCardShortWashClass),
        className
      )}
    >
      <header className="px-4 pt-4 pb-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
              {ticket.symbol}
            </h3>
            <span
              className={
                isNeutral
                  ? chatSignalCardChipClass
                  : isLong
                    ? chatSignalCardChipLongClass
                    : chatSignalCardChipShortClass
              }
            >
              <SideIcon className="size-3 shrink-0" aria-hidden />
              {isLong ? t("signalSideLong") : t("signalSideShort")}
            </span>
          </div>
          <span className="shrink-0 text-[11px] font-medium tracking-[0.03em] text-muted-foreground uppercase">
            {t("signalCardTitle")}
          </span>
        </div>
        {proseSkeleton ? (
          <span
            aria-hidden
            className="chat-skeleton-shimmer mt-2.5 block h-3.5 w-[72%] max-w-md rounded-sm"
          />
        ) : setup ? (
          <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            <TermText text={setup} />
          </p>
        ) : null}
      </header>

      <div className="space-y-4 px-4 py-4">
        <PriceBand columns={priceColumns} reasonSkeleton={proseSkeleton} />

        {metaItems.length > 0 ? (
          <div className={cn(chatSignalCardInsetClass, "rounded-2xl px-3.5 py-3")}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {metaItems}
            </div>
          </div>
        ) : null}

        {proseSkeleton ? (
          <div className={cn(chatSignalCardInsetClass, "rounded-2xl px-3.5 py-3")}>
            <p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {t("signalCardThesisHeading")}
            </p>
            <div className="mt-2 space-y-2" aria-hidden>
              <span className="chat-skeleton-shimmer block h-3.5 w-full rounded-sm" />
              <span className="chat-skeleton-shimmer block h-3.5 w-[82%] rounded-sm" />
            </div>
          </div>
        ) : thesis ? (
          <div className={cn(chatSignalCardInsetClass, "rounded-2xl px-3.5 py-3")}>
            <p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {t("signalCardThesisHeading")}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/85">
              <TermText text={thesis} />
            </p>
          </div>
        ) : null}

        {!proseSkeleton ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              aria-label={
                watchlistAdded
                  ? t("signalCardWatchlistAdded")
                  : t("signalCardWatchlist")
              }
              onClick={onAddToWatchlist}
            >
              {watchlistAdded ? (
                <CheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <BookmarkIcon className="size-3.5" />
              )}
              {watchlistAdded
                ? t("signalCardWatchlistAdded")
                : t("signalCardWatchlist")}
            </Button>
          </div>
        ) : null}

        <p className="text-center text-[9px] tracking-[0.08em] text-muted-foreground/70 uppercase">
          {t("signalCardDisclaimer")}
        </p>
      </div>
    </article>
  )
}

export { ChatSignalCard }
