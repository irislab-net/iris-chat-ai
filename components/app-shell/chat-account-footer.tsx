"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  EclipseIcon,
  LogOutIcon,
  SparklesIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { ChatAccountAvatar } from "@/components/app-shell/chat-account-avatar"
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
  const { resolvedTheme, setTheme } = useTheme()

  if (!user) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-t border-border/60 p-2",
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
      </div>
    )
  }

  const planName = displayPlanName(user.tier)
  const subline = userAccountSubline(user)
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-t border-border/60 p-2",
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
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-medium leading-tight">
                {userAccountLabel(user)}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {planName}
              </span>
            </span>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="min-w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
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
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="min-h-9 gap-2"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <EclipseIcon />
              {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void logout()}
          >
            <LogOutIcon />
            Log out
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
