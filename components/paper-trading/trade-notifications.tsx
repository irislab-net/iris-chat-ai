"use client"

import * as React from "react"
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CircleCheckIcon,
  CircleXIcon,
  ShieldAlertIcon,
  TargetIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  formatTradingPnl,
  formatTradingPrice,
  formatTradingQty,
} from "@/lib/trading/format"
import {
  playTradeNotificationDing,
  unlockTradeNotificationAudio,
} from "@/lib/trade-notification-chime"
import {
  type ClosedTrade,
  type Position,
  type PositionSide,
} from "@/lib/trading/types"
import { cn } from "@/lib/utils"

type TradeNoticeKind =
  | "open"
  | "fill"
  | "close"
  | "stop_loss"
  | "take_profit"
  | "liquidation"

type TradeNoticeInput = {
  id: string
  kind: TradeNoticeKind
  title: string
  side: PositionSide
  symbol: string
  quantity: string
  meta?: string
}

type NoticeVisual = {
  Icon: LucideIcon
  accentWash: string
  iconWrap: string
  icon: string
  side: string
}

function noticeVisual(kind: TradeNoticeKind, side: PositionSide): NoticeVisual {
  const long = side === "LONG"
  const sideTone = long
    ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
    : "bg-red-500/12 text-red-600 dark:text-red-400"

  switch (kind) {
    case "take_profit":
      return {
        Icon: TargetIcon,
        accentWash:
          "from-emerald-400/28 via-emerald-500/10 to-transparent dark:from-emerald-400/22 dark:via-emerald-500/8",
        iconWrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        icon: "text-emerald-600 dark:text-emerald-400",
        side: sideTone,
      }
    case "stop_loss":
    case "liquidation":
      return {
        Icon: kind === "liquidation" ? ShieldAlertIcon : CircleXIcon,
        accentWash:
          "from-red-400/28 via-red-500/10 to-transparent dark:from-red-400/22 dark:via-red-500/8",
        iconWrap: "bg-red-500/10 text-red-600 dark:text-red-400",
        icon: "text-red-600 dark:text-red-400",
        side: sideTone,
      }
    case "open":
    case "fill":
      return {
        Icon: long ? ArrowUpRightIcon : ArrowDownRightIcon,
        accentWash: long
          ? "from-emerald-400/28 via-emerald-500/10 to-transparent dark:from-emerald-400/22 dark:via-emerald-500/8"
          : "from-red-400/28 via-red-500/10 to-transparent dark:from-red-400/22 dark:via-red-500/8",
        iconWrap: long
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400",
        icon: long
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400",
        side: sideTone,
      }
    case "close":
    default:
      return {
        Icon: CircleCheckIcon,
        accentWash:
          "from-foreground/10 via-foreground/4 to-transparent dark:from-white/12 dark:via-white/4",
        iconWrap: "bg-muted/80 text-muted-foreground",
        icon: "text-muted-foreground",
        side: sideTone,
      }
  }
}

function TradeNoticeCard({
  input,
  onDismiss,
}: {
  input: TradeNoticeInput
  onDismiss: () => void
}) {
  const visual = noticeVisual(input.kind, input.side)
  const Icon = visual.Icon

  return (
    <div
      aria-live="polite"
      className={cn(
        "trade-notice-card group/trade-notice pointer-events-auto relative w-[15rem] max-w-[calc(100vw-1.75rem)] overflow-hidden rounded-xl border border-white/10 bg-card/88 text-left shadow-[0_10px_28px_-14px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.12)] ring-1 ring-foreground/[0.06] backdrop-blur-xl",
        "transition-[transform,box-shadow] duration-200",
        "hover:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.16)]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-0 bg-gradient-to-r",
          visual.accentWash
        )}
      />
      <div className="relative z-[2] flex min-w-0 items-center gap-2 pl-3 pr-1.5 py-2">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/10",
            visual.iconWrap
          )}
        >
          <Icon className={cn("size-3.5 stroke-[2]", visual.icon)} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-medium leading-none tracking-tight text-foreground">
            {input.title}
          </span>
          <span className="mt-1.5 flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none",
                visual.side
              )}
            >
              {input.side}
            </span>
            <span className="truncate font-mono text-[10px] leading-none tabular-nums text-muted-foreground">
              {input.quantity} {input.symbol}
            </span>
            {input.meta ? (
              <span className="truncate font-mono text-[10px] leading-none tabular-nums text-foreground/75">
                {input.meta}
              </span>
            ) : null}
          </span>
        </span>
        <button
          type="button"
          aria-label="Dismiss notification"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md",
            "text-muted-foreground/65 transition-colors",
            "hover:bg-foreground/8 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
          onClick={onDismiss}
        >
          <XIcon className="size-3 stroke-[2.25]" />
        </button>
      </div>
    </div>
  )
}

function showTradeNotice(input: TradeNoticeInput) {
  void playTradeNotificationDing()

  toast.custom(
    (toastId) => (
      <TradeNoticeCard input={input} onDismiss={() => toast.dismiss(toastId)} />
    ),
    {
      id: input.id,
      duration: Infinity,
      position: "top-right",
    }
  )
}

function closedTradeKind(reason: ClosedTrade["reason"]): TradeNoticeKind {
  switch (reason) {
    case "STOP_LOSS":
      return "stop_loss"
    case "TAKE_PROFIT":
      return "take_profit"
    case "LIQUIDATION":
      return "liquidation"
    case "MANUAL":
    case "AMBIGUOUS":
      return "close"
  }
}

function closedTradeTitle(reason: ClosedTrade["reason"]) {
  switch (reason) {
    case "STOP_LOSS":
      return "Stop loss hit"
    case "TAKE_PROFIT":
      return "Take profit hit"
    case "LIQUIDATION":
      return "Position liquidated"
    case "MANUAL":
      return "Position closed"
    case "AMBIGUOUS":
      return "Position closed"
  }
}

function showPositionOpenedNotice(position: Position, opened: boolean) {
  showTradeNotice({
    id: `trade-open-${position.id}-${Date.now()}`,
    kind: opened ? "open" : "fill",
    title: opened ? "Position opened" : "Order filled",
    side: position.side,
    symbol: position.symbol,
    quantity: formatTradingQty(position.quantity),
    meta: `@ ${formatTradingPrice(position.entryPrice)}`,
  })
}

function showPositionClosedNotice(trade: ClosedTrade) {
  showTradeNotice({
    id: `trade-close-${trade.id}`,
    kind: closedTradeKind(trade.reason),
    title: closedTradeTitle(trade.reason),
    side: trade.side,
    symbol: trade.symbol,
    quantity: formatTradingQty(trade.quantity),
    meta: formatTradingPnl(trade.realizedPnl),
  })
}

function useTradeHistoryNotifications(history: ClosedTrade[] | undefined) {
  const seenRef = React.useRef<Set<string>>(new Set())
  const primedRef = React.useRef(false)

  React.useEffect(() => {
    const unlock = () => unlockTradeNotificationAudio()
    window.addEventListener("pointerdown", unlock, { once: true })
    window.addEventListener("keydown", unlock, { once: true })
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [])

  React.useEffect(() => {
    const list = history ?? []
    if (!primedRef.current) {
      for (const trade of list) seenRef.current.add(trade.id)
      primedRef.current = true
      return
    }

    for (const trade of list) {
      if (seenRef.current.has(trade.id)) continue
      seenRef.current.add(trade.id)
      showPositionClosedNotice(trade)
    }
  }, [history])
}

export {
  showPositionOpenedNotice,
  showPositionClosedNotice,
  useTradeHistoryNotifications,
}
