"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import {
  CheckIcon,
  ChevronDownIcon,
  EclipseIcon,
  EllipsisVerticalIcon,
  LogOutIcon,
  MenuIcon,
  NewspaperIcon,
  SparklesIcon,
  SquarePenIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useTheme } from "@wrksz/themes/client/use-theme"

import {
  chatContextMenuContentClass,
  chatContextMenuDeleteClass,
  chatContextMenuHeaderClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
  chatContextMenuSeparatorClass,
} from "@/components/app-shell/chat-context-menu-styles"
import {
  chatMobileHeaderButtonClass,
  chatMobileHeaderModelClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatAccountAvatar } from "@/components/app-shell/chat-account-avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { useUserAvatarUrl } from "@/hooks/use-user-avatar-url"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

function AccountMoreMenu({
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
        size="icon"
        className={chatMobileHeaderButtonClass}
        aria-label={t("signIn")}
        disabled={loginPending}
        onClick={() => login({ source: "chat" })}
      >
        <Avatar className="size-7 rounded-full after:border-0">
          <AvatarFallback className="bg-muted text-[11px] font-medium">
            <GoogleGlyph className="size-3.5" />
          </AvatarFallback>
        </Avatar>
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
            size="icon"
            className={chatMobileHeaderButtonClass}
            aria-label="More options"
          />
        }
      >
        <EllipsisVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(chatContextMenuContentClass, "min-w-[17rem]")}
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
          <LogOutIcon className="size-[18px] shrink-0" />
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

  return (
    <header
      className={cn(
        "grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 pb-1 pt-[var(--app-safe-top,0px)]",
        className
      )}
    >
      <div className="flex min-w-0 items-center justify-start">
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
            <MenuIcon />
          </Button>
        ) : null}
      </div>

      <div className="flex min-w-0 items-center justify-center">
        {!hideEffort && effort && onEffortChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Response depth: ${effortLabel}`}
                  className={chatMobileHeaderModelClass}
                />
              }
            >
              <span className="truncate">IRIS · {effortLabel}</span>
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              sideOffset={8}
              className={chatContextMenuContentClass}
            >
              <DropdownMenuGroup>
                <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Response depth
                </p>
                {CHAT_EFFORT_OPTIONS.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    className="items-start py-2"
                    onClick={() => onEffortChange(item.value)}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[13px]">{item.label}</span>
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
          <span className="truncate px-2 text-[17px] font-normal tracking-tight text-[#1f1f1f] dark:text-foreground">
            IRIS
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={chatMobileHeaderButtonClass}
          aria-label={t("newChat")}
          disabled={sending}
          onClick={onNewChat}
        >
          <SquarePenIcon />
        </Button>
        <AccountMoreMenu onOpenNews={onOpenNews} />
      </div>
    </header>
  )
}

export { ChatMobileHeader }
