"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  EclipseIcon,
  LogOutIcon,
  NewspaperIcon,
  SparklesIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { ChatAccountAvatar } from "@/components/app-shell/chat-account-avatar"
import {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSeparatorClass,
} from "@/components/app-shell/chat-context-menu-styles"
import {
  chatMobileHeaderAvatarButtonClass,
  chatMobileHeaderAvatarClass,
  chatMobileHeaderPlanBadgeClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { UPGRADE_PATH } from "@/lib/site"
import {
  userAccountLabel,
  userAccountSubline,
} from "@/lib/user-profile"
import { cn } from "@/lib/utils"

type ChatAccountMenuProps = {
  onOpenNews?: () => void
  variant?: "mobile" | "desktop"
  className?: string
}

function ChatAccountMenu({
  onOpenNews,
  variant = "mobile",
  className,
}: ChatAccountMenuProps) {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const { user, isProUser, login, logout, loginPending } = useAuth()
  const avatarUrl = useUserAvatarUrl(user)
  const { resolvedTheme, setTheme } = useTheme()
  const planName = user ? displayPlanName(user.tier) : "Free"
  const isDesktop = variant === "desktop"

  if (!user) {
    return (
      <Button
        type="button"
        variant={isDesktop ? "outline" : "ghost"}
        size={isDesktop ? "sm" : "default"}
        className={cn(
          isDesktop
            ? "h-8 shrink-0 gap-2 px-2.5"
            : chatMobileHeaderAvatarButtonClass,
          className
        )}
        aria-label={t("signIn")}
        disabled={loginPending}
        onClick={() => login({ source: "chat" })}
      >
        {isDesktop ? (
          <>
            <GoogleGlyph className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {loginPending ? t("connecting") : t("signIn")}
            </span>
          </>
        ) : (
          <span className="relative inline-flex shrink-0">
            <Avatar className={chatMobileHeaderAvatarClass}>
              <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
                <GoogleGlyph className="size-3.5" />
              </AvatarFallback>
            </Avatar>
            <Badge
              className={cn(
                "absolute bottom-0 left-1/2 z-10 min-w-0 -translate-x-1/2 rounded-full border border-border/50 bg-background text-muted-foreground",
                chatMobileHeaderPlanBadgeClass
              )}
              aria-hidden
            >
              Free
            </Badge>
          </span>
        )}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className={cn(
              isDesktop
                ? "h-8 shrink-0 gap-2 px-1.5 hover:bg-muted/50"
                : chatMobileHeaderAvatarButtonClass,
              className
            )}
            aria-label={`Account menu for ${userAccountLabel(user)}`}
          />
        }
      >
        <ChatAccountAvatar
          user={user}
          avatarUrl={avatarUrl}
          isProUser={isProUser}
          planName={planName}
          compact
          showPlanBadge={!isDesktop}
          planBadgeClassName={chatMobileHeaderPlanBadgeClass}
          avatarClassName={
            isDesktop ? "size-7" : chatMobileHeaderAvatarClass
          }
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(chatContextMenuContentClass, "min-w-68")}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className={chatContextMenuHeaderClass}>
            <div className="flex items-center gap-3">
              <ChatAccountAvatar
                user={user}
                avatarUrl={avatarUrl}
                isProUser={isProUser}
                planName={planName}
                showPlanBadge={false}
                avatarClassName="size-9"
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium leading-tight">
                  {userAccountLabel(user)}
                </p>
                {userAccountSubline(user) ? (
                  <p className="truncate text-[13px] text-muted-foreground">
                    {userAccountSubline(user)}
                  </p>
                ) : null}
              </div>
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
        {onOpenNews ? (
          <>
            <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
            <DropdownMenuItem
              className={chatContextMenuItemClass}
              onClick={onOpenNews}
            >
              <NewspaperIcon className={chatContextMenuIconClass} />
              {t("news")}
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
          {resolvedTheme === "dark"
            ? common("lightMode")
            : common("darkMode")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
        <DropdownMenuItem
          variant="destructive"
          className={chatContextMenuDeleteClass}
          onClick={() => void logout()}
        >
          <LogOutIcon className="size-4.5 shrink-0" />
          {t("logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ChatAccountMenu }
