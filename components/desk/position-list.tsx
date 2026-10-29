"use client"

import * as React from "react"
import {
  ActivityIcon,
  ChevronDownIcon,
  HistoryIcon,
  LayersIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { chatMobilePrimaryButtonClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { MarketAssetLogo } from "@/components/dashboard/market-asset-logo"
import { DeskEmptyState } from "@/components/desk/desk-empty-state"
import { DeskGlassCard } from "@/components/desk/desk-page-frame"
import { Link } from "@/i18n/navigation"
import {
  formatLeverage,
  formatPrice,
  formatRoe,
  formatUsd,
  pnlToneClass,
} from "@/lib/desk-mock/format"
import type { DeskPosition } from "@/lib/desk-mock/types"
import {
  landingGlassSheen,
  landingNavLinkInactive,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function positionSortTime(p: DeskPosition, mode: "active" | "history"): string {
  if (mode === "history") return p.closedAt ?? p.openedAt
  return p.openedAt
}

function sortPositionsNewestFirst(
  rows: DeskPosition[],
  mode: "active" | "history"
): DeskPosition[] {
  return [...rows].sort((a, b) =>
    positionSortTime(b, mode).localeCompare(positionSortTime(a, mode))
  )
}

function SideChip({ side }: { side: "long" | "short" }) {
  const t = useTranslations("deskTrade")
  const long = side === "long"
  return (
    <span
      className={cn(
        "relative isolate inline-flex items-center overflow-hidden rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        "border border-white/75 dark:border-white/20",
        "backdrop-blur-[28px]",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_-6px_rgba(15,23,42,0.14),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55)]",
        "dark:shadow-[0_1px_2px_rgba(0,0,0,0.28),0_6px_16px_-6px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_0_0_0.5px_rgba(255,255,255,0.12)]",
        long
          ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/14 dark:text-emerald-300"
          : "bg-rose-500/12 text-rose-700 dark:bg-rose-400/14 dark:text-rose-300"
      )}
    >
      {long ? t("long") : t("short")}
    </span>
  )
}

function Meta({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] leading-none font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "truncate text-[13px] leading-none font-medium tabular-nums",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  )
}

