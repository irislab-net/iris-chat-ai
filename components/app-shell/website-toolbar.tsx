"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  EclipseIcon,
  LogOutIcon,
  NewspaperIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { Link, usePathname } from "@/i18n/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { ExurLogo } from "@/components/brand/exur-logo"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSeparatorClass,
} from "@/components/app-shell/chat-context-menu-styles"
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
import { APP_NEWS_PATH, isAppDeskPath, UPGRADE_PATH } from "@/lib/site"
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

type WebsiteToolbarProps = {
  onWorkspaceTabNavigate?: () => void
  /** Mobile news view — close and return to full-screen chat. */
  onCloseToChat?: () => void
  className?: string
}

function WorkspaceNavLabel() {
  const t = useTranslations("workspace")
  const pathname = usePathname()
  if (!isAppDeskPath(pathname)) return null

  return (
    <div className="hidden items-center gap-1.5 text-[13px] font-semibold text-foreground lg:flex">
      <NewspaperIcon className="size-3.5 shrink-0" aria-hidden />
      {t("news")}
    </div>
  )
}

function WebsiteToolbar({
  onWorkspaceTabNavigate: _onWorkspaceTabNavigate,
  onCloseToChat,
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
  const accountSubline = user ? userAccountSubline(user) : null
  const accountPlanName = user ? displayPlanName(user.tier) : "Free"
  const accountAvatarUrl = useUserAvatarUrl(user)

  return (
    <header
      data-slot="website-toolbar"
      className={cn(
        "app-mobile-safe-header flex min-h-[var(--mobile-toolbar-height,3rem)] shrink-0 items-center gap-1.5 bg-background px-3 sm:min-h-12 sm:gap-2 sm:px-4 sm:pt-0",
        className
      )}
    >
      <div className="flex h-full min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        {onCloseToChat ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label={t("backToChat")}
            onClick={onCloseToChat}
          >
            <XIcon className="size-4.5" />
          </Button>
        ) : null}
        <Link
          href={APP_NEWS_PATH}
          aria-label="Exur news"
          className={cn(
            "shrink-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isAppDeskPath(pathname) && "lg:hidden",
            onCloseToChat && "hidden lg:block"
          )}
        >
          <ExurLogo
            alt="Exur"
            size={32}
            className="size-8 rounded-full"
            priority
          />
        </Link>
        <React.Suspense fallback={null}>
          <WorkspaceNavLabel />
        </React.Suspense>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {loading ? null : user ? (
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
              sideOffset={10}
              className={cn(chatContextMenuContentClass, "min-w-60")}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className={chatContextMenuHeaderClass}>
                  <div className="flex items-center gap-3">
                    <AccountAvatar
                      user={user}
                      avatarUrl={accountAvatarUrl}
                      isProUser={isProUser}
                      planName={accountPlanName}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight tracking-[-0.01em]">
                        {userAccountLabel(user)}
                      </p>
                      {accountSubline ? (
                        <p className="truncate text-xs leading-snug text-muted-foreground">
                          {accountSubline}
                        </p>
                      ) : null}
                    </div>
                    <AccountPlanBadge
                      planName={accountPlanName}
                      isProUser={isProUser}
                    />
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              {!isProUser ? (
                <>
                  <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
                  <DropdownMenuItem
                    className={chatContextMenuItemClass}
                    nativeButton={false}
                    render={<Link href={UPGRADE_PATH} />}
                  >
                    <SparklesIcon className={chatContextMenuIconClass} />
                    {t("upgradeToPlus")}
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
              <DropdownMenuItem
                className={chatContextMenuItemClass}
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                <EclipseIcon className={chatContextMenuIconClass} />
                {resolvedTheme === "dark" ? common("lightMode") : common("darkMode")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
              <DropdownMenuItem
                variant="destructive"
                className={chatContextMenuDeleteClass}
                onClick={() => void logout()}
              >
                <LogOutIcon className={chatContextMenuIconClass} />
                {t("logOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="default"
            className="h-8 gap-2 px-2.5 sm:px-3"
            aria-label={t("continueWithGoogle")}
            disabled={loginPending}
            onClick={() => login()}
          >
            <GoogleGlyph className="size-3.5" />
            {loginPending ? (
              <span>{t("connecting")}</span>
            ) : (
              <>
                <span className="sm:hidden">{t("continueWithGoogleShort")}</span>
                <span className="hidden sm:inline">{t("continueWithGoogle")}</span>
              </>
            )}
          </Button>
        )}
      </div>
    </header>
  )
}

export { WebsiteToolbar }
