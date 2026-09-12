"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  CheckIcon,
  ChevronDownIcon,
  EclipseIcon,
  LogOutIcon,
  NewspaperIcon,
  SparklesIcon,
  SquarePenIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import { ChatGeminiMenuIcon } from "@/components/app-shell/chat-gemini-menu-icon"

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
  chatMobileHeaderButtonClass,
  chatMobileHeaderModelClass,
  chatMobileHeaderNewChatClass,
  chatMobileHeaderPlanBadgeClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatAccountAvatar } from "@/components/app-shell/chat-account-avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { displayPlanName } from "@/lib/billing/catalog"
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
import {
  CHAT_EFFORT_OPTIONS,
  chatEffortLabel,
  type ChatEffort,
} from "@/lib/chat-effort"
import { UPGRADE_PATH } from "@/lib/site"
import {
  userAccountLabel,
  userAccountSubline,
} from "@/lib/user-profile"
import { cn } from "@/lib/utils"

type ChatMobileHeaderProps = {
  onOpenHistory?: () => void
  historyOpen?: boolean
  effort?: ChatEffort
  onEffortChange?: (effort: ChatEffort) => void
  hideEffort?: boolean
  onNewChat: () => void
  onOpenNews: () => void
  sending?: boolean
  className?: string
}

function AccountAvatarMenu({
  onOpenNews,
}: {
  onOpenNews: () => void
}) {
  const t = useTranslations("workspace")
  const common = useTranslations("common")
  const { user, isProUser, login, logout, loginPending } = useAuth()
  const avatarUrl = useUserAvatarUrl(user)
  const { resolvedTheme, setTheme } = useTheme()
  const planName = user ? displayPlanName(user.tier) : "Free"

  if (!user) {
    return (
      <Button
        type="button"
        variant="ghost"
        className={chatMobileHeaderAvatarButtonClass}
        aria-label={t("signIn")}
        disabled={loginPending}
        onClick={() => login({ source: "chat" })}
      >
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
            className={chatMobileHeaderAvatarButtonClass}
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
          showPlanBadge
          planBadgeClassName={chatMobileHeaderPlanBadgeClass}
          avatarClassName={chatMobileHeaderAvatarClass}
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
        <DropdownMenuSeparator className={chatContextMenuSeparatorClass} />
        <DropdownMenuItem
          className={chatContextMenuItemClass}
          onClick={onOpenNews}
        >
          <NewspaperIcon className={chatContextMenuIconClass} />
          {t("news")}
        </DropdownMenuItem>
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

function ChatMobileHeader({
  onOpenHistory,
  historyOpen = false,
  effort,
  onEffortChange,
  hideEffort = false,
  onNewChat,
  onOpenNews,
  sending = false,
  className,
}: ChatMobileHeaderProps) {
  const t = useTranslations("workspace")
  const effortLabel = effort ? chatEffortLabel(effort) : chatEffortLabel("instant")

  const effortTriggerClass = cn(
    chatMobileHeaderModelClass,
    "min-w-[6.25rem] justify-between hover:bg-white/88 aria-expanded:bg-white/90 dark:hover:bg-white/[0.12] dark:aria-expanded:bg-white/[0.14]"
  )

  const effortControl =
    !hideEffort && effort && onEffortChange ? (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              aria-label={`Response depth: ${effortLabel}`}
              aria-haspopup="menu"
              className={effortTriggerClass}
            />
          }
        >
          <span className="truncate">{effortLabel}</span>
          <ChevronDownIcon className="shrink-0 opacity-70" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className={cn(chatContextMenuContentClass, "min-w-44")}
        >
          <DropdownMenuGroup>
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Response depth
            </p>
            {CHAT_EFFORT_OPTIONS.map((item) => (
              <DropdownMenuItem
                key={item.value}
                className="items-start py-2"
                onClick={() => onEffortChange(item.value)}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] font-medium">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.hint}
                  </span>
                </span>
                {effort === item.value ? (
                  <CheckIcon className="mt-0.5 size-3.5" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <span
        className={cn(effortTriggerClass, "pointer-events-none")}
        aria-label={`Response depth: ${effortLabel}`}
      >
        <span className="truncate">{effortLabel}</span>
        <ChevronDownIcon className="shrink-0 opacity-55" aria-hidden />
      </span>
    )

  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 bg-transparent px-3 pb-2 pt-[max(0.375rem,var(--app-safe-top,0px))]",
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-start gap-3">
        {onOpenHistory ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={chatMobileHeaderButtonClass}
            aria-label={t("chatHistory")}
            aria-pressed={historyOpen}
            onClick={onOpenHistory}
          >
            <ChatGeminiMenuIcon />
          </Button>
        ) : null}
        {effortControl}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={chatMobileHeaderNewChatClass}
          aria-label={t("newChat")}
          disabled={sending}
          onClick={onNewChat}
        >
          <SquarePenIcon />
        </Button>
        <AccountAvatarMenu onOpenNews={onOpenNews} />
      </div>
    </header>
  )

}

export { ChatMobileHeader }
