"use client"

import * as React from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Loader2Icon,
  PlayIcon,
  SquareIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatMobileSheetBodyClass,
  chatMobileSheetCompactContentClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatSheetDoneCheck } from "@/components/app-shell/chat-sheet-done-check"
import { ChatStakingCoinTree } from "@/components/app-shell/chat-staking-coin-tree"
import { useAuth } from "@/components/auth/auth-provider"
import { AutoTradeStatusViz } from "@/components/desk/auto-trade-status-viz"
import { DeskGlassCard } from "@/components/desk/desk-page-frame"
import { Badge } from "@/components/ui/badge"
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
import { useIsDesktop } from "@/hooks/use-media-query"
import { setAutoTradeEnabled } from "@/lib/api/wallet"
import { formatUsd, pnlToneClass } from "@/lib/desk-mock/format"
import type { DeskWalletBalances } from "@/lib/desk-mock/types"
import { landingGlassSheen } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

const autoTradeGlassIdleClass = [
  "isolate overflow-hidden",
  "border border-white/80 dark:border-white/5",
  "bg-[#2563EB]/10 supports-[backdrop-filter]:bg-[#2563EB]/12",
  "backdrop-blur-[28px] backdrop-saturate-[175%]",
  "text-[#1D4ED8]",
  "shadow-[0_1px_2px_rgba(37,99,235,0.08),0_8px_22px_-8px_rgba(37,99,235,0.18),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.6),inset_0_-8px_16px_-10px_rgba(37,99,235,0.08)]",
  "dark:bg-[#2563EB]/18 dark:supports-[backdrop-filter]:bg-[#2563EB]/16 dark:text-[#93C5FD]",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.28),0_8px_22px_-8px_rgba(37,99,235,0.28),inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-10px_18px_-10px_rgba(0,0,0,0.35)]",
].join(" ")

const autoTradeGlassActiveClass = [
  "isolate overflow-hidden",
  "border border-white/70 dark:border-[#60A5FA]/35",
  "bg-[#2563EB] text-white",
  "backdrop-blur-[28px] backdrop-saturate-[175%]",
  "shadow-[0_1px_2px_rgba(37,99,235,0.28),0_10px_24px_-8px_rgba(37,99,235,0.5),inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_0_0_0.5px_rgba(255,255,255,0.28),inset_0_-8px_16px_-10px_rgba(15,23,42,0.28)]",
  "dark:bg-[#2563EB]/88",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_10px_24px_-8px_rgba(37,99,235,0.55),inset_0_1px_1px_rgba(255,255,255,0.32),inset_0_0_0_0.5px_rgba(255,255,255,0.18),inset_0_-10px_18px_-10px_rgba(0,0,0,0.45)]",
].join(" ")

function StatAmount({ value }: { value: string }) {
  const match = /^([+−-]?)(\$)(.+)$/u.exec(value)
  if (!match) {
    return <span className="min-w-0 truncate">{value}</span>
  }
  const [, sign, dollar, rest] = match
  return (
    <span className="min-w-0 truncate">
      {sign}
      <span className="text-muted-foreground/45">{dollar}</span>
      {rest}
    </span>
  )
}

function Stat({
  label,
  value,
  valueClassName,
  align = "start",
  trend,
}: {
  label: string
  value: string
  valueClassName?: string
  align?: "start" | "end"
  /** When set, shows an up/down icon from the signed amount. */
  trend?: number
}) {
  const trendDir =
    trend == null || trend === 0 ? null : trend > 0 ? "up" : "down"
  const TrendIcon = trendDir === "up" ? ArrowUpIcon : ArrowDownIcon
  const trendTone =
    trendDir === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trendDir === "down"
        ? "text-rose-600 dark:text-rose-400"
        : undefined

  return (
    <div className={cn("min-w-0 space-y-2", align === "end" && "text-end")}>
      <p className="text-[10px] leading-none font-medium tracking-wide text-muted-foreground/55">
        {label}
      </p>
      <p
        className={cn(
          "inline-flex max-w-full items-center gap-0.5 truncate text-[15px] leading-none font-medium tabular-nums tracking-tight",
          align === "end" && "justify-end",
          valueClassName
        )}
      >
        {trendDir ? (
          <TrendIcon
            className={cn("size-3.5 shrink-0 stroke-[2.25]", trendTone)}
            aria-hidden
          />
        ) : null}
        <StatAmount value={value} />
      </p>
    </div>
  )
}

