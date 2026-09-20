import type { ChatCreditBalance, TrialInfo } from "@/lib/api/types"

export type CreditUsagePeriodKey = "daily" | "weekly"

export type CreditUsagePeriod = {
  key: CreditUsagePeriodKey
  used: number
  remaining: number
  limit: number
  resetAt: string
  /** Used fraction in 0..1 */
  usedFraction: number
}

export type CreditUsageStatus = {
  daily: CreditUsagePeriod
  weekly: CreditUsagePeriod
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function isChatCreditBalance(value: unknown): value is ChatCreditBalance {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (
    "remaining_daily" in record &&
    "remaining_weekly" in record &&
    "daily_limit" in record &&
    "weekly_limit" in record
  )
}

export function buildCreditUsagePeriod(input: {
  key: CreditUsagePeriodKey
  remaining: number
  limit: number
  resetAt: string
}): CreditUsagePeriod {
  const limit = Math.max(0, asFiniteNumber(input.limit))
  const remaining = Math.max(0, asFiniteNumber(input.remaining))
  const used = Math.max(0, limit - remaining)
  return {
    key: input.key,
    used,
    remaining,
    limit,
    resetAt: input.resetAt,
    usedFraction: limit > 0 ? clamp01(used / limit) : 0,
  }
}

export function creditUsageFromBalance(
  balance: ChatCreditBalance
): CreditUsageStatus {
  return {
    daily: buildCreditUsagePeriod({
      key: "daily",
      remaining: balance.remaining_daily,
      limit: balance.daily_limit,
      resetAt: balance.daily_reset_at,
    }),
    weekly: buildCreditUsagePeriod({
      key: "weekly",
      remaining: balance.remaining_weekly,
      limit: balance.weekly_limit,
      resetAt: balance.weekly_reset_at,
    }),
  }
}

export function formatCreditCount(value: number): string {
  if (!Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCreditResetAt(value?: string | null): string {
  if (!value) return "—"
  const ms = Date.parse(value)
  if (!Number.isFinite(ms)) return "—"
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms))
}

export function formatCreditUsageCompact(
  balance: ChatCreditBalance | null | undefined
): string | null {
  if (!balance) return null
  const usage = creditUsageFromBalance(balance)
  return `Daily ${formatCreditCount(usage.daily.remaining)}/${formatCreditCount(usage.daily.limit)} · Weekly ${formatCreditCount(usage.weekly.remaining)}/${formatCreditCount(usage.weekly.limit)}`
}

export function formatTrialUsageCompact(trial: TrialInfo | null | undefined): string | null {
  if (!trial) return null
  return `Guest ${formatCreditCount(trial.messages_remaining)}/${formatCreditCount(trial.messages_limit)} left`
}
