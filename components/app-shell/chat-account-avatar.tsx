"use client"

import { useTranslations } from "next-intl"

import { SfPersonCircleIcon } from "@/components/icons/sf-menu-icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { displayPlanName } from "@/lib/billing/catalog"
import type { User } from "@/lib/api/types"
import { userAccountLabel, userAvatarFallback } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

const avatarPlanBadgeClass =
  "absolute bottom-0 left-1/2 z-10 h-3 min-w-0 -translate-x-1/2 translate-y-[42%] rounded-full border border-border/50 bg-background px-1 text-[7px] leading-none font-bold tracking-wide text-muted-foreground shadow-sm"

type ChatAccountAvatarProps = {
  user: User
  avatarUrl: string | null
  isProUser: boolean
  planName?: string
  className?: string
  avatarClassName?: string
  compact?: boolean
  showPlanBadge?: boolean
  planBadgeClassName?: string
}

function ChatAccountAvatar({
  user,
  avatarUrl,
  isProUser,
  planName: planNameProp,
  className,
  avatarClassName,
  compact = false,
  showPlanBadge = true,
  planBadgeClassName,
}: ChatAccountAvatarProps) {
  const planName = planNameProp ?? displayPlanName(user.tier)

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar
        className={cn(
          "size-8 after:border-0",
          isProUser &&
            !compact &&
            "ring-2 ring-foreground/15 ring-offset-1 ring-offset-background",
          avatarClassName
        )}
      >
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={userAccountLabel(user)} />
        ) : null}
        <AvatarFallback className="text-[11px] font-medium">
          {userAvatarFallback(user)}
        </AvatarFallback>
      </Avatar>
      {showPlanBadge ? (
        <Badge
          className={cn(
            avatarPlanBadgeClass,
            isProUser && "border-background bg-[#2563EB] text-white",
            planBadgeClassName
          )}
          aria-hidden
        >
          {planName}
        </Badge>
      ) : null}
    </span>
  )
}

type ChatGuestAvatarProps = {
  className?: string
  avatarClassName?: string
  iconClassName?: string
  showBadge?: boolean
  badgeClassName?: string
}

/** Guest session avatar — person glyph + Guest plan badge (sheet / new chat / sidebar). */
function ChatGuestAvatar({
  className,
  avatarClassName,
  iconClassName,
  showBadge = true,
  badgeClassName,
}: ChatGuestAvatarProps) {
  const t = useTranslations("workspace")

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar className={cn("size-8 after:border-0", avatarClassName)}>
        <AvatarFallback className="bg-muted text-muted-foreground">
          <SfPersonCircleIcon
            className={cn("size-[55%]", iconClassName)}
            aria-hidden
          />
        </AvatarFallback>
      </Avatar>
      {showBadge ? (
        <Badge
          className={cn(avatarPlanBadgeClass, badgeClassName)}
          aria-hidden
        >
          {t("guest")}
        </Badge>
      ) : null}
    </span>
  )
}

export { ChatAccountAvatar, ChatGuestAvatar }
