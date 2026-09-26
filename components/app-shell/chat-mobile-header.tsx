"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { AttentionPulseDot } from "@/components/app-shell/attention-pulse-dot"
import { ChatGeminiMenuIcon } from "@/components/app-shell/chat-gemini-menu-icon"
import { ChatGeminiNewChatIcon } from "@/components/app-shell/chat-gemini-new-chat-icon"

import { chatContextMenuContentClass } from "@/components/app-shell/chat-context-menu-styles"
import {
  chatMobileHeaderButtonClass,
  chatMobileHeaderModelClass,
  chatMobileHeaderScrimClass,
  chatMobileHeaderShellClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatAccountMenu } from "@/components/app-shell/chat-account-menu"
import { ChatThreadOptionsMenu } from "@/components/app-shell/chat-thread-toolbar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CHAT_EFFORT_OPTIONS,
  type ChatEffort,
} from "@/lib/chat-effort"
import { cn } from "@/lib/utils"

type ChatMobileThreadMenuProps = {
  title: string
  pinned: boolean
  disabled?: boolean
  onShare: () => boolean | Promise<boolean>
  onRename: (title: string) => void
  onTogglePin: () => void
  onDelete: () => void
}

type ChatMobileHeaderProps = {
  onOpenHistory?: () => void
  historyOpen?: boolean
  showMenuSpotlight?: boolean
  effort?: ChatEffort
  onEffortChange?: (effort: ChatEffort) => void
  hideEffort?: boolean
  onNewChat: () => void
  onOpenNews: () => void
  sending?: boolean
  threadMenu?: ChatMobileThreadMenuProps
  className?: string
}

function ChatMobileHeader({
  onOpenHistory,
  historyOpen = false,
  showMenuSpotlight = false,
  effort,
  onEffortChange,
  hideEffort = false,
  onNewChat,
  onOpenNews,
  sending = false,
  threadMenu,
  className,
}: ChatMobileHeaderProps) {
  const t = useTranslations("workspace")
  const effortValue = effort ?? "instant"
  const effortLabel = t(`effort.${effortValue}`)

  const effortTriggerClass = cn(
    chatMobileHeaderModelClass,
    "min-w-[6.25rem] justify-between hover:bg-white/88 aria-expanded:bg-white/90 dark:hover:bg-white/[0.12] dark:aria-expanded:bg-white/[0.14]"
  )

  const effortControl =
    onEffortChange && !hideEffort ? (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              aria-label={t("effort.aria", { mode: effortLabel })}
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
            <p className="px-2.5 pb-1 pt-1.5 text-start text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              {t("effort.label")}
            </p>
            {CHAT_EFFORT_OPTIONS.map((item) => (
              <DropdownMenuItem
                key={item.value}
                className="items-start py-2"
                onClick={() => onEffortChange(item.value)}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                  <span className="text-[13px] font-medium">
                    {t(`effort.${item.value}`)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {t(`effort.${item.value}Hint`)}
                  </span>
                </span>
                {effortValue === item.value ? (
                  <CheckIcon className="mt-0.5 size-3.5" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null

  return (
    <div className={chatMobileHeaderShellClass}>
      <div aria-hidden className={chatMobileHeaderScrimClass} />
      <header
        className={cn(
          "app-mobile-safe-header relative z-[1] flex items-center justify-between gap-2 bg-transparent px-6 pb-2",
          className
        )}
      >
        <div className="flex min-w-0 items-center justify-start gap-3">
          {onOpenHistory ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(chatMobileHeaderButtonClass, "relative")}
              aria-label={t("chatHistory")}
              aria-pressed={historyOpen}
              onClick={onOpenHistory}
            >
              <ChatGeminiMenuIcon />
              {showMenuSpotlight ? (
                <AttentionPulseDot className="-top-0.5 inset-e-1" />
              ) : null}
            </Button>
          ) : null}
          {effortControl}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={chatMobileHeaderButtonClass}
            aria-label={t("newChat")}
            disabled={sending}
            onClick={onNewChat}
          >
            <ChatGeminiNewChatIcon strokeWidth={1.5} />
          </Button>
          {threadMenu ? (
            <ChatThreadOptionsMenu
              {...threadMenu}
              className={chatMobileHeaderButtonClass}
            />
          ) : (
            <ChatAccountMenu onOpenNews={onOpenNews} variant="mobile" />
          )}
        </div>
      </header>
    </div>
  )

}

export { ChatMobileHeader }
