"use client"

import * as React from "react"
import { PinIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCardClass,
  chatMobileSheetChipActiveClass,
  chatMobileSheetChipClass,
  chatMobileSheetCompactContentClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatSheetDoneCheck } from "@/components/app-shell/chat-sheet-done-check"
import { MarketAssetLogo } from "@/components/dashboard/market-asset-logo"
import { Button } from "@/components/ui/button"
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
import { Link } from "@/i18n/navigation"
import { useIsDesktop } from "@/hooks/use-media-query"
import {
  deskChartRangeSpec,
  type DeskChartRange,
} from "@/lib/api/candles"
import {
  formatCompactUsd,
  formatFundingRate,
  formatPct,
  formatPrice,
  formatUsd,
  pnlToneClass,
} from "@/lib/desk-mock/format"
import type { DeskMarketQuote } from "@/lib/desk-mock/types"
import { DESK_AI_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

const RANGE_KEYS: DeskChartRange[] = ["live", "1d", "1w", "1m", "1y"]

type MarketDetailSheetProps = {
  market: DeskMarketQuote | null
  open: boolean
  onOpenChange: (open: boolean) => void
  marked: boolean
  onToggleMarked: () => void
}

function DetailSpark({
  values,
  up,
}: {
  values: number[]
  up: boolean
}) {
  const uid = React.useId().replace(/:/g, "")
  const fillId = `mkt-fill-${up ? "up" : "down"}-${uid}`

  if (values.length < 2) {
    return (
      <div className="flex h-36 items-center justify-center text-[13px] text-muted-foreground">
        —
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const w = 320
  const h = 144
  const padY = 10
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - padY - ((v - min) / span) * (h - padY * 2)
    return { x, y }
  })
  const line = pts.map((p) => `${p.x},${p.y}`).join(" ")
  const area = `0,${h} ${line} ${w},${h}`
  const stroke = up ? "oklch(0.65 0.17 155)" : "oklch(0.62 0.2 25)"
  const fillTop = up
    ? "oklch(0.65 0.17 155 / 0.28)"
    : "oklch(0.62 0.2 25 / 0.28)"
  const fillBottom = up
    ? "oklch(0.65 0.17 155 / 0)"
    : "oklch(0.62 0.2 25 / 0)"

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-36 w-full overflow-visible"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillTop} />
          <stop offset="100%" stopColor={fillBottom} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${fillId})`} />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function StatRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/35 py-3 last:border-b-0 dark:border-white/8">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-[14px] font-medium tabular-nums tracking-tight",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  )
}

function MarketDetailBody({
  market,
  marked,
  onToggleMarked,
  onClose,
}: {
  market: DeskMarketQuote
  marked: boolean
  onToggleMarked: () => void
  onClose: () => void
}) {
  const t = useTranslations("deskMarkets")
  const [range, setRange] = React.useState<DeskChartRange>("1d")
  const [closes, setCloses] = React.useState<number[]>([])
  const [chartLoading, setChartLoading] = React.useState(true)
  const quote = market.quote ?? "USD"
  const pair = `${market.instrument}/${quote}`

  const dayPrev =
    market.change24hPct === -100
      ? 0
      : market.price / (1 + market.change24hPct / 100)
  const dayChangeUsd = market.price - dayPrev

  const chartFirst = closes[0]
  const chartLast = closes.length > 0 ? closes[closes.length - 1] : null
  const hasChartMove =
    chartFirst != null &&
    chartLast != null &&
    Number.isFinite(chartFirst) &&
    chartFirst > 0
  const rangeChangePct = hasChartMove
    ? ((chartLast! - chartFirst!) / chartFirst!) * 100
    : market.change24hPct
  const rangeChangeUsd = hasChartMove
    ? chartLast! - chartFirst!
    : dayChangeUsd
  const up = rangeChangePct >= 0

  React.useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const spec = deskChartRangeSpec(range)
    setCloses([])
    setChartLoading(true)

    async function load(showLoading: boolean) {
      if (showLoading) setChartLoading(true)
      try {
        const params = new URLSearchParams({
          range,
          instrument: market.instrument,
        })
        if (market.hlCoin) params.set("coin", market.hlCoin)
        const res = await fetch(`/api/market/candles?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("candles failed")
        const data = (await res.json()) as {
          candles?: Array<{ c?: number }>
        }
        if (cancelled) return
        const next = (data.candles ?? [])
          .map((bar) => Number(bar.c))
          .filter((v) => Number.isFinite(v) && v > 0)
        setCloses(next)
      } catch {
        if (!cancelled && !controller.signal.aborted && showLoading) {
          setCloses([])
        }
      } finally {
        if (!cancelled && showLoading) setChartLoading(false)
      }
    }

    void load(true)

    if (!spec.pollMs) {
      return () => {
        cancelled = true
        controller.abort()
      }
    }

    const pollId = window.setInterval(() => {
      void load(false)
    }, spec.pollMs)

    return () => {
      cancelled = true
      controller.abort()
      window.clearInterval(pollId)
    }
  }, [market.hlCoin, market.instrument, range])

  return (
    <>
      <div
        className={cn(
          chatMobileSheetBodyClass,
          "min-h-0 flex-1 overflow-y-auto pt-2 pb-2"
        )}
      >
        <div className="flex items-start justify-between gap-3 px-0.5">
          <div className="flex min-w-0 items-center gap-3">
            <MarketAssetLogo
              symbol={market.instrument}
              className="size-11 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold tracking-tight">
                {market.label}
              </p>
              <p className="truncate text-[13px] text-muted-foreground">
                {pair}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-end">
            <p className="text-[20px] leading-none font-semibold tabular-nums tracking-tight">
              {formatPrice(market.price, market.instrument)}
            </p>
            <p
              className={cn(
                "mt-1.5 text-[13px] font-semibold tabular-nums",
                pnlToneClass(rangeChangePct)
              )}
            >
              {formatPct(rangeChangePct)}
              <span className="ms-1.5 font-medium opacity-70">
                {formatUsd(rangeChangeUsd, {
                  signed: true,
                  digits: Math.abs(rangeChangeUsd) >= 100 ? 0 : 2,
                })}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4">
          {chartLoading && closes.length < 2 ? (
            <div className="flex h-36 items-center justify-center text-[13px] text-muted-foreground">
              {t("chartLoading")}
            </div>
          ) : closes.length < 2 ? (
            <div className="flex h-36 items-center justify-center text-[13px] text-muted-foreground">
              {t("chartEmpty")}
            </div>
          ) : (
            <DetailSpark values={closes} up={up} />
          )}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {RANGE_KEYS.map((key) => {
              const active = range === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={cn(
                    chatMobileSheetChipClass,
                    "h-8 px-3 text-[12px]",
                    active && chatMobileSheetChipActiveClass
                  )}
                >
                  {t(`range.${key}`)}
                </button>
              )
            })}
          </div>
        </div>

        <div className={cn(chatMobileSheetCardClass, "mt-5 px-4 py-1")}>
          <div className="flex items-center justify-between gap-2 border-b border-border/35 py-3 dark:border-white/8">
            <p className="text-[13px] font-semibold tracking-tight">
              {t("wrapTitle")}
            </p>
            <p className="text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
              {t("wrapSubtitle")}
            </p>
          </div>
          <StatRow
            label={t("last")}
            value={formatPrice(market.price, market.instrument)}
          />
          <StatRow
            label={t("prevDay")}
            value={formatPrice(market.prevDayPx, market.instrument)}
          />
          <StatRow
            label={t("volume24hFull")}
            value={formatCompactUsd(market.volume24hUsd ?? 0)}
          />
          <StatRow
            label={t("openInterest")}
            value={
              market.openInterestUsd != null && market.openInterestUsd > 0
                ? formatCompactUsd(market.openInterestUsd)
                : "—"
            }
          />
          <StatRow
            label={t("funding")}
            value={
              market.fundingRate != null
                ? formatFundingRate(market.fundingRate)
                : "—"
            }
            valueClassName={
              market.fundingRate != null
                ? pnlToneClass(market.fundingRate)
                : undefined
            }
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 pb-1">
          <Button
            type="button"
            variant="ghost"
            aria-pressed={marked}
            onClick={onToggleMarked}
            className={cn(
              chatMobileSheetSecondaryButtonClass,
              "h-11! min-h-11 gap-1.5 text-[14px]"
            )}
          >
            <PinIcon
              className={cn("size-4 stroke-[1.75]", marked && "fill-current")}
              aria-hidden
            />
            {marked ? t("unmarkShort") : t("markShort")}
          </Button>
          <Button
            nativeButton={false}
            variant="ghost"
            className={cn(
              chatMobileSheetPrimaryButtonClass,
              "h-11! min-h-11 gap-1.5 text-[14px]"
            )}
            render={<Link href={DESK_AI_PATH} onClick={onClose} />}
          >
            {t("askExur")}
          </Button>
        </div>
      </div>
    </>
  )
}

