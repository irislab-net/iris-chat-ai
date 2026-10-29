"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { useAuth } from "@/components/auth/auth-provider"
import { ExurLogo } from "@/components/brand/exur-logo"
import { DeskGlassCard } from "@/components/desk/desk-page-frame"
import { Switch } from "@/components/ui/switch"
import { setAutoTradeEnabled } from "@/lib/api/wallet"
import { formatUsd, pnlToneClass } from "@/lib/desk-mock/format"
import type { DeskWalletBalances } from "@/lib/desk-mock/types"
import { cn } from "@/lib/utils"

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[10px] leading-none font-medium tracking-[0.06em] text-muted-foreground/55 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "truncate text-[15px] leading-none font-medium tabular-nums tracking-tight",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
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
  const [autoTrade, setAutoTrade] = React.useState(
    () => user?.auto_trade_enabled !== false
  )
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (typeof user?.auto_trade_enabled === "boolean") {
      setAutoTrade(user.auto_trade_enabled)
    }
  }, [user?.auto_trade_enabled])

  async function onAutoTradeChange(next: boolean) {
    if (pending) return
    const previous = autoTrade
    setAutoTrade(next)
    setPending(true)
    try {
      const enabled = await setAutoTradeEnabled(next)
      setAutoTrade(enabled)
      await refresh()
    } catch {
      setAutoTrade(previous)
    } finally {
      setPending(false)
    }
  }

  return (
    <DeskGlassCard
      className={cn("p-4 sm:p-5", className)}
      contentClassName="flex flex-col gap-4 sm:gap-5"
    >
      <div className="flex items-center justify-between gap-4">
        <ExurLogo
          decorative
          variant="gradient"
          shimmer
          size={48}
          className="size-12 shrink-0 overflow-hidden rounded-full p-[1.5%]"
        />
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 space-y-1 text-end">
            <p
              id={labelId}
              className="text-[13px] leading-none font-semibold tracking-tight text-foreground"
            >
              {t("autoTrade")}
            </p>
            <p
              className={cn(
                "text-[12px] leading-none font-medium",
                autoTrade
                  ? "text-[#1D4ED8] dark:text-[#93C5FD]"
                  : "text-muted-foreground"
              )}
            >
              {autoTrade ? t("autoTradeOn") : t("autoTradeOff")}
            </p>
          </div>
          <Switch
            checked={autoTrade}
            disabled={!user || pending}
            onCheckedChange={(next) => void onAutoTradeChange(next)}
            aria-labelledby={labelId}
            className={
              autoTrade ? "bg-[#2563EB] hover:bg-[#1D4ED8]" : undefined
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-3 border-t border-border/35 pt-4 dark:border-white/8 sm:gap-x-5 sm:pt-5">
        <Stat
          label={t("inPositions")}
          value={formatUsd(balances.lockedUsd)}
        />
        <Stat
          label={t("todayPnl")}
          value={formatUsd(balances.todayPnlUsd, { signed: true })}
          valueClassName={pnlToneClass(balances.todayPnlUsd)}
        />
        <Stat
          label={t("totalPnl")}
          value={formatUsd(balances.realizedPnlUsd, { signed: true })}
          valueClassName={pnlToneClass(balances.realizedPnlUsd)}
        />
      </div>
    </DeskGlassCard>
  )
}

export { TradeSummaryCard }