function PositionCard({
  position,
  mode,
  expanded,
  onToggle,
  collapsible = true,
}: {
  position: DeskPosition
  mode: "active" | "history"
  expanded: boolean
  onToggle: () => void
  collapsible?: boolean
}) {
  const t = useTranslations("deskTrade")
  const pnl =
    mode === "active" ? position.unrealizedPnlUsd : position.realizedPnlUsd

  const header = (
    <div className="flex w-full items-center gap-2 px-4 py-3.5 text-start">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MarketAssetLogo
          symbol={position.instrument}
          className="size-7 shrink-0"
        />
        <span className="text-[15px] font-semibold tracking-tight">
          {position.instrument}
        </span>
        <SideChip side={position.side} />
      </div>
      <p
        className={cn(
          "shrink-0 text-[15px] font-semibold tabular-nums",
          pnlToneClass(pnl)
        )}
      >
        {formatUsd(pnl, {
          signed: true,
          digits: Math.abs(pnl) > 0 && Math.abs(pnl) < 0.01 ? 4 : 2,
        })}
      </p>
      {collapsible ? (
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      ) : null}
    </div>
  )

  const positionCardShellClass = "p-0"

  const openedLabel = new Date(position.openedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Match header title start: px-4 + logo (size-7) + gap-2
  const detailsInlineStartClass = "ps-[calc(1rem+1.75rem+0.5rem)] pe-4"

  const details = (
    <div
      className={cn(
        detailsInlineStartClass,
        "pb-4",
        collapsible ? "pt-1" : "pt-0"
      )}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 sm:gap-x-3">
        <Meta
          label={t("size")}
          value={position.size.toLocaleString("en-US", {
            maximumFractionDigits: 6,
          })}
        />
        <Meta
          label={t("entry")}
          value={formatPrice(position.entryPrice, position.instrument)}
        />
        {mode === "active" ? (
          <>
            <Meta
              label={t("mark")}
              value={formatPrice(position.markPrice, position.instrument)}
            />
            <Meta
              label={t("roe")}
              value={formatRoe(
                position.unrealizedPnlUsd,
                position.marginUsd
              )}
              valueClassName={pnlToneClass(position.unrealizedPnlUsd)}
            />
            <Meta
              label={t("margin")}
              value={formatUsd(position.marginUsd)}
            />
            <Meta
              label={t("leverage")}
              value={formatLeverage(position.leverage)}
            />
            {position.liquidationPrice != null ? (
              <Meta
                label={t("liq")}
                value={formatPrice(
                  position.liquidationPrice,
                  position.instrument
                )}
                valueClassName="text-rose-700 dark:text-rose-300"
              />
            ) : null}
            {position.takeProfit != null ? (
              <Meta
                label={t("tp")}
                value={formatPrice(position.takeProfit, position.instrument)}
                valueClassName="text-emerald-700 dark:text-emerald-300"
              />
            ) : null}
            {position.stopLoss != null ? (
              <Meta
                label={t("sl")}
                value={formatPrice(position.stopLoss, position.instrument)}
                valueClassName="text-rose-700 dark:text-rose-300"
              />
            ) : null}
          </>
        ) : (
          <>
            <Meta
              label={t("exit")}
              value={formatPrice(position.markPrice, position.instrument)}
            />
            <Meta label={t("fees")} value={formatUsd(position.feeUsd)} />
            <Meta
              label={t("margin")}
              value={formatUsd(position.marginUsd)}
            />
            <Meta
              label={t("leverage")}
              value={formatLeverage(position.leverage)}
            />
          </>
        )}
      </div>

      {mode === "active" ? (
        <p className="mt-3 text-[12px] text-muted-foreground">
          {t("openedAt", { date: openedLabel })}
        </p>
      ) : null}

      {mode === "history" && position.closedAt ? (
        <p className="mt-3 text-[12px] text-muted-foreground">
          {t("closedAt", {
            date: new Date(position.closedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          })}
        </p>
      ) : null}
    </div>
  )

  if (!collapsible) {
    return (
      <DeskGlassCard className={positionCardShellClass}>
        {header}
        {details}
      </DeskGlassCard>
    )
  }

  return (
    <DeskGlassCard
      className={cn(positionCardShellClass, !expanded && "py-0")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full"
      >
        {header}
      </button>

      {expanded ? details : null}
    </DeskGlassCard>
  )
}

function PositionList({
  active,
  history,
  availableUsd = 0,
}: {
  active: DeskPosition[]
  history: DeskPosition[]
  availableUsd?: number
}) {
  const t = useTranslations("deskTrade")
  const [tab, setTab] = React.useState<"active" | "history">("active")
  const needsFunding = tab === "active" && availableUsd <= 0

  const rows = React.useMemo(
    () =>
      sortPositionsNewestFirst(tab === "active" ? active : history, tab),
    [active, history, tab]
  )

  const newestId = rows[0]?.id ?? null
  const [expandedId, setExpandedId] = React.useState<string | null>(newestId)
  const [expandScope, setExpandScope] = React.useState({
    tab,
    newestId,
  })

  if (expandScope.tab !== tab || expandScope.newestId !== newestId) {
    setExpandScope({ tab, newestId })
    setExpandedId(newestId)
  }

  return (
    <section className="flex flex-col gap-3.5 sm:gap-4">
      <div
        role="tablist"
        aria-label={t("positions")}
        className={cn(
          "relative isolate flex items-center gap-1.5 overflow-hidden rounded-[1.35rem] p-1.5",
          "border border-white/80 dark:border-white/20",
          "bg-white/42 supports-[backdrop-filter]:bg-white/32 backdrop-blur-[40px] backdrop-saturate-[175%]",
          "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-10px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.6),inset_0_-8px_16px_-10px_rgba(15,23,42,0.07)]",
          "dark:bg-white/10 dark:supports-[backdrop-filter]:bg-white/8",
          "dark:shadow-[0_1px_2px_rgba(0,0,0,0.22),0_10px_28px_-10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_-10px_18px_-10px_rgba(0,0,0,0.4)]"
        )}
      >
        <span
          aria-hidden
          className={cn(landingGlassSheen, "rounded-[1.35rem]")}
        />
        {(
          [
            {
              id: "active" as const,
              label: t("activeTab"),
              count: active.length,
              icon: ActivityIcon,
            },
            {
              id: "history" as const,
              label: t("historyTab"),
              count: history.length,
              icon: HistoryIcon,
            },
          ] as const
        ).map(({ id, label, count, icon: Icon }) => {
          const selected = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={`${label} ${count}`}
              className={cn(
                "relative z-10 inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[1.1rem] px-3 text-[13px] leading-none transition-[background-color,color,box-shadow,border-color] duration-200",
                selected
                  ? cn(
                      "isolate overflow-hidden border border-white font-semibold text-foreground",
                      "bg-white dark:bg-white/22",
                      "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_6px_16px_-8px_rgba(15,23,42,0.14),inset_0_1px_1px_rgba(255,255,255,1),inset_0_0_0_0.5px_rgba(255,255,255,0.8),inset_0_-6px_12px_-8px_rgba(15,23,42,0.05)]",
                      "dark:border-white/28",
                      "dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_6px_16px_-8px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.32),inset_0_0_0_0.5px_rgba(255,255,255,0.16),inset_0_-8px_14px_-8px_rgba(0,0,0,0.35)]"
                    )
                  : landingNavLinkInactive
              )}
              onClick={() => setTab(id)}
            >
              <Icon className="size-3.5 shrink-0 stroke-[1.75]" aria-hidden />
              <span>{label}</span>
              <span
                className={cn(
                  "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums leading-none",
                  selected
                    ? "bg-[#2563EB]/14 text-[#1D4ED8] dark:bg-[#2563EB]/28 dark:text-[#93C5FD]"
                    : "bg-black/[0.06] text-muted-foreground dark:bg-white/12"
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <DeskEmptyState
          icon={tab === "active" ? ActivityIcon : LayersIcon}
          title={tab === "active" ? t("emptyActiveTitle") : t("emptyHistoryTitle")}
          description={
            tab === "active"
              ? needsFunding
                ? t("emptyActiveUnfunded")
                : t("emptyActive")
              : t("emptyHistory")
          }
          action={
            needsFunding ? (
              <Link
                href="/profile?deposit=1"
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-full px-5 text-[13px] font-semibold",
                  chatMobilePrimaryButtonClass
                )}
              >
                {t("emptyFundCta")}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((p) => {
            const historyList = tab === "history"
            return (
              <PositionCard
                key={p.id}
                position={p}
                mode={tab}
                expanded={historyList || expandedId === p.id}
                onToggle={
                  historyList
                    ? () => undefined
                    : () =>
                        setExpandedId((cur) => (cur === p.id ? null : p.id))
                }
                collapsible={!historyList}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

export { PositionList }