function MarketDetailSheet({
  market,
  open,
  onOpenChange,
  marked,
  onToggleMarked,
}: MarketDetailSheetProps) {
  const t = useTranslations("deskMarkets")
  const isDesktop = useIsDesktop()
  const title = market
    ? `${market.instrument}/${market.quote ?? "USD"}`
    : t("detailTitle")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            chatDesktopDialogClass,
            "max-h-[min(85dvh,42rem)] gap-0 overflow-hidden p-0 sm:max-w-md"
          )}
        >
          <DialogHeader className={cn(chatMobileSheetHeaderClass, "px-5 pt-5")}>
            <DialogTitle className={chatMobileSheetTitleClass}>
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {market?.label ?? title}
            </DialogDescription>
          </DialogHeader>
          {open && market ? (
            <MarketDetailBody
              market={market}
              marked={marked}
              onToggleMarked={onToggleMarked}
              onClose={() => onOpenChange(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          chatMobileSheetCompactContentClass,
          "max-h-[min(92dvh,44rem)]"
        )}
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
          <SheetDescription className="sr-only">
            {market?.label ?? title}
          </SheetDescription>
        </SheetHeader>
        {open && market ? (
          <MarketDetailBody
            market={market}
            marked={marked}
            onToggleMarked={onToggleMarked}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export { MarketDetailSheet }
