"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  SquarePenIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { ChatGeminiMenuIcon } from "@/components/app-shell/chat-gemini-menu-icon"

import { chatContextMenuContentClass } from "@/components/app-shell/chat-context-menu-styles"
import {
  chatMobileHeaderButtonClass,
  chatMobileHeaderModelClass,
  chatMobileHeaderNewChatClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatAccountMenu } from "@/components/app-shell/chat-account-menu"
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
  chatEffortLabel,
  type ChatEffort,
} from "@/lib/chat-effort"
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
    onEffortChange && !hideEffort ? (
      <DropdownMenu modal={false}>
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
                {(effort ?? "instant") === item.value ? (
                  <CheckIcon className="mt-0.5 size-3.5" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null

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
        <ChatAccountMenu onOpenNews={onOpenNews} variant="mobile" />
      </div>
    </header>
  )

}

export { ChatMobileHeader }
