"use client"

import * as React from "react"
import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  Loader2Icon,
  ReceiptTextIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { DeskEmptyState } from "@/components/desk/desk-empty-state"
import {
  DeskGlassCard,
  DeskPageFrame,
} from "@/components/desk/desk-page-frame"
import { ProfileSkeleton } from "@/components/desk/desk-skeletons"
import { WalletActivityDetailSheet } from "@/components/desk/wallet-activity-detail-sheet"
import { WalletBankCard } from "@/components/desk/wallet-bank-card"
import { WalletDepositSheet } from "@/components/desk/wallet-deposit-sheet"
import { WalletWithdrawSheet } from "@/components/desk/wallet-withdraw-sheet"
import { useAuth } from "@/components/auth/auth-provider"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { usePathname, useRouter } from "@/i18n/navigation"
import { displayPlanName } from "@/lib/billing/catalog"
import { formatUsd, pnlToneClass } from "@/lib/desk-mock/format"
import { useMockLedger, useMockWallet } from "@/lib/desk-mock/hooks"
import type { DeskLedgerEntry } from "@/lib/desk-mock/types"
import {
  landingGlassSheen,
  landingNavLinkInactive,
} from "@/lib/landing-modern-styles"
import { userAccountLabel, userAccountSubline } from "@/lib/user-profile"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

type ActivityFilter = "all" | "deposit" | "withdrawal"

function isAwaitingTransfer(row: DeskLedgerEntry): boolean {
  return row.kind === "deposit" && row.status === "pending" && row.amountUsd <= 0
}

function statusLabel(
  row: DeskLedgerEntry,
  t: ReturnType<typeof useTranslations<"deskProfile">>
): string {
  if (isAwaitingTransfer(row)) return t("statusAwaiting")
  switch (row.status) {
    case "pending":
      return t("statusPending")
    case "reviewing":
      return t("statusReviewing")
    case "confirming":
      return t("statusConfirming")
    case "credited":
      return t("statusCredited")
    case "settled":
      return row.kind === "withdrawal" ? t("statusApproved") : t("statusSettled")
    case "failed":
      return t("statusFailed")
    case "cancelled":
      return t("statusCancelled")
    default:
      return row.status
  }
}

function statusToneClass(status: DeskLedgerEntry["status"]): string {
  switch (status) {
    case "credited":
    case "settled":
      return "bg-emerald-500/18 text-emerald-700 dark:bg-emerald-500/22 dark:text-emerald-300"
    case "confirming":
    case "reviewing":
      return "bg-[#2563EB]/18 text-[#1D4ED8] dark:bg-[#2563EB]/28 dark:text-[#93C5FD]"
    case "pending":
      return "bg-amber-500/18 text-amber-800 dark:bg-amber-500/22 dark:text-amber-200"
    case "failed":
    case "cancelled":
      return "bg-rose-500/18 text-rose-700 dark:bg-rose-500/22 dark:text-rose-300"
    default:
      return "bg-white/52 text-muted-foreground dark:bg-white/10"
  }
}

function formatLedgerRelativeWhen(iso: string, locale: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ""
  const diffMs = then - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" })
  if (abs < 60) return rtf.format(diffSec, "second")
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute")
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), "hour")
  if (abs < 86_400 * 30) return rtf.format(Math.round(diffSec / 86_400), "day")
  if (abs < 86_400 * 365) {
    return rtf.format(Math.round(diffSec / (86_400 * 30)), "month")
  }
  return rtf.format(Math.round(diffSec / (86_400 * 365)), "year")
}

/** Liquid glass pill — white rim + outer lift + inset specular. */
const activityLiquidGlassClass = [
  "relative isolate overflow-hidden rounded-full",
  "border border-white/75 dark:border-white/20",
  "backdrop-blur-[28px] backdrop-saturate-[170%]",
  "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_22px_-6px_rgba(15,23,42,0.16),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55),inset_0_-6px_14px_-8px_rgba(15,23,42,0.08)]",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.28),0_8px_22px_-6px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_-8px_16px_-8px_rgba(0,0,0,0.4)]",
].join(" ")

function ActivityGlassChip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        activityLiquidGlassClass,
        "inline-flex shrink-0 items-center justify-center px-2.5 py-1 text-[11px] font-medium",
        className
      )}
    >
      <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
      <span className="relative z-10">{children}</span>
    </span>
  )
}

