"use client"

import * as React from "react"
import { GaugeIcon } from "lucide-react"

import { fetchCoPilotUsage } from "@/lib/api/co-pilot"
import type { ChatCreditBalance, TrialInfo } from "@/lib/api/types"
import {
  creditUsageFromBalance,
  formatCreditCount,
  formatCreditResetAt,
  type CreditUsagePeriod,
} from "@/lib/api/credit-usage"
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
  const pct = Math.round(period.usedFraction * 100)
  return (
    <div className={cn("min-w-0 px-5 py-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {title}
          </p>
          <p className="mt-1.5 text-[17px] font-semibold tracking-tight tabular-nums">
            {formatCreditCount(period.remaining)}
            <span className="text-sm font-medium text-muted-foreground">
              {" "}
              / {formatCreditCount(period.limit)}
            </span>
          </p>
        </div>
        <p className="text-[12px] tabular-nums text-muted-foreground">
          {formatCreditCount(period.used)} used
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            pct >= 90 ? "bg-destructive" : "bg-foreground/80"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Resets {formatCreditResetAt(period.resetAt)}
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
  const usage = balance ? creditUsageFromBalance(balance) : null

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Credit usage</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily and weekly co-pilot limits for your plan.
          </p>
        </div>
        {onRefresh ? (
          <button
            type="button"
            className="rounded-xl px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
            disabled={loading}
            onClick={onRefresh}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {usage ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/90">
          <div className="grid sm:grid-cols-2">
            <UsageMeter
              title="Daily remaining"
              period={usage.daily}
              className="border-b border-border/50 sm:border-r sm:border-b-0"
            />
            <UsageMeter title="Weekly remaining" period={usage.weekly} />
          </div>
        </div>
      ) : trial ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/90 px-5 py-4">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Guest trial
          </p>
          <p className="mt-1.5 text-[17px] font-semibold tracking-tight tabular-nums">
            {formatCreditCount(trial.messages_remaining)}
            <span className="text-sm font-medium text-muted-foreground">
              {" "}
              / {formatCreditCount(trial.messages_limit)} left
            </span>
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Resets {formatCreditResetAt(trial.weekly_reset_at)}
          </p>
        </div>
      ) : loading ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/90 px-5 py-8">
          <p className="text-sm text-muted-foreground">Loading credit usage…</p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/90 px-5 py-4">
          <GaugeIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sign in to see daily and weekly credit limits.
          </p>
        </div>
      )}
    </section>
  )
}

function useCreditUsage(enabled: boolean) {
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
        err instanceof Error ? err.message : "Could not load credit usage"
      )
    } finally {
      setLoading(false)
    }
  }, [enabled])

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
