"use client"

import * as React from "react"
import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  Loader2Icon,
  ReceiptTextIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { DeskEmptyState } from "@/components/desk/desk-empty-state"
import {
  DeskGlassCard,
  DeskPageFrame,
} from "@/components/desk/desk-page-frame"
import { ProfileSkeleton } from "@/components/desk/desk-skeletons"
import { WalletBankCard } from "@/components/desk/wallet-bank-card"
import { WalletDepositSheet } from "@/components/desk/wallet-deposit-sheet"
import { WalletWithdrawSheet } from "@/components/desk/wallet-withdraw-sheet"
import { useAuth } from "@/components/auth/auth-provider"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { displayPlanName } from "@/lib/billing/catalog"
import { formatUsd } from "@/lib/desk-mock/format"
import { useMockLedger, useMockWallet } from "@/lib/desk-mock/hooks"
import type { DeskLedgerEntry } from "@/lib/desk-mock/types"
import {
  landingGlassSheen,
  landingNavLinkInactive,
} from "@/lib/landing-modern-styles"
import { userAccountLabel, userAccountSubline } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

type ActivityFilter = "all" | "deposit" | "withdrawal"

function statusLabel(
  status: DeskLedgerEntry["status"],
  t: ReturnType<typeof useTranslations<"deskProfile">>
): string {
  switch (status) {
    case "pending":
      return t("statusPending")
    case "confirming":
      return t("statusConfirming")
    case "credited":
      return t("statusCredited")
    case "settled":
      return t("statusSettled")
    case "failed":
      return t("statusFailed")
    case "cancelled":
      return t("statusCancelled")
    default:
      return status
  }
}

function statusToneClass(status: DeskLedgerEntry["status"]): string {
  switch (status) {
    case "credited":
    case "settled":
      return "bg-emerald-500/18 text-emerald-700 dark:bg-emerald-500/22 dark:text-emerald-300"
    case "confirming":
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

function ActivityRow({ row }: { row: DeskLedgerEntry }) {
  const t = useTranslations("deskProfile")
  const inbound = row.kind === "deposit"
  const Icon = inbound ? ArrowDownToLineIcon : ArrowUpFromLineIcon

  return (
    <li className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
      <span
        className={cn(
          activityLiquidGlassClass,
          "flex size-9 shrink-0 items-center justify-center bg-white/55 text-foreground/70 dark:bg-white/12 dark:text-foreground/75"
        )}
        aria-hidden
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
        <Icon className="relative z-10 size-4 stroke-[1.75]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium tracking-tight tabular-nums">
          {formatUsd(row.amountUsd)}
          <span className="ms-1.5 text-[12px] font-medium text-muted-foreground">
            {row.currency}
          </span>
        </p>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
          {inbound ? t("deposit") : t("withdraw")}
          {" · "}
          {new Date(row.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {row.reference ? ` · ${row.reference}` : null}
        </p>
      </div>
      <ActivityGlassChip className={statusToneClass(row.status)}>
        <span className="inline-flex items-center gap-1">
          {row.status === "confirming" ? (
            <Loader2Icon
              className="size-3 shrink-0 animate-spin"
              aria-hidden
            />
          ) : null}
          {statusLabel(row.status, t)}
        </span>
      </ActivityGlassChip>
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
  const [activityFilter, setActivityFilter] =
    React.useState<ActivityFilter>("all")

  const rawPlan = user ? displayPlanName(user.tier) : "Free"
  const planName =
    rawPlan === "Plus"
      ? tw("planPlus")
      : rawPlan === "Ultimate"
        ? tw("planUltimate")
        : tw("planFree")

  const activity = React.useMemo(() => {
    const merged = [...deposits, ...withdrawals].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
    if (activityFilter === "deposit") {
      return merged.filter((row) => row.kind === "deposit")
    }
    if (activityFilter === "withdrawal") {
      return merged.filter((row) => row.kind === "withdrawal")
    }
    return merged
  }, [activityFilter, deposits, withdrawals])

  const filters: { id: ActivityFilter; label: string }[] = [
    { id: "all", label: t("activityAll") },
    { id: "deposit", label: t("deposits") },
    { id: "withdrawal", label: t("withdrawals") },
  ]

  if (walletLoading || ledgerLoading) {
    return <ProfileSkeleton />
  }

  return (
    <>
      <DeskPageFrame title={t("title")}>
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
                  className={cn(
                    "relative z-10 inline-flex h-11 flex-1 items-center justify-center rounded-[1.1rem] px-3 text-[13px] leading-none transition-[background-color,color,box-shadow,border-color] duration-200",
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
                  {filter.label}
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
            <DeskGlassCard className="divide-y divide-border/35 p-0 sm:p-0 dark:divide-white/8">
              <ul className="relative z-10">
                {activity.map((row) => (
                  <ActivityRow key={row.id} row={row} />
                ))}
              </ul>
            </DeskGlassCard>
          )}
        </section>
      </DeskPageFrame>

      <WalletDepositSheet open={depositOpen} onOpenChange={setDepositOpen} />
      <WalletWithdrawSheet
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        availableUsd={balances.availableUsd}
      />
    </>
  )
}

export { ProfileView }
