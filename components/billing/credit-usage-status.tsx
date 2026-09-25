"use client"

import * as React from "react"
import { GaugeIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { BillingGlassPanel } from "@/components/billing/billing-glass"
import { fetchCoPilotUsage } from "@/lib/api/co-pilot"
import type { ChatCreditBalance, TrialInfo } from "@/lib/api/types"
import {
  creditUsageFromBalance,
  formatCreditCount,
  formatCreditResetAt,
  type CreditUsagePeriod,
} from "@/lib/api/credit-usage"
import { landingCta, landingTitleCard } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

function UsageMeter({
  title,
  period,
  className,
}: {
  title: string
  period: CreditUsagePeriod
  className?: string
}) {
  const t = useTranslations("billingPage")
  const pct = Math.round(period.usedFraction * 100)
  return (
    <div className={cn("min-w-0 px-5 py-4 sm:px-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {title}
          </p>
          <p className="mt-1.5 text-[1.05rem] font-medium tracking-tight tabular-nums">
            {formatCreditCount(period.remaining)}
            <span className="text-sm font-medium text-muted-foreground">
              {" "}
              / {formatCreditCount(period.limit)}
            </span>
          </p>
        </div>
        <p className="text-xs tabular-nums text-muted-foreground">
          {t("usedCount", { count: formatCreditCount(period.used) })}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/55 dark:bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            pct >= 90 ? "bg-destructive" : "bg-[#2563EB]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {t("resetsAt", { date: formatCreditResetAt(period.resetAt) })}
      </p>
    </div>
  )
}

function CreditUsageStatusPanel({
  balance,
  trial,
  loading,
  error,
  onRefresh,
  className,
}: {
  balance: ChatCreditBalance | null
  trial?: TrialInfo | null
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  className?: string
}) {
  const t = useTranslations("billingPage")
  const usage = balance ? creditUsageFromBalance(balance) : null

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={landingTitleCard}>{t("creditsTitle")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("creditsSubtitle")}
          </p>
        </div>
        {onRefresh ? (
          <Button
            type="button"
            size="sm"
            className={landingCta("secondary", "sm")}
            disabled={loading}
            onClick={onRefresh}
          >
            {loading ? t("refreshing") : t("refresh")}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-2xl bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {usage ? (
        <BillingGlassPanel>
          <div className="grid sm:grid-cols-2">
            <UsageMeter
              title={t("dailyRemaining")}
              period={usage.daily}
              className="border-b border-white/45 dark:border-white/10 sm:border-e sm:border-b-0"
            />
            <UsageMeter title={t("weeklyRemaining")} period={usage.weekly} />
          </div>
        </BillingGlassPanel>
      ) : trial ? (
        <BillingGlassPanel>
          <div className="px-5 py-5 sm:px-6">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t("guestTrial")}
            </p>
            <p className="mt-1.5 text-[1.05rem] font-medium tracking-tight tabular-nums">
              {formatCreditCount(trial.messages_remaining)}
              <span className="text-sm font-medium text-muted-foreground">
                {" "}
                {t("leftOf", {
                  limit: formatCreditCount(trial.messages_limit),
                })}
              </span>
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t("resetsAt", {
                date: formatCreditResetAt(trial.weekly_reset_at),
              })}
            </p>
          </div>
        </BillingGlassPanel>
      ) : loading ? (
        <BillingGlassPanel>
          <div className="px-5 py-8 sm:px-6">
            <p className="text-sm text-muted-foreground">{t("loadingCredits")}</p>
          </div>
        </BillingGlassPanel>
      ) : (
        <BillingGlassPanel>
          <div className="flex items-start gap-3 px-5 py-4 sm:px-6">
            <GaugeIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("signInForCredits")}</p>
          </div>
        </BillingGlassPanel>
      )}
    </section>
  )
}

function useCreditUsage(enabled: boolean) {
  const t = useTranslations("billingPage")
  const [balance, setBalance] = React.useState<ChatCreditBalance | null>(null)
  const [trial, setTrial] = React.useState<TrialInfo | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    if (!enabled) {
      setBalance(null)
      setTrial(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const mapped = await fetchCoPilotUsage()
      setBalance(mapped.credit_balance ?? null)
      setTrial(mapped.trial ?? null)
    } catch (err) {
      setBalance(null)
      setTrial(null)
      setError(
        err instanceof Error ? err.message : t("creditsLoadError")
      )
    } finally {
      setLoading(false)
    }
  }, [enabled, t])

  React.useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      void refresh()
    })
    return () => {
      cancelled = true
    }
  }, [refresh])

  return { balance, trial, loading, error, refresh }
}

export { CreditUsageStatusPanel, useCreditUsage }
