"use client"

import {
  ActivityIcon,
  CrosshairIcon,
  FlagIcon,
  GaugeIcon,
  LayersIcon,
  ScaleIcon,
  ShieldIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
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
import {
  PAPER_AI_RISK_FRACTION,
  paperRiskAmountUsd,
} from "@/lib/iris-paper-trade/size"
import type { PaperTradeTicket } from "@/lib/iris-paper-trade/types"
import { formatPaperPrice } from "@/lib/paper-trading"
import { getPaperSnapshot } from "@/lib/paper-trading/store"
import { cn } from "@/lib/utils"

type PriceColumn = {
  icon: LucideIcon
  label: string
  value: string
  emphasis?: boolean
}

function PriceTile({ column }: { column: PriceColumn }) {
  const Icon = column.icon

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center px-2 py-3 text-center sm:px-2.5 sm:py-3.5",
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
          "mt-1.5 font-medium tabular-nums tracking-tight text-foreground",
          column.emphasis
            ? "text-[1.15rem] leading-none sm:text-[1.25rem]"
            : "text-[13px] leading-none sm:text-[14px]"
        )}
      >
        {column.value}
      </p>
    </div>
  )
}

function PriceBand({ columns }: { columns: PriceColumn[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
      {columns.map((column) => (
        <PriceTile key={column.label} column={column} />
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
      <p className="col-start-2 row-start-1 text-[10px] leading-none text-muted-foreground">
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
}: {
  ticket: PaperTradeTicket
  className?: string
}) {
  const t = useTranslations("workspace")
  const isLong = ticket.side === "LONG"
  const SideIcon = isLong ? TrendingUpIcon : TrendingDownIcon
  const rewardRisk = signalRewardRiskRatio(ticket)
  const equity = getPaperSnapshot().account.equity
  const riskUsd = equity > 0 ? paperRiskAmountUsd(equity) : null

  const priceColumns: PriceColumn[] = [
    {
      icon: ShieldIcon,
      label: t("signalCardStopLoss"),
      value: formatPaperPrice(ticket.stopLoss),
    },
    {
      icon: CrosshairIcon,
      label: t("signalCardEntry"),
      value: formatPaperPrice(ticket.markPrice),
      emphasis: true,
    },
    {
      icon: FlagIcon,
      label: t("signalCardTakeProfit"),
      value: formatPaperPrice(ticket.takeProfit),
    },
  ]

  return (
    <article className={cn("mt-1.5", chatSignalCardClass, className)}>
      <header className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-foreground">
              {ticket.symbol}
            </h3>
            <span className={chatSignalCardChipClass}>
              <SideIcon className="size-3 shrink-0 opacity-80" aria-hidden />
              {ticket.side}
            </span>
          </div>
          <span className={cn(chatSignalCardChipClass, "shrink-0 uppercase")}>
            <ActivityIcon className="size-3 shrink-0 opacity-80" aria-hidden />
            {t("signalCardTitle")}
          </span>
        </div>
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          {ticket.setup}
        </p>
      </header>

      <div className="space-y-3 px-4 pb-3">
        <PriceBand columns={priceColumns} />

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <MetaItem
            icon={GaugeIcon}
            label={t("signalCardLeverage")}
            value={`${ticket.leverage}x`}
          />
          <MetaItem
            icon={LayersIcon}
            label={t("signalCardSize")}
            value={ticket.quantity.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
          />
          {rewardRisk != null ? (
            <MetaItem
              icon={ScaleIcon}
              label={t("signalCardRewardRisk")}
              value={`1 : ${rewardRisk.toFixed(2)}`}
            />
          ) : null}
          {riskUsd != null ? (
            <MetaItem
              icon={WalletIcon}
              label={t("signalCardRisk")}
              value={`~$${riskUsd.toFixed(2)} · ${(PAPER_AI_RISK_FRACTION * 100).toFixed(1)}%`}
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}

export { ChatSignalCard }
