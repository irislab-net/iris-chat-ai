"use client"

import {
  ActivityIcon,
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
  chatSignalCardClass,
  chatSignalCardEntryShellClass,
  chatSignalCardIconShellClass,
  chatSignalCardMetricTileClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { signalRewardRiskRatio } from "@/lib/chat/signal-setup"
import { formatTradePrice } from "@/lib/chat/trade-signal"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"
import { cn } from "@/lib/utils"

type PriceColumn = {
  icon: LucideIcon
  label: string
  value: string
  reason?: string
  emphasis?: boolean
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
        hasReason ? "items-start text-left" : "items-center text-center",
        column.emphasis
          ? chatSignalCardEntryShellClass
          : chatSignalCardMetricTileClass
      )}
    >
      <span className={chatSignalCardIconShellClass}>
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      </span>
      <p className="mt-2 text-[10px] leading-none font-medium tracking-[0.07em] text-muted-foreground uppercase">
        {column.label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-semibold tabular-nums tracking-tight text-foreground",
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
          className="chat-skeleton-shimmer mt-2 h-3 w-[88%] rounded-sm"
        />
      ) : column.reason ? (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {column.reason}
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
      <span className={cn(chatSignalCardIconShellClass, "col-start-1 row-span-2")}>
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      </span>
      <p className="col-start-2 row-start-1 text-[10px] leading-none tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="col-start-2 row-start-2 text-[13px] font-medium tabular-nums leading-none text-foreground">
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
}: {
  ticket: PaperTradeTicket
  className?: string
  proseSkeleton?: boolean
}) {
  const t = useTranslations("workspace")
  const isLong = ticket.side === "LONG"
  const SideIcon = isLong ? TrendingUpIcon : TrendingDownIcon
  const rewardRisk = signalRewardRiskRatio(ticket)
  const hasLeverage = ticket.leverage > 0
  const hasSize = ticket.quantity > 0
  const setup = proseSkeleton ? "" : ticket.setup.trim()
  const thesis = proseSkeleton ? "" : ticket.thesis.trim()
  const timeHorizon = ticket.timeHorizon?.trim() ?? ""
  const stopLossReason = proseSkeleton ? "" : ticket.stopLossReason?.trim() ?? ""
  const entryReason = proseSkeleton ? "" : ticket.entryReason?.trim() ?? ""
  const takeProfitReason = proseSkeleton
    ? ""
    : ticket.takeProfitReason?.trim() ?? ""

  const priceColumns: PriceColumn[] = [
    {
      icon: HexagonIcon,
      label: t("signalCardStopLoss"),
      value: formatTradePrice(ticket.stopLoss),
      reason: stopLossReason || undefined,
    },
    {
      icon: CrosshairIcon,
      label: t("signalCardEntry"),
      value: formatTradePrice(ticket.markPrice),
      reason: entryReason || undefined,
      emphasis: true,
    },
    {
      icon: FlagIcon,
      label: t("signalCardTakeProfit"),
      value: formatTradePrice(ticket.takeProfit),
      reason: takeProfitReason || undefined,
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
    <article className={cn("mt-1.5", chatSignalCardClass, className)}>
      <header className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
              {ticket.symbol}
            </h3>
            <span className={chatSignalCardChipClass}>
              <SideIcon className="size-3 shrink-0 opacity-80" aria-hidden />
              {isLong ? t("signalSideLong") : t("signalSideShort")}
            </span>
          </div>
          <span className={cn(chatSignalCardChipClass, "shrink-0 uppercase")}>
            <ActivityIcon className="size-3 shrink-0 opacity-80" aria-hidden />
            {t("signalCardTitle")}
          </span>
        </div>
        {proseSkeleton ? (
          <span
            aria-hidden
            className="chat-skeleton-shimmer mt-2 block h-3.5 w-[72%] max-w-md rounded-sm"
          />
        ) : setup ? (
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            {setup}
          </p>
        ) : null}
      </header>

      <div className="space-y-4 px-4 pb-4">
        <PriceBand columns={priceColumns} reasonSkeleton={proseSkeleton} />

        {metaItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {metaItems}
          </div>
        ) : null}

        {proseSkeleton ? (
          <div className="border-t border-foreground/6 pt-3">
            <p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {t("signalCardThesisHeading")}
            </p>
            <div className="mt-2 space-y-2" aria-hidden>
              <span className="chat-skeleton-shimmer block h-3.5 w-full rounded-sm" />
              <span className="chat-skeleton-shimmer block h-3.5 w-[82%] rounded-sm" />
            </div>
          </div>
        ) : thesis ? (
          <div className="border-t border-foreground/6 pt-3">
            <p className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {t("signalCardThesisHeading")}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground/85">
              {thesis}
            </p>
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
