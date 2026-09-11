"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { displayPlanName } from "@/lib/billing/catalog"
import type { User } from "@/lib/api/types"
import { userAccountLabel, userAvatarFallback } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

type ChatAccountAvatarProps = {
  user: User
  avatarUrl: string | null
  isProUser: boolean
  planName?: ReturnType<typeof displayPlanName>
  className?: string
  avatarClassName?: string
  compact?: boolean
  showPlanBadge?: boolean
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
            "absolute bottom-0 left-1/2 z-10 h-3 min-w-0 -translate-x-1/2 translate-y-[42%] rounded-full border px-1 text-[7px] font-bold leading-none tracking-wide shadow-sm",
            isProUser
              ? "border-background bg-foreground text-background"
              : "border-border/50 bg-background text-muted-foreground"
          )}
          aria-hidden
        >
          {planName}
        </Badge>
      ) : null}
    </span>
  )
}

export { ChatAccountAvatar }
