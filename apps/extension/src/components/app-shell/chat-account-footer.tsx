"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

import {
  ChatAccountAvatar,
  ChatGuestAvatar,
} from "@/components/app-shell/chat-account-avatar"
import { AccountSignedInMenuSections } from "@/components/app-shell/chat-account-menu-sections"
import { AccountPreferencesGroup } from "@/components/app-shell/chat-account-preferences"
import {
  ChatAccountSheet,
  type AccountSheetView,
} from "@/components/app-shell/chat-account-sheet"
import { SfGearIcon } from "@/components/icons/sf-menu-icons"
import { chatContextMenuContentClass } from "@/components/app-shell/chat-context-menu-styles"
import {
  chatHistoryRailFooterBarClass,
  chatHistoryRailFooterWrapClass,
  chatHistoryRailUpgradeClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { useAuth } from "@/components/auth/auth-provider"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { displayPlanName } from "@/lib/billing/catalog"
import { UPGRADE_PATH } from "@/lib/site"
import { userAccountLabel } from "@/lib/user-profile"
import { cn } from "@/lib/utils"

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
            className="size-10 shrink-0 rounded-lg hover:bg-muted/40"
            aria-label={common("settings")}
          />
        }
      >
        <SfGearIcon className="size-5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        className={cn(chatContextMenuContentClass, "min-w-64")}
      >
        <AccountPreferencesGroup />
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

  const bar = !user ? (
    <div
      className={cn(
        "flex items-center gap-2 p-2",
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
            ? "size-10 rounded-lg hover:bg-muted/40"
            : "h-auto min-w-0 flex-1 justify-start gap-2.5 rounded-lg px-2 py-2.5 hover:bg-muted/40"
        }
        aria-label={loginPending ? t("connecting") : t("signIn")}
        disabled={loginPending}
        onClick={() => login({ source: "chat" })}
      >
        <ChatGuestAvatar avatarClassName="size-9" />
        {!collapsed ? (
          <span className="min-w-0 flex-1 truncate text-start text-[15px] font-medium">
            {loginPending ? t("connecting") : t("signIn")}
          </span>
        ) : null}
      </Button>
      <ThemeSettingsMenu />
    </div>
  ) : (
    <ChatAccountFooterSignedIn
      className={className}
      collapsed={collapsed}
      user={user}
      isProUser={isProUser}
      avatarUrl={avatarUrl}
      logout={logout}
    />
  )

  return (
    <footer className={chatHistoryRailFooterWrapClass}>
      <div className={chatHistoryRailFooterBarClass}>{bar}</div>
    </footer>
  )
}

function ChatAccountFooterSignedIn({
  className,
  collapsed,
  user,
  isProUser,
  avatarUrl,
  logout,
}: {
  className?: string
  collapsed: boolean
  user: NonNullable<ReturnType<typeof useAuth>["user"]>
  isProUser: boolean
  avatarUrl: string | null | undefined
  logout: () => void | Promise<void>
}) {
  const t = useTranslations("workspace")
  const { login } = useAuth()
  const resolvedAvatarUrl = avatarUrl ?? null
  const rawPlan = displayPlanName(user.tier)
  const planName =
    rawPlan === "Plus"
      ? t("planPlus")
      : rawPlan === "Ultimate"
        ? t("planUltimate")
        : t("planFree")
  const email = user.email?.trim()
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [sheetView, setSheetView] =
    React.useState<AccountSheetView>("tradingProfile")

  function openTradingProfile() {
    setSheetView("tradingProfile")
    setSheetOpen(true)
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2",
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
              aria-label={t("accountMenuFor", {
                name: userAccountLabel(user),
              })}
            />
          }
        >
          <ChatAccountAvatar
            user={user}
            avatarUrl={resolvedAvatarUrl}
            isProUser={isProUser}
            planName={planName}
            compact
          />
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1 text-start">
                <span className="block truncate text-[13px] leading-tight font-medium">
                  {userAccountLabel(user)}
                </span>
                {email ? (
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {email}
                  </span>
                ) : null}
              </span>
              <SfGearIcon
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
          <AccountSignedInMenuSections
            user={user}
            isProUser={isProUser}
            planName={planName}
            avatarUrl={resolvedAvatarUrl}
            onLogout={logout}
            onOpenTradingProfile={openTradingProfile}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      {!collapsed && !isProUser ? (
        <Button
          size="sm"
          className={chatHistoryRailUpgradeClass}
          nativeButton={false}
          render={<Link href={UPGRADE_PATH} />}
        >
          {t("upgrade")}
        </Button>
      ) : null}
      <ChatAccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialView={sheetView}
        user={user}
        isProUser={isProUser}
        planName={planName}
        avatarUrl={resolvedAvatarUrl}
        onLogout={logout}
        onSwitchAccount={async () => {
          await logout()
          login({ source: "chat" })
        }}
      />
    </div>
  )
}

export { ChatAccountFooter }
