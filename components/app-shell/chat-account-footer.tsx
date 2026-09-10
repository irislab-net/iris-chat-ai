"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  EclipseIcon,
  LogOutIcon,
  SparklesIcon,
} from "lucide-react"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { useAuth } from "@/components/auth/auth-provider"
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
import { UPGRADE_PATH } from "@/lib/site"
import type { User } from "@/lib/api/types"
import {
  userAccountLabel,
  userAccountSubline,
  userAvatarFallback,
} from "@/lib/user-profile"
import { cn } from "@/lib/utils"

function AccountAvatar({
  user,
  avatarUrl,
  isProUser,
  planName,
  compact = false,
}: {
  user: User
  avatarUrl: string | null
  isProUser: boolean
  planName: ReturnType<typeof displayPlanName>
  compact?: boolean
}) {
  return (
    <span className="relative shrink-0">
      <Avatar
        className={cn(
          "size-8 after:border-0",
          isProUser &&
            !compact &&
            "ring-2 ring-foreground/15 ring-offset-1 ring-offset-background"
        )}
      >
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={userAccountLabel(user)} />
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

function ChatAccountFooter({ className }: { className?: string }) {
  const { user, isProUser, logout } = useAuth()
  const avatarUrl = useUserAvatarUrl(user)
  const { resolvedTheme, setTheme } = useTheme()

  if (!user) return null

  const planName = displayPlanName(user.tier)
  const subline = userAccountSubline(user)
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-t border-border/60 p-2",
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-w-0 flex-1 justify-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/40"
              aria-label={`Account menu for ${userAccountLabel(user)}`}
            />
          }
        >
          <AccountAvatar
            user={user}
            avatarUrl={avatarUrl}
            isProUser={isProUser}
            planName={planName}
            compact
          />
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[13px] font-medium leading-tight">
              {userAccountLabel(user)}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {planName}
            </span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="min-w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <AccountAvatar
                    user={user}
                    avatarUrl={avatarUrl}
                    isProUser={isProUser}
                    planName={planName}
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
      {!isProUser ? (
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
