"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  ChatAccountAvatar,
  ChatGuestAvatar,
} from "@/components/app-shell/chat-account-avatar"
import {
  AccountGuestMenuSections,
  AccountSignedInMenuSections,
} from "@/components/app-shell/chat-account-menu-sections"
import { ChatAccountSheet } from "@/components/app-shell/chat-account-sheet"
import type { AccountSheetView } from "@/components/app-shell/chat-account-sheet"
import { chatContextMenuContentClass } from "@/components/app-shell/chat-context-menu-styles"
import {
  chatMobileHeaderAvatarButtonClass,
  chatMobileHeaderAvatarClass,
  chatMobileHeaderPlanBadgeClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
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
  /** Mobile sheet: open on root profile or settings (history gear). */
  sheetInitialView?: AccountSheetView
  /** Controlled mobile sheet open (optional). */
  sheetOpen?: boolean
  onSheetOpenChange?: (open: boolean) => void
  /** Custom trigger for mobile sheet (e.g. settings gear). */
  trigger?: React.ReactNode
}

function ChatAccountMenu({
  onOpenNews,
  variant = "mobile",
  className,
  sheetInitialView = "root",
  sheetOpen: sheetOpenProp,
  onSheetOpenChange,
  trigger,
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
  const [sheetOpenUncontrolled, setSheetOpenUncontrolled] = React.useState(false)
  const sheetOpen = sheetOpenProp ?? sheetOpenUncontrolled
  const setSheetOpen = onSheetOpenChange ?? setSheetOpenUncontrolled

  const sheet = (
    <ChatAccountSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      initialView={sheetInitialView}
      user={user}
      isProUser={isProUser}
      planName={planName}
      avatarUrl={avatarUrl ?? null}
      loginPending={loginPending}
      onLogin={() => login({ source: "chat" })}
      onLogout={logout}
      onSwitchAccount={async () => {
        await logout()
        login({ source: "chat" })
      }}
      onOpenNews={onOpenNews}
    />
  )

  if (!isDesktop) {
    const defaultTrigger = !user ? (
      <Button
        type="button"
        variant="ghost"
        className={cn(chatMobileHeaderAvatarButtonClass, className)}
        aria-label={t("signIn")}
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen(true)}
      >
        <ChatGuestAvatar
          avatarClassName={chatMobileHeaderAvatarClass}
          badgeClassName={chatMobileHeaderPlanBadgeClass}
        />
      </Button>
    ) : (
      <Button
        type="button"
        variant="ghost"
        className={cn(chatMobileHeaderAvatarButtonClass, className)}
        aria-label={t("accountMenuFor", {
          name: userAccountLabel(user),
        })}
        aria-expanded={sheetOpen}
        onClick={() => setSheetOpen(true)}
      >
        <ChatAccountAvatar
          user={user}
          avatarUrl={avatarUrl}
          isProUser={isProUser}
          planName={planName}
          compact
          showPlanBadge
          planBadgeClassName={chatMobileHeaderPlanBadgeClass}
          avatarClassName={chatMobileHeaderAvatarClass}
        />
      </Button>
    )

    const resolvedTrigger = (() => {
      if (!trigger) return defaultTrigger
      if (!React.isValidElement<{ onClick?: (event: React.MouseEvent) => void }>(
        trigger
      )) {
        return trigger
      }
      const previousOnClick = trigger.props.onClick
      return React.cloneElement(trigger, {
        onClick: (event: React.MouseEvent) => {
          previousOnClick?.(event)
          if (!event.defaultPrevented) setSheetOpen(true)
        },
      })
    })()

    return (
      <>
        {resolvedTrigger}
        {sheet}
      </>
    )
  }

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-8 shrink-0 gap-2 px-2.5", className)}
              aria-label={t("signIn")}
            />
          }
        >
          <GoogleGlyph className="size-3.5 shrink-0" />
          <span className="hidden sm:inline">
            {loginPending ? t("connecting") : t("signIn")}
          </span>
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
              "h-8 shrink-0 gap-2 px-1.5 hover:bg-muted/50",
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
          showPlanBadge={false}
          avatarClassName="size-7"
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
