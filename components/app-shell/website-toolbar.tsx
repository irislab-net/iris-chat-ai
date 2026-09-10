"use client"

import * as React from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  BitcoinIcon,
  CheckIcon,
  ChevronDownIcon,
  EclipseIcon,
  GemIcon,
  LogOutIcon,
  MenuIcon,
  NewspaperIcon,
  OrbitIcon,
  SparklesIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { LocaleSwitcher } from "@/components/i18n/locale-switcher"
import { Link, usePathname } from "@/i18n/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { displayPlanName } from "@/lib/billing/catalog"
import { APP_NEWS_PATH, UPGRADE_PATH } from "@/lib/site"
import {
  requestDeskSymbolChange,
  subscribeDeskSymbolSync,
} from "@/lib/paper-trading/desk-symbol"
import { cn } from "@/lib/utils"
import {
  userAccountLabel,
  userAccountSubline,
  userAvatarFallback,
} from "@/lib/user-profile"
import type { User } from "@/lib/api/types"

function AccountAvatar({
  user,
  avatarUrl,
  isProUser,
  planName,
  className,
  compact = false,
}: {
  user: User
  avatarUrl: string | null
  isProUser: boolean
  planName: ReturnType<typeof displayPlanName>
  className?: string
  compact?: boolean
}) {
  return (
    <span className={cn("relative shrink-0", className)}>
      <Avatar
        className={cn(
          "size-7 after:border-0",
          isProUser &&
            !compact &&
            "ring-2 ring-foreground/15 ring-offset-1 ring-offset-background"
        )}
      >
        {avatarUrl ? (
          <AvatarImage
            src={avatarUrl}
            alt={userAccountLabel(user)}
          />
        ) : null}
        <AvatarFallback className="text-[11px] font-medium">
          {userAvatarFallback(user)}
        </AvatarFallback>
      </Avatar>
      {isProUser ? (
        <Badge
          className="absolute bottom-0 left-1/2 z-10 h-3 min-w-0 -translate-x-1/2 translate-y-1/2 rounded-full border border-background px-1 text-[7px] font-bold leading-none tracking-wide bg-foreground text-background shadow-sm"
          aria-hidden
        >
          {planName}
        </Badge>
      ) : null}
    </span>
  )
}

function AccountPlanBadge({
  planName,
  isProUser,
}: {
  planName: ReturnType<typeof displayPlanName>
  isProUser: boolean
}) {
  return (
    <Badge
      variant={isProUser ? "default" : "secondary"}
      className={cn(
        "h-5 px-1.5 text-[10px] font-semibold tracking-wide",
        isProUser && "border-0 bg-foreground text-background"
      )}
    >
      {isProUser ? <SparklesIcon className="size-2.5" aria-hidden /> : null}
      {planName}
    </Badge>
  )
}

type MarketId = "eth" | "btc" | "xau"

function EthereumGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("fill-current", className)}
    >
      <path d="M12 1.75 4.75 12.1l7.25 4.15 7.25-4.15L12 1.75Z" opacity="0.85" />
      <path d="M12 16.85 4.75 12.7 12 22.25l7.25-9.55L12 16.85Z" />
    </svg>
  )
}

const MARKETS: {
  id: MarketId
  labelKey: "ethereum" | "bitcoin" | "gold"
  symbol: string
  available: boolean
  Icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    id: "eth",
    labelKey: "ethereum",
    symbol: "ETH",
    available: true,
    Icon: EthereumGlyph,
  },
  {
    id: "btc",
    labelKey: "bitcoin",
    symbol: "BTC",
    available: true,
    Icon: BitcoinIcon,
  },
  {
    id: "xau",
    labelKey: "gold",
    symbol: "XAU",
    available: true,
    Icon: GemIcon,
  },
]

type WebsiteToolbarProps = {
  onStartTour?: () => void
  onWorkspaceTabNavigate?: () => void
  className?: string
}