function ActivityCard({
  row,
  onOpen,
}: {
  row: DeskLedgerEntry
  onOpen: (row: DeskLedgerEntry) => void
}) {
  const t = useTranslations("deskProfile")
  const locale = useLocale()
  const inbound = row.kind === "deposit"
  const Icon = inbound ? ArrowDownToLineIcon : ArrowUpFromLineIcon
  const awaiting = isAwaitingTransfer(row)
  const label = statusLabel(row, t)
  const when = formatLedgerRelativeWhen(row.createdAt, locale)

  return (
    <li>
      <DeskGlassCard className="p-0 sm:p-0">
        <button
          type="button"
          onClick={() => onOpen(row)}
          aria-label={`${t("activityOpenDetails")}: ${
            inbound ? t("deposit") : t("withdraw")
          } ${label}`}
          className={cn(
            "flex w-full items-start gap-3 px-4 py-3.5 text-start sm:px-5",
            awaiting && "opacity-80"
          )}
        >
          <span
            className={cn(
              activityLiquidGlassClass,
              "mt-0.5 flex size-9 shrink-0 items-center justify-center bg-white/55 text-foreground/70 dark:bg-white/12 dark:text-foreground/75"
            )}
            aria-hidden
          >
            <span
              aria-hidden
              className={cn(landingGlassSheen, "rounded-full")}
            />
            <Icon className="relative z-10 size-4 stroke-[1.75]" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "min-w-0 text-[15px] font-medium tracking-tight",
                  !awaiting && "tabular-nums",
                  !awaiting &&
                    pnlToneClass(
                      inbound ? row.amountUsd : -Math.abs(row.amountUsd)
                    )
                )}
              >
                {awaiting ? (
                  <span className="text-muted-foreground/70">—</span>
                ) : (
                  <>
                    {inbound
                      ? formatUsd(row.amountUsd, { signed: true })
                      : formatUsd(-Math.abs(row.amountUsd), {
                          signed: true,
                        })}
                    <span className="ms-1.5 text-[11px] font-normal text-muted-foreground/55">
                      {row.currency}
                    </span>
                  </>
                )}
              </p>
              <ActivityGlassChip className={statusToneClass(row.status)}>
                <span className="inline-flex items-center gap-1">
                  {row.status === "confirming" ||
                  row.status === "reviewing" ? (
                    <Loader2Icon
                      className="size-3 shrink-0 animate-spin"
                      aria-hidden
                    />
                  ) : null}
                  {label}
                </span>
              </ActivityGlassChip>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="min-w-0 truncate text-[12px] leading-snug text-muted-foreground">
                {inbound ? t("deposit") : t("withdraw")}
                {row.network ? ` · ${row.network}` : null}
              </p>
              {when ? (
                <p className="shrink-0 text-[12px] leading-snug text-muted-foreground tabular-nums">
                  {when}
                </p>
              ) : null}
            </div>
          </div>
        </button>
      </DeskGlassCard>
    </li>
  )
}