function AutoTradeConfirmBody({
  enabling,
  pending,
  active,
  onConfirm,
  onCancel,
  footerClassName,
}: {
  enabling: boolean
  pending: boolean
  /** When true, replay the coin-tree grow sequence (sheet/dialog open). */
  active: boolean
  onConfirm: () => void
  onCancel: () => void
  footerClassName?: string
}) {
  const t = useTranslations("deskTrade")

  return (
    <>
      <div
        className={cn(
          chatMobileSheetBodyClass,
          "min-h-0 flex-1 overflow-y-auto overflow-x-visible pt-3 pb-2"
        )}
      >
        <p className="px-1 text-[14px] leading-relaxed text-muted-foreground">
          {enabling ? t("autoTradeEnableBody") : t("autoTradePauseBody")}
        </p>
        <div className="relative isolate overflow-visible py-3">
          <div
            aria-hidden
            className="chat-staking-liquid-noise pointer-events-none absolute inset-0 overflow-hidden rounded-[1.65rem]"
          >
            <div className="chat-staking-liquid-noise-wash" />
            <div className="chat-staking-liquid-noise-grain" />
            <div className="chat-staking-liquid-noise-sheen" />
          </div>
          <div
            className={cn(
              "relative z-10 overflow-visible transition-[filter,opacity] duration-500",
              !enabling && "opacity-55 grayscale-[0.35]"
            )}
          >
            <ChatStakingCoinTree active={active} />
          </div>
        </div>
      </div>
      <div className={cn(chatMobileSheetFooterClass, "shrink-0", footerClassName)}>
        <div className={cn(chatMobileSheetFooterBarClass, "flex flex-col gap-2 pt-3 pb-0")}>
          <Button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={chatMobileSheetPrimaryButtonClass}
          >
            {pending ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : null}
            {enabling ? t("autoTradeEnableConfirm") : t("autoTradePauseConfirm")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={onCancel}
            className="h-11 w-full rounded-full text-[14px] font-medium text-muted-foreground"
          >
            {t("autoTradeConfirmCancel")}
          </Button>
        </div>
      </div>
    </>
  )
}

function AutoTradeConfirmSheet({
  open,
  onOpenChange,
  enabling,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enabling: boolean
  pending: boolean
  onConfirm: () => void
}) {
  const t = useTranslations("deskTrade")
  const isDesktop = useIsDesktop()
  const title = enabling
    ? t("autoTradeEnableTitle")
    : t("autoTradePauseTitle")

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
            <DialogTitle className={chatMobileSheetTitleClass}>
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
          </DialogHeader>
          {open ? (
            <AutoTradeConfirmBody
              enabling={enabling}
              pending={pending}
              active={open}
              onConfirm={onConfirm}
              onCancel={() => onOpenChange(false)}
              footerClassName="pb-2"
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
          "max-h-[min(88dvh,36rem)]"
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
            <ChatSheetDoneCheck
              onClick={() => {
                if (!pending) onOpenChange(false)
              }}
            />
          </div>
          <SheetDescription className="sr-only">{title}</SheetDescription>
        </SheetHeader>
        {open ? (
          <AutoTradeConfirmBody
            enabling={enabling}
            pending={pending}
            active={open}
            onConfirm={onConfirm}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function TradeSummaryCard({
  balances,
  className,
}: {
  balances: DeskWalletBalances
  className?: string
}) {
  const t = useTranslations("deskTrade")
  const { user, refresh } = useAuth()
  const labelId = React.useId()
  const serverAutoTrade = user?.auto_trade_enabled
  const authAutoTradeKey = `${user?.id ?? ""}:${String(serverAutoTrade)}`
  const [autoTrade, setAutoTrade] = React.useState(
    () => (user ? serverAutoTrade !== false : false)
  )
  const [syncedAuthAutoTradeKey, setSyncedAuthAutoTradeKey] =
    React.useState(authAutoTradeKey)
  const [pending, setPending] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [confirmEnabling, setConfirmEnabling] = React.useState(false)

  // Guests never show Active — only the signed-in server flag may light up.
  const showAutoTrade = Boolean(user) && autoTrade

  // Adjust during render when auth refreshes auto-trade (avoids setState-in-effect).
  if (authAutoTradeKey !== syncedAuthAutoTradeKey) {
    setSyncedAuthAutoTradeKey(authAutoTradeKey)
    if (!user) {
      setAutoTrade(false)
    } else if (typeof serverAutoTrade === "boolean") {
      setAutoTrade(serverAutoTrade)
    } else {
      setAutoTrade(true)
    }
  }

  function openConfirm() {
    if (!user || pending) return
    setConfirmEnabling(!autoTrade)
    setConfirmOpen(true)
  }

  async function onConfirmToggle() {
    if (pending) return
    const next = confirmEnabling
    const previous = autoTrade
    setPending(true)
    try {
      const enabled = await setAutoTradeEnabled(next)
      setAutoTrade(enabled)
      setConfirmOpen(false)
      await refresh()
    } catch {
      setAutoTrade(previous)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <DeskGlassCard
        className={cn("p-4 sm:p-5", className)}
        contentClassName="flex flex-col gap-4 sm:gap-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <AutoTradeStatusViz active={showAutoTrade} />
            <div className="min-w-0 space-y-1.5">
              <p
                id={labelId}
                className="text-[13px] leading-none font-semibold tracking-tight text-foreground"
              >
                {t("autoTrade")}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "h-5 rounded-full px-2 text-[11px] font-medium tracking-tight",
                  showAutoTrade
                    ? "border-transparent bg-[#2563EB] text-white shadow-none dark:bg-[#3B82F6]"
                    : "border-border/60 bg-muted/50 text-muted-foreground"
                )}
              >
                {showAutoTrade ? t("autoTradeOn") : t("autoTradeOff")}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            disabled={!user || pending}
            onClick={openConfirm}
            aria-labelledby={labelId}
            aria-pressed={showAutoTrade}
            aria-label={
              showAutoTrade ? t("autoTradeStopAria") : t("autoTradePlayAria")
            }
            className={cn(
              "relative inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow,border-color,opacity] duration-200",
              "outline-none focus-visible:ring-3 focus-visible:ring-[#2563EB]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:pointer-events-none disabled:opacity-45",
              showAutoTrade
                ? autoTradeGlassActiveClass
                : autoTradeGlassIdleClass
            )}
          >
            <span
              aria-hidden
              className={cn(landingGlassSheen, "rounded-full")}
            />
            <span className="relative z-10 inline-flex items-center justify-center">
              {pending ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : showAutoTrade ? (
                <SquareIcon className="size-3.5 fill-current" aria-hidden />
              ) : (
                <PlayIcon
                  className="ms-0.5 size-4 fill-[#2563EB] text-[#2563EB] dark:fill-[#93C5FD] dark:text-[#93C5FD]"
                  aria-hidden
                />
              )}
            </span>
          </button>
        </div>

        <div className="mx-auto grid w-[96%] max-w-full grid-cols-3 gap-x-3 gap-y-3 border-t border-border/35 px-1 pt-4 dark:border-white/8 sm:w-[94%] sm:gap-x-4 sm:px-1.5 sm:pt-5">
          <Stat
            label={t("inPositions")}
            value={formatUsd(balances.lockedUsd)}
            trend={balances.lockedUsd}
          />
          <Stat
            label={t("onHold")}
            value={formatUsd(balances.withdrawHoldUsd)}
            trend={balances.withdrawHoldUsd}
          />
          <Stat
            label={t("todayPnl")}
            value={formatUsd(balances.todayPnlUsd, { signed: true })}
            valueClassName={pnlToneClass(balances.todayPnlUsd)}
            trend={balances.todayPnlUsd}
            align="end"
          />
        </div>
      </DeskGlassCard>

      <AutoTradeConfirmSheet
        open={confirmOpen}
        onOpenChange={(open) => {
          if (pending) return
          setConfirmOpen(open)
        }}
        enabling={confirmEnabling}
        pending={pending}
        onConfirm={() => void onConfirmToggle()}
      />
    </>
  )
}

export { TradeSummaryCard }
