"use client"

import * as React from "react"
import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  ChatAccountAvatar,
  ChatGuestAvatar,
} from "@/components/app-shell/chat-account-avatar"
import {
  chatAccentSecondaryFillClass,
  chatMobilePrimaryButtonClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import type { User } from "@/lib/api/types"
import { formatUsd, pnlToneClass } from "@/lib/desk-mock/format"
import type { DeskWalletBalances } from "@/lib/desk-mock/types"
import {
  landingGlassSheen,
  landingTitleCardLg,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

/**
 * Liquid glass shell — white rim + dual inset specular + soft outer lift
 * (same family as landing / iOS frost plates).
 */
const walletCardShellClass = [
  "relative isolate overflow-hidden",
  "border border-white/70 dark:border-white/18",
  "bg-[linear-gradient(155deg,oklch(0.99_0.002_264)_0%,oklch(0.965_0.004_264)_48%,oklch(0.94_0.006_264)_100%)]",
  "supports-[backdrop-filter]:bg-[linear-gradient(155deg,oklch(0.99_0.002_264_/_0.72)_0%,oklch(0.965_0.004_264_/_0.58)_48%,oklch(0.94_0.006_264_/_0.52)_100%)]",
  "backdrop-blur-[40px] backdrop-saturate-[180%]",
  // Outer lift + hairline white rim + top specular + bottom depth
  "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_36px_-10px_rgba(15,23,42,0.14),0_28px_72px_-18px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.95),inset_0_0_0_0.5px_rgba(255,255,255,0.55),inset_0_-10px_22px_-14px_rgba(15,23,42,0.08)]",
  "dark:bg-[linear-gradient(155deg,oklch(0.22_0.008_264)_0%,oklch(0.18_0.006_264)_50%,oklch(0.15_0.004_264)_100%)]",
  "dark:supports-[backdrop-filter]:bg-[linear-gradient(155deg,oklch(0.22_0.008_264_/_0.72)_0%,oklch(0.18_0.006_264_/_0.58)_50%,oklch(0.15_0.004_264_/_0.5)_100%)]",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_12px_36px_-10px_rgba(0,0,0,0.45),0_28px_72px_-18px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_0_0_0.5px_rgba(255,255,255,0.12),inset_0_-12px_24px_-14px_rgba(0,0,0,0.45)]",
].join(" ")

/** EMV chip path from exchange-admin TreasuryHero. */
const CHIP_PATH =
  "M123.517 0.00683594C134.324 0.280846 143 9.12703 143 20V88L142.993 88.5166C142.719 99.3235 133.873 108 123 108H20C8.95431 108 0 99.0457 0 88V20C5.0738e-07 9.12703 8.67646 0.280845 19.4834 0.00683594L20 0H123L123.517 0.00683594ZM1 88C1 98.4934 9.50659 107 20 107H38.5V83.5H1V88ZM39.5 107H123C133.493 107 142 98.4934 142 88V87.5H70V87.4395C61.8368 86.9729 54.4548 83.6729 48.8926 78.5312C48.5046 78.1726 48.1258 77.8049 47.7559 77.4287C46.4613 76.1123 45.2796 74.6904 44.2256 73.1777C43.9243 72.7453 43.6336 72.3053 43.3535 71.8584C42.5137 70.5183 41.7709 69.1146 41.1348 67.6562C40.9228 67.1703 40.7221 66.6784 40.5342 66.1807C40.3462 65.6828 40.1711 65.1789 40.0078 64.6699C39.8445 64.1608 39.6935 63.6465 39.5557 63.127C39.5365 63.0546 39.5187 62.9818 39.5 62.9092V107ZM72 23.5C64.7024 23.5 57.9703 25.8297 52.5488 29.7617C52.1318 30.0642 51.7225 30.3762 51.3213 30.6973C50.9198 31.0186 50.5265 31.3492 50.1416 31.6885C49.3723 32.3666 48.6367 33.0801 47.9375 33.8262C44.4417 37.5565 41.8572 42.1025 40.5225 47.1328C40.2555 48.1388 40.0382 49.164 39.874 50.2061C39.6276 51.7694 39.5 53.3703 39.5 55C39.5 56.6297 39.6276 58.2306 39.874 59.7939C40.0382 60.836 40.2555 61.8612 40.5225 62.8672C41.8572 67.8975 44.4417 72.4435 47.9375 76.1738C48.6367 76.9199 49.3723 77.6334 50.1416 78.3115C50.5265 78.6508 50.9198 78.9814 51.3213 79.3027C51.7225 79.6238 52.1318 79.9358 52.5488 80.2383C57.9703 84.1703 64.7024 86.5 72 86.5C77.6138 86.5 82.8928 85.1215 87.498 82.6953C87.9586 82.4527 88.4126 82.1998 88.8594 81.9365C89.7525 81.4102 90.6173 80.8431 91.4512 80.2383C91.8682 79.9358 92.2775 79.6238 92.6787 79.3027C93.0802 78.9814 93.4735 78.6508 93.8584 78.3115C94.6277 77.6334 95.3633 76.9199 96.0625 76.1738C99.5583 72.4435 102.143 67.8975 103.478 62.8672C103.744 61.8612 103.962 60.836 104.126 59.7939C104.372 58.2306 104.5 56.6297 104.5 55C104.5 53.3703 104.372 51.7694 104.126 50.2061C103.962 49.164 103.744 48.1388 103.478 47.1328C102.143 42.1025 99.5583 37.5565 96.0625 33.8262C95.3633 33.0801 94.6277 32.3666 93.8584 31.6885C93.4735 31.3492 93.0802 31.0186 92.6787 30.6973C92.2775 30.3762 91.8682 30.0642 91.4512 29.7617C90.6173 29.1569 89.7525 28.5898 88.8594 28.0635C88.4126 27.8002 87.9586 27.5473 87.498 27.3047C82.8928 24.8785 77.6138 23.5 72 23.5ZM103.992 64.6699C103.829 65.1789 103.654 65.6828 103.466 66.1807C103.278 66.6784 103.077 67.1703 102.865 67.6562C102.229 69.1146 101.486 70.5183 100.646 71.8584C100.366 72.3053 100.076 72.7453 99.7744 73.1777C98.7204 74.6904 97.5387 76.1123 96.2441 77.4287C95.8743 77.8049 95.4954 78.1726 95.1074 78.5312C91.0107 82.3182 85.9265 85.1064 80.2705 86.5H142V64.5H104.044C104.026 64.5565 104.01 64.6136 103.992 64.6699ZM1 82.5H38.5V54.5H1V82.5ZM105.5 22.5V55.5H105.496C105.455 58.1303 105.092 60.6844 104.444 63.127C104.411 63.2519 104.374 63.3757 104.34 63.5H142V22.5H105.5ZM1 53.5H38.5352C38.6418 51.2217 38.9901 49.0049 39.5557 46.873C39.6935 46.3535 39.8445 45.8392 40.0078 45.3301C40.1711 44.8211 40.3462 44.3172 40.5342 43.8193C40.7221 43.3216 40.9228 42.8297 41.1348 42.3438C41.7709 40.8854 42.5137 39.4817 43.3535 38.1416C43.6336 37.6947 43.9243 37.2547 44.2256 36.8223C45.2796 35.3096 46.4613 33.8877 47.7559 32.5713C48.1258 32.1951 48.5046 31.8274 48.8926 31.4688C52.9893 27.6818 58.0735 24.8936 63.7295 23.5H1V53.5ZM20 1C9.50659 1 1 9.50659 1 20V22.5H73V22.5156C81.5597 22.7592 89.3189 26.1179 95.1074 31.4688C95.4954 31.8274 95.8743 32.1951 96.2441 32.5713C97.5387 33.8877 98.7204 35.3096 99.7744 36.8223C100.076 37.2547 100.366 37.6947 100.646 38.1416C101.486 39.4817 102.229 40.8854 102.865 42.3438C103.077 42.8297 103.278 43.3216 103.466 43.8193C103.654 44.3172 103.829 44.8211 103.992 45.3301C104.155 45.8392 104.307 46.3535 104.444 46.873C104.463 46.9451 104.481 47.0176 104.5 47.0898V1H20ZM105.5 21.5H142V20C142 9.50659 133.493 1 123 1H105.5V21.5Z"

function StatCell({
  label,
  value,
  amountClass,
  valueClassName,
  align = "start",
  loading,
}: {
  label: string
  value: string
  amountClass: string
  valueClassName?: string
  align?: "start" | "end"
  loading?: boolean
}) {
  return (
    <div className={cn("min-w-0", align === "end" && "text-end")}>
      <p className="truncate text-[9px] font-normal tracking-[0.1em] text-muted-foreground/55 uppercase @[18rem]/desk-wallet:text-[10px] @[18rem]/desk-wallet:tracking-[0.12em]">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-[11px] font-medium @[18rem]/desk-wallet:text-xs",
          amountClass,
          !loading && valueClassName
        )}
        aria-busy={loading || undefined}
      >
        {value}
      </p>
    </div>
  )
}