function ProfileView() {
  const t = useTranslations("deskProfile")
  const tw = useTranslations("workspace")
  const { user, isProUser, login, loginPending } = useAuth()
  const avatarUrl = useUserAvatarUrl(user)
  const { balances, loading: walletLoading } = useMockWallet()
  const {
    deposits,
    withdrawals,
    loading: ledgerLoading,
  } = useMockLedger()
  const [depositOpen, setDepositOpen] = React.useState(false)
  const [withdrawOpen, setWithdrawOpen] = React.useState(false)
  const [selectedActivity, setSelectedActivity] =
    React.useState<DeskLedgerEntry | null>(null)
  const [activityFilter, setActivityFilter] =
    React.useState<ActivityFilter>("all")
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const depositRequested = searchParams.get("deposit") === "1"
  const [handledDepositRequest, setHandledDepositRequest] =
    React.useState(false)

  // Open deposit sheet from ?deposit=1 without setState-in-effect.
  if (depositRequested && !handledDepositRequest) {
    setHandledDepositRequest(true)
    setDepositOpen(true)
  } else if (!depositRequested && handledDepositRequest) {
    setHandledDepositRequest(false)
  }

  React.useEffect(() => {
    if (!depositRequested) return
    router.replace(pathname, { scroll: false })
  }, [depositRequested, pathname, router])

  const rawPlan = user ? displayPlanName(user.tier) : "Free"
  const planName =
    rawPlan === "Plus"
      ? tw("planPlus")
      : rawPlan === "Ultimate"
        ? tw("planUltimate")
        : tw("planFree")

  const ledgerRows = React.useMemo(() => {
    const merged = [...deposits, ...withdrawals].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
    // Keep only the newest open invoice per currency+network — staging
    // returns every create attempt with amount 0 as "observed".
    const seenOpen = new Set<string>()
    return merged.filter((row) => {
      if (!isAwaitingTransfer(row)) return true
      const key = `${row.currency}:${row.network ?? "any"}`
      if (seenOpen.has(key)) return false
      seenOpen.add(key)
      return true
    })
  }, [deposits, withdrawals])

  const activity = React.useMemo(() => {
    if (activityFilter === "deposit") {
      return ledgerRows.filter((row) => row.kind === "deposit")
    }
    if (activityFilter === "withdrawal") {
      return ledgerRows.filter((row) => row.kind === "withdrawal")
    }
    return ledgerRows
  }, [activityFilter, ledgerRows])

  const filters: { id: ActivityFilter; label: string; count: number }[] = [
    {
      id: "all",
      label: t("activityAll"),
      count: ledgerRows.length,
    },
    {
      id: "deposit",
      label: t("deposits"),
      count: ledgerRows.filter((row) => row.kind === "deposit").length,
    },
    {
      id: "withdrawal",
      label: t("withdrawals"),
      count: ledgerRows.filter((row) => row.kind === "withdrawal").length,
    },
  ]

  if (walletLoading || ledgerLoading) {
    return <ProfileSkeleton />
  }

  return (
    <>
      <DeskPageFrame pageId="profile" title={t("title")}>
        <WalletBankCard
          balances={balances}
          loading={false}
          user={user}
          avatarUrl={avatarUrl ?? null}
          isProUser={isProUser}
          planName={planName}
          displayName={user ? userAccountLabel(user) : tw("guest")}
          displaySubline={
            user
              ? (userAccountSubline(user) ?? user.email ?? "")
              : t("guestHint")
          }
          loginPending={loginPending}
          onLogin={() => login({ source: "chat" })}
          onDeposit={() => setDepositOpen(true)}
          onWithdraw={() => setWithdrawOpen(true)}
        />

        <section className="flex flex-col gap-3.5 sm:gap-4">
          <div
            role="tablist"
            aria-label={t("activity")}
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
            {filters.map((filter) => {
              const active = activityFilter === filter.id
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`${filter.label} ${filter.count}`}
                  className={cn(
                    "relative z-10 inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[1.1rem] px-2.5 text-[13px] leading-none transition-[background-color,color,box-shadow,border-color] duration-200 sm:px-3",
                    active
                      ? cn(
                          "isolate overflow-hidden border border-white font-semibold text-foreground",
                          "bg-white dark:bg-white/22",
                          "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_6px_16px_-8px_rgba(15,23,42,0.14),inset_0_1px_1px_rgba(255,255,255,1),inset_0_0_0_0.5px_rgba(255,255,255,0.8),inset_0_-6px_12px_-8px_rgba(15,23,42,0.05)]",
                          "dark:border-white/28",
                          "dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_6px_16px_-8px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.32),inset_0_0_0_0.5px_rgba(255,255,255,0.16),inset_0_-8px_14px_-8px_rgba(0,0,0,0.35)]"
                        )
                      : landingNavLinkInactive
                  )}
                  onClick={() => setActivityFilter(filter.id)}
                >
                  <span className="truncate">{filter.label}</span>
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums leading-none",
                      active
                        ? "bg-[#2563EB]/14 text-[#1D4ED8] dark:bg-[#2563EB]/28 dark:text-[#93C5FD]"
                        : "bg-black/[0.06] text-muted-foreground dark:bg-white/12"
                    )}
                  >
                    {filter.count}
                  </span>
                </button>
              )
            })}
          </div>

          {activity.length === 0 ? (
            <DeskEmptyState
              icon={
                activityFilter === "deposit"
                  ? ArrowDownToLineIcon
                  : activityFilter === "withdrawal"
                    ? ArrowUpFromLineIcon
                    : ReceiptTextIcon
              }
              title={
                activityFilter === "deposit"
                  ? t("ledgerEmptyDepositsTitle")
                  : activityFilter === "withdrawal"
                    ? t("ledgerEmptyWithdrawalsTitle")
                    : t("ledgerEmptyTitle")
              }
              description={
                activityFilter === "deposit"
                  ? t("ledgerEmptyDeposits")
                  : activityFilter === "withdrawal"
                    ? t("ledgerEmptyWithdrawals")
                    : t("ledgerEmpty")
              }
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {activity.map((row) => (
                <ActivityCard
                  key={row.id}
                  row={row}
                  onOpen={setSelectedActivity}
                />
              ))}
            </ul>
          )}
        </section>
      </DeskPageFrame>

      <WalletDepositSheet open={depositOpen} onOpenChange={setDepositOpen} />
      <WalletWithdrawSheet
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        availableUsd={balances.availableUsd}
      />
      <WalletActivityDetailSheet
        entry={selectedActivity}
        open={selectedActivity != null}
        onOpenChange={(open) => {
          if (!open) setSelectedActivity(null)
        }}
        statusLabel={
          selectedActivity ? statusLabel(selectedActivity, t) : ""
        }
      />
    </>
  )
}

export { ProfileView }
