"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { ChatAccountAvatar } from "@/components/app-shell/chat-account-avatar"
import {
  AccountGuestMenuSections,
  AccountSignedInMenuSections,
} from "@/components/app-shell/chat-account-menu-sections"
import { chatContextMenuContentClass } from "@/components/app-shell/chat-context-menu-styles"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { displayPlanName } from "@/lib/billing/catalog"
import { userAccountLabel } from "@/lib/user-profile"
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
  const { user, isProUser, login, logout, loginPending } = useAuth()
  const avatarUrl = useUserAvatarUrl(user)
  const rawPlan = user ? displayPlanName(user.tier) : "Free"
  const planName =
    rawPlan === "Plus"
      ? t("planPlus")
      : rawPlan === "Ultimate"
        ? t("planUltimate")
        : t("planFree")

  const isDesktop = variant === "desktop"

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
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
            />
          }
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
                {t("planFree")}
              </Badge>
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className={cn(chatContextMenuContentClass, "min-w-64")}
        >
          <AccountGuestMenuSections
            loginPending={loginPending}
            onLogin={() => login({ source: "chat" })}
          />
        </DropdownMenuContent>
      </DropdownMenu>
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
            aria-label={t("accountMenuFor", {
              name: userAccountLabel(user),
            })}
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
        className={cn(chatContextMenuContentClass, "min-w-64")}
      >
        <AccountSignedInMenuSections
          user={user}
          isProUser={isProUser}
          planName={planName}
          avatarUrl={avatarUrl ?? null}
          onLogout={logout}
          onOpenNews={onOpenNews}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ChatAccountMenu }