function WalletBankCard({
  balances,
  loading = false,
  user,
  avatarUrl,
  isProUser,
  planName,
  displayName,
  displaySubline,
  loginPending,
  onLogin,
  onDeposit,
  onWithdraw,
  className,
}: {
  balances: DeskWalletBalances
  loading?: boolean
  user: User | null
  avatarUrl: string | null
  isProUser: boolean
  planName: string
  displayName: string
  displaySubline: string
  loginPending?: boolean
  onLogin?: () => void
  onDeposit: () => void
  onWithdraw: () => void
  className?: string
}) {
  const t = useTranslations("deskProfile")
  const chipBaseId = React.useId().replace(/:/g, "")
  const chipGradientId = `desk-wallet-chip-${chipBaseId}`
  const chipShineId = `desk-wallet-chip-shine-${chipBaseId}`
  const chipClipId = `desk-wallet-chip-clip-${chipBaseId}`
  const chipPathId = `desk-wallet-chip-path-${chipBaseId}`
  const [amountsVisible, setAmountsVisible] = React.useState(true)

  const amountClass = cn(
    "tabular-nums transition-[filter,opacity] duration-300",
    !amountsVisible && !loading && "select-none blur-[7px]",
    loading && "desk-wallet-amount-loading"
  )

  return (
    <section
      data-slot="desk-wallet-bank-card"
      className={cn(
        "@container/desk-wallet",
        walletCardShellClass,
        "flex w-full flex-col justify-between",
        "rounded-[1.75rem] p-4 pb-3.5 text-foreground",
        "@[18rem]/desk-wallet:rounded-[2.25rem] @[18rem]/desk-wallet:p-5 @[18rem]/desk-wallet:pb-4",
        className
      )}
    >
      {/* Soft grey atmosphere — no blue wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -end-16 size-56 rounded-full bg-black/[0.04] blur-3xl dark:bg-white/[0.06]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -start-20 size-64 rounded-full bg-black/[0.035] blur-3xl dark:bg-white/[0.04]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_22%,oklch(1_0_0_/_0.55)_48%,transparent_72%)] dark:bg-[linear-gradient(115deg,transparent_22%,oklch(1_0_0_/_0.06)_48%,transparent_72%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-multiply dark:opacity-[0.07] dark:mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
        }}
      />
      <span
        aria-hidden
        className={cn(landingGlassSheen, "rounded-[inherit]")}
      />

      <div className="relative z-10 flex items-start justify-between gap-2.5">
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-full p-[3px]",
              "border-[1.5px] border-white dark:border-white/35",
              "bg-white/50 backdrop-blur-[20px] dark:bg-white/10",
              "shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_20px_-6px_rgba(15,23,42,0.18),inset_0_1px_1px_rgba(255,255,255,1),inset_0_0_0_0.5px_rgba(255,255,255,0.7),inset_0_-6px_12px_-6px_rgba(15,23,42,0.08)]",
              "dark:shadow-[0_1px_2px_rgba(0,0,0,0.28),0_8px_20px_-6px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.28),inset_0_0_0_0.5px_rgba(255,255,255,0.14),inset_0_-8px_14px_-6px_rgba(0,0,0,0.4)]"
            )}
          >
            <span
              aria-hidden
              className={cn(landingGlassSheen, "rounded-full")}
            />
            {user ? (
              <ChatAccountAvatar
                user={user}
                avatarUrl={avatarUrl}
                isProUser={isProUser}
                planName={planName}
                showPlanBadge={false}
                avatarClassName="relative z-10 size-11 ring-0 ring-offset-0 after:border-0"
              />
            ) : (
              <ChatGuestAvatar
                showBadge={false}
                avatarClassName="relative z-10 size-11 bg-white/60 after:border-0 dark:bg-white/12"
                iconClassName="size-5 text-foreground/55"
              />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold tracking-tight text-foreground">
              {displayName}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium tracking-wide text-muted-foreground">
              {displaySubline}
            </span>
          </span>
        </span>
        {!user ? (
          <button
            type="button"
            disabled={loginPending}
            onClick={onLogin}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold",
              chatMobilePrimaryButtonClass
            )}
          >
            <GoogleGlyph className="size-3.5" />
            {loginPending ? t("signingUp") : t("signUp")}
          </button>
        ) : null}
      </div>

      <div className="relative z-10 mt-4 min-w-0 ps-1 pe-14 @[18rem]/desk-wallet:mt-4.5 @[18rem]/desk-wallet:ps-1.5 @[18rem]/desk-wallet:pe-16">
        <svg
          viewBox="0 0 143 108"
          className="absolute end-0 top-1/2 h-7 w-[2.3rem] -translate-y-1/2 drop-shadow-[0_0_8px_oklch(0.62_0.19_264/0.45)] @[18rem]/desk-wallet:h-8 @[18rem]/desk-wallet:w-[2.6rem]"
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={chipGradientId}
              x1="0"
              y1="0"
              x2="143"
              y2="108"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="oklch(0.42 0.16 264)" />
              <stop offset="22%" stopColor="oklch(0.58 0.19 264)" />
              <stop offset="40%" stopColor="oklch(0.78 0.12 250)" />
              <stop offset="58%" stopColor="oklch(0.55 0.2 264)" />
              <stop offset="78%" stopColor="oklch(0.72 0.14 255)" />
              <stop offset="100%" stopColor="oklch(0.38 0.14 266)" />
            </linearGradient>
            <linearGradient id={chipShineId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.92 0.05 250)" stopOpacity="0" />
              <stop offset="50%" stopColor="oklch(0.95 0.06 250)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="oklch(0.92 0.05 250)" stopOpacity="0" />
            </linearGradient>
            <clipPath id={chipClipId}>
              <use href={`#${chipPathId}`} />
            </clipPath>
          </defs>
          <path
            id={chipPathId}
            d={CHIP_PATH}
            fill={`url(#${chipGradientId})`}
          />
          <g clipPath={`url(#${chipClipId})`} className="pointer-events-none">
            <g className="motion-safe:animate-[desk-wallet-chip-shine_3s_ease-in-out_infinite]">
              <rect
                x="-56"
                y="-16"
                width="44"
                height="140"
                fill={`url(#${chipShineId})`}
                transform="rotate(16 0 54)"
              />
            </g>
          </g>
        </svg>

        <div className="flex min-w-0 items-center gap-1.5">
          <p className="min-w-0 truncate text-[9px] font-normal tracking-[0.1em] text-muted-foreground/55 uppercase @[18rem]/desk-wallet:text-[10px] @[18rem]/desk-wallet:tracking-[0.12em]">
            {t("available")}
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={() => setAmountsVisible((v) => !v)}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/55 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors hover:bg-white/80 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2563EB]/35 disabled:pointer-events-none disabled:opacity-40 dark:bg-white/10 dark:shadow-none dark:hover:bg-white/16"
            aria-label={
              amountsVisible ? t("hideAmounts") : t("showAmounts")
            }
            aria-pressed={amountsVisible}
          >
            {amountsVisible ? (
              <EyeIcon className="size-3.5" />
            ) : (
              <EyeOffIcon className="size-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span
            className={cn(
              landingTitleCardLg,
              "max-w-full truncate text-[1.35rem] leading-none tracking-[-0.03em] sm:text-[1.5rem]",
              amountClass
            )}
            aria-busy={loading || undefined}
          >
            {formatUsd(balances.availableUsd)}
          </span>
          <span
            className={cn(
              "shrink-0 text-[11px] font-semibold text-[#2563EB] dark:text-[#93C5FD]",
              loading && "opacity-40"
            )}
          >
            USD
          </span>
        </p>
      </div>

      <div className="relative z-10 mt-4 grid min-w-0 grid-cols-3 gap-2 px-1 @[18rem]/desk-wallet:mt-4.5 @[18rem]/desk-wallet:gap-3 @[18rem]/desk-wallet:px-1.5">
        <StatCell
          label={t("inPositions")}
          amountClass={amountClass}
          value={formatUsd(balances.lockedUsd)}
          loading={loading}
        />
        <StatCell
          label={t("todayPnl")}
          amountClass={amountClass}
          value={formatUsd(balances.todayPnlUsd, { signed: true })}
          loading={loading}
          valueClassName={
            amountsVisible
              ? pnlToneClass(balances.todayPnlUsd)
              : undefined
          }
        />
        <StatCell
          label={t("realized")}
          amountClass={amountClass}
          value={formatUsd(balances.realizedPnlUsd, { signed: true })}
          align="end"
          loading={loading}
          valueClassName={
            amountsVisible ? pnlToneClass(balances.realizedPnlUsd) : undefined
          }
        />
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2 @[18rem]/desk-wallet:mt-4.5">
        <button
          type="button"
          disabled={!user}
          onClick={onDeposit}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold disabled:pointer-events-none disabled:opacity-45",
            chatMobilePrimaryButtonClass
          )}
        >
          <ArrowDownToLineIcon className="size-4" />
          {t("deposit")}
        </button>
        <button
          type="button"
          disabled={!user}
          onClick={onWithdraw}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold disabled:pointer-events-none disabled:opacity-45",
            chatAccentSecondaryFillClass
          )}
        >
          <ArrowUpFromLineIcon className="size-4" />
          {t("withdraw")}
        </button>
      </div>
    </section>
  )
}

export { WalletBankCard }