function MarketSwitcher() {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const [market, setMarket] = React.useState<MarketId>("eth")
  const selected = MARKETS.find((item) => item.id === market) ?? MARKETS[0]
  const SelectedIcon = selected.Icon
  const selectedLabel = t(selected.labelKey)

  React.useEffect(() => {
    return subscribeDeskSymbolSync((symbol) => {
      const next =
        MARKETS.find((item) => item.symbol === symbol)?.id ?? "eth"
      setMarket(next)
    })
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${t("market")}: ${selectedLabel}`}
            className="h-8 gap-1.5 px-2"
          />
        }
      >
        <SelectedIcon className="size-3.5" />
        <span className="font-mono text-[13px] font-semibold tracking-tight">
          {selected.symbol}
        </span>
        <ChevronDownIcon className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-auto min-w-60 gap-0 rounded-xl p-2 shadow-lg ring-0"
      >
        <DropdownMenuGroup className="flex flex-col gap-1">
          <DropdownMenuLabel className="px-2.5 pb-1.5 text-xs">
            {t("market")}
          </DropdownMenuLabel>
          {MARKETS.map((item) => {
            const Icon = item.Icon
            return (
              <DropdownMenuItem
                key={item.id}
                disabled={!item.available}
                className="min-h-11 justify-between gap-3 rounded-lg px-2.5 py-2.5 text-base"
                onClick={() => {
                  if (!item.available) return
                  setMarket(item.id)
                  requestDeskSymbolChange(item.symbol)
                }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-mono text-sm font-semibold leading-none">
                      {item.symbol}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {t(item.labelKey)}
                    </span>
                  </span>
                </span>
                {item.available ? (
                  item.id === market ? (
                    <CheckIcon className="size-4 shrink-0 text-foreground" />
                  ) : null
                ) : (
                  <Badge
                    variant="secondary"
                    className="h-5 shrink-0 px-1.5 text-[10px] font-medium tracking-wide"
                  >
                    {common("comingSoon")}
                  </Badge>
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function WorkspaceNavLabel() {
  const t = useTranslations("workspace")
  const pathname = usePathname()
  if (pathname !== "/app") return null

  return (
    <div
      data-tour="nav-news"
      className="hidden items-center gap-1.5 text-[13px] font-semibold text-foreground lg:flex"
    >
      <NewspaperIcon className="size-3.5 shrink-0" aria-hidden />
      {t("news")}
    </div>
  )
}

function WebsiteToolbar({
  onStartTour,
  onWorkspaceTabNavigate,
  className,
}: WebsiteToolbarProps) {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const {
    user,
    loading,
    login,
    logout,
    isProUser,
    loginPending,
  } = useAuth()
  const showToolbarUtilitiesInHeader = !user
  const accountSubline = user ? userAccountSubline(user) : null
  const accountPlanName = user ? displayPlanName(user.tier) : "Free"
  const accountAvatarUrl = useUserAvatarUrl(user)

  const navIconClass =
    "size-8 text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-pressed:bg-muted aria-pressed:text-foreground [&_svg:not([class*='size-'])]:size-4"

  return (
    <header
      data-slot="website-toolbar"
      data-tour="toolbar"
        className={cn(
          "flex min-h-[var(--mobile-toolbar-height,3rem)] shrink-0 items-center gap-1.5 bg-background px-3 pt-[var(--app-safe-top,0px)] sm:gap-2 sm:px-4 sm:pt-0",
          className
        )}
    >
      <div className="flex h-full min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        <Link
          href={APP_NEWS_PATH}
          aria-label="IRIS Chat AI news"
          className={cn(
            "shrink-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            pathname === "/app" && "lg:hidden"
          )}
        >
          <Image
            src="/Logo.png"
            alt="IRIS Chat AI"
            width={32}
            height={32}
            className="block size-8 rounded-md"
            priority
          />
        </Link>
        <MarketSwitcher />
        <div className="hidden h-4 w-px bg-border/70 lg:block" aria-hidden />
        <React.Suspense fallback={null}>
          <WorkspaceNavLabel />
        </React.Suspense>
        <nav
          className={cn(
            "h-full items-center gap-0.5",
            showToolbarUtilitiesInHeader ? "hidden lg:flex" : "hidden"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(navIconClass, "hidden lg:inline-flex")}
            aria-label="Start product tour"
            onPointerEnter={() => {
              void import("@/components/app-shell/product-tour")
            }}
            onClick={() => onStartTour?.()}
          >
            <OrbitIcon />
          </Button>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(navIconClass, "rounded-xl")}
            aria-label={common("toggleTheme")}
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            <EclipseIcon />
          </Button>
          <LocaleSwitcher variant="icon" buttonClassName={cn(navIconClass, "rounded-xl")} />
        </div>
        {loading ? null : user ? (
          <div data-tour="account">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Account menu for ${userAccountLabel(user)} · ${accountPlanName} plan`}
                  className={cn(
                    "h-8 max-w-44 gap-1.5 rounded-full border-border/55 bg-muted/55 px-1 pr-2.5 shadow-none",
                    "hover:border-border/70 hover:bg-muted/75 hover:text-foreground",
                    "aria-expanded:border-border/70 aria-expanded:bg-muted/75 aria-expanded:text-foreground",
                    isProUser && "border-foreground/10 bg-muted/60"
                  )}
                />
              }
            >
              <AccountAvatar
                user={user}
                avatarUrl={accountAvatarUrl}
                isProUser={isProUser}
                planName={accountPlanName}
                compact
              />
              <span className="hidden min-w-0 flex-1 flex-col items-start gap-0.5 leading-none sm:flex">
                <span className="w-full truncate text-[13px] font-medium tracking-tight text-foreground">
                  {userAccountLabel(user)}
                </span>
                {!isProUser ? (
                  <span className="text-[10px] font-medium text-primary">
                    {t("upgrade")}
                  </span>
                ) : null}
              </span>
              <ChevronDownIcon
                className="size-3 shrink-0 text-muted-foreground/80"
                aria-hidden
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-60 shadow-md"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AccountAvatar
                        user={user}
                        avatarUrl={accountAvatarUrl}
                        isProUser={isProUser}
                        planName={accountPlanName}
                      />
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <span className="truncate text-sm font-medium text-foreground">
                          {userAccountLabel(user)}
                        </span>
                        {accountSubline ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {accountSubline}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <AccountPlanBadge
                      planName={accountPlanName}
                      isProUser={isProUser}
                    />
                  </div>
                </DropdownMenuLabel>
                {!isProUser ? (
                  <div className="px-2 pb-1">
                    <Button
                      size="xs"
                      className="h-7 w-full"
                      nativeButton={false}
                      render={<Link href={UPGRADE_PATH} />}
                    >
                      {t("upgradeToPlus")}
                    </Button>
                  </div>
                ) : null}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="min-h-9 gap-2"
                  onClick={() => {
                    void import("@/components/app-shell/product-tour")
                    onStartTour?.()
                  }}
                >
                  <OrbitIcon />
                  Product tour
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="min-h-9 gap-2"
                  onClick={() =>
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                >
                  <EclipseIcon />
                  {resolvedTheme === "dark" ? common("lightMode") : common("darkMode")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void logout()}
              >
                <LogOutIcon />
                {t("logOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="default"
            className="h-8 gap-2 px-2.5 sm:px-3"
            data-tour="account"
            aria-label="Continue with Google"
            disabled={loginPending}
            onClick={() => login()}
          >
            <GoogleGlyph className="size-3.5" />
            {loginPending ? (
              <span>{t("connecting")}</span>
            ) : (
              <>
                <span className="sm:hidden">Continue</span>
                <span className="hidden sm:inline">Continue with Google</span>
              </>
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className={cn(navIconClass, "lg:hidden")}
              />
            }
          >
            <MenuIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-52 rounded-xl p-2 shadow-lg ring-0"
          >
            <DropdownMenuGroup className="flex flex-col gap-1">
              <DropdownMenuItem
                className="min-h-10 gap-3 rounded-lg px-2.5 py-2"
                onClick={() => onStartTour?.()}
              >
                <OrbitIcon />
                Product tour
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { WebsiteToolbar }
