"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  LogOutIcon,
  ReceiptIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { ChatAccountAvatar } from "@/components/app-shell/chat-account-avatar"
import {
  AccountLanguageItems,
  AccountThemeItems,
} from "@/components/app-shell/chat-account-preferences"
import {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSeparatorClass,
} from "@/components/app-shell/chat-context-menu-styles"
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
import { BILLING_PATH, UPGRADE_PATH } from "@/lib/site"
import {
  userAccountLabel,
  userAccountSubline,
} from "@/lib/user-profile"
import { cn } from "@/lib/utils"

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

function ThemeSettingsMenu() {
  const common = useTranslations("common")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-lg hover:bg-muted/40"
            aria-label={common("settings")}
          />
        }
      >
        <SettingsIcon className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        className={cn(chatContextMenuContentClass, "min-w-64")}
      >
        <AccountThemeItems />
        <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
        <AccountLanguageItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ChatAccountFooter({
  className,
  collapsed = false,
}: {
  className?: string
  collapsed?: boolean
}) {
  const t = useTranslations("workspace")
  const { user, isProUser, login, logout, loginPending } = useAuth()
  const avatarUrl = useUserAvatarUrl(user)

  if (!user) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 p-2",
          collapsed && "justify-center p-1.5",
          className
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={
            collapsed
              ? "size-9 rounded-lg hover:bg-muted/40"
              : "h-auto min-w-0 flex-1 justify-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/40"
          }
          aria-label={loginPending ? t("connecting") : t("signIn")}
          disabled={loginPending}
          onClick={() => login({ source: "chat" })}
        >
          <Avatar className="size-8 after:border-0">
            <AvatarFallback className="bg-muted text-[11px]">
              <GoogleGlyph className="size-3.5" />
            </AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium">
              {loginPending ? t("connecting") : t("signIn")}
            </span>
          ) : null}
        </Button>
        <ThemeSettingsMenu />
      </div>
    )
  }

  const planName = displayPlanName(user.tier)
  const subline = userAccountSubline(user)
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 p-2",
        collapsed && "justify-center p-1.5",
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              className={
                collapsed
                  ? "size-9 rounded-lg hover:bg-muted/40"
                  : "h-auto min-w-0 flex-1 justify-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/40"
              }
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
          />
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[13px] font-medium leading-tight">
                  {userAccountLabel(user)}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {planName}
                </span>
              </span>
              <SettingsIcon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className={cn(chatContextMenuContentClass, "min-w-64")}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className={chatContextMenuHeaderClass}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <ChatAccountAvatar
                    user={user}
                    avatarUrl={avatarUrl}
                    isProUser={isProUser}
                    planName={planName}
                    showPlanBadge={false}
                    avatarClassName="size-9"
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-foreground">
                      {userAccountLabel(user)}
                    </span>
                    {subline ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {subline}
                      </span>
                    ) : null}
                  </div>
                </div>
                <AccountPlanBadge planName={planName} isProUser={isProUser} />
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
                  Upgrade to Plus
                </Button>
              </div>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
          <DropdownMenuItem
            className={chatContextMenuItemClass}
            nativeButton={false}
            render={<Link href={BILLING_PATH} />}
          >
            <ReceiptIcon className={chatContextMenuIconClass} />
            {t("billing")}
          </DropdownMenuItem>
          <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
          <AccountThemeItems />
          <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
          <AccountLanguageItems />
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
      {!collapsed && !isProUser ? (
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 rounded-full px-3 text-xs font-medium"
          nativeButton={false}
          render={<Link href={UPGRADE_PATH} />}
        >
          Upgrade
        </Button>
      ) : null}
    </div>
  )
}

export { ChatAccountFooter }
