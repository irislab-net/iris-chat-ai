"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useTranslations } from "next-intl"

import { AttentionPulseDot } from "@/components/app-shell/attention-pulse-dot"
import { ChatGeminiMenuIcon } from "@/components/app-shell/chat-gemini-menu-icon"
import { ChatGeminiNewChatIcon } from "@/components/app-shell/chat-gemini-new-chat-icon"

import {
  chatContextMenuContentClass,
  chatContextMenuItemClass,
} from "@/components/app-shell/chat-context-menu-styles"
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
  SelectionCheckBadge,
  SelectionCheckSpacer,
} from "@/components/ui/selection-check-badge"
import { CHAT_EFFORT_OPTIONS, type ChatEffort } from "@/lib/chat-effort"
import { cn } from "@/lib/utils"

const HEADER_TRAILING_SPRING = {
  type: "spring" as const,
  stiffness: 520,
  damping: 34,
  mass: 0.72,
}

const HEADER_MORPH_SPRING = {
  type: "spring" as const,
  stiffness: 460,
  damping: 30,
  mass: 0.68,
}

type ChatMobileThreadMenuProps = {
  title: string
  pinned: boolean
  disabled?: boolean
  onShare: () => boolean | Promise<boolean>
  onDownload: () => boolean | Promise<boolean>
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
  const reduceMotion = useReducedMotion()
  const showThreadChrome = Boolean(threadMenu)
  const trailingSpring = reduceMotion ? { duration: 0 } : HEADER_TRAILING_SPRING
  const morphSpring = reduceMotion ? { duration: 0 } : HEADER_MORPH_SPRING
  const effortValue = effort ?? "instant"
  const effortLabel = t(`effort.${effortValue}`)

  const effortTriggerClass = cn(
    chatMobileHeaderModelClass,
    "min-w-[6.25rem] justify-between leading-none hover:border-white/55 hover:bg-white/[0.32] aria-expanded:border-white/55 aria-expanded:bg-white/[0.36] dark:hover:border-white/28 dark:hover:bg-white/[0.18] dark:aria-expanded:border-white/28 dark:aria-expanded:bg-white/[0.20]"
  )

  const effortControl =
    onEffortChange && !hideEffort ? (
      <div className="flex h-11 shrink-0 items-center self-center">
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
            <span className="truncate leading-none">{effortLabel}</span>
            <ChevronDownIcon
              className="size-3.5 shrink-0 self-center opacity-70"
              aria-hidden
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={8}
            showBackdrop
            backdropClassName="bg-black/8 supports-backdrop-filter:bg-black/[0.04] supports-backdrop-filter:backdrop-blur-xs dark:bg-black/30 dark:supports-backdrop-filter:bg-black/20"
            className={cn(chatContextMenuContentClass, "min-w-48")}
          >
            <DropdownMenuGroup>
              {CHAT_EFFORT_OPTIONS.map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  className={cn(
                    chatContextMenuItemClass,
                    "items-center gap-2.5"
                  )}
                  onClick={() => onEffortChange(item.value)}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                    <span className="text-[15px] font-medium leading-5 tracking-[-0.016em]">
                      {t(`effort.${item.value}`)}
                    </span>
                    <span className="text-[13px] font-normal leading-4.5 tracking-[-0.006em] text-muted-foreground">
                      {t(`effort.${item.value}Hint`)}
                    </span>
                  </span>
                  {effortValue === item.value ? (
                    <SelectionCheckBadge />
                  ) : (
                    <SelectionCheckSpacer />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ) : null

  return (
    <div className={chatMobileHeaderShellClass}>
      <div aria-hidden className={chatMobileHeaderScrimClass} />
      <header
        className={cn(
          "app-mobile-safe-header relative z-1 flex items-center justify-between gap-2 bg-transparent px-4 pb-2",
          className
        )}
      >
        <div className="flex h-11 min-w-0 items-center justify-start gap-2">
          {onOpenHistory ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(chatMobileHeaderButtonClass, "relative self-center")}
              aria-label={t("chatHistory")}
              aria-pressed={historyOpen}
              onClick={onOpenHistory}
            >
              <ChatGeminiMenuIcon />
              {showMenuSpotlight ? (
                <AttentionPulseDot className="inset-e-1 -top-0.5" />
              ) : null}
            </Button>
          ) : null}
          {effortControl}
        </div>

        <motion.div
          className="flex shrink-0 items-center justify-end"
          transition={trailingSpring}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {showThreadChrome ? (
              <motion.div
                key="new-chat"
                initial={{ opacity: 0, scale: 0.55, x: 10 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: 0,
                  marginInlineEnd: 8,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.55,
                  x: 14,
                  marginInlineEnd: 0,
                }}
                transition={trailingSpring}
                className="will-change-transform"
                style={{ transformOrigin: "inline-end center" }}
              >
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
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="relative size-12 shrink-0">
            <AnimatePresence initial={false} mode="wait">
              {showThreadChrome && threadMenu ? (
                <motion.div
                  key="thread-options"
                  className="absolute inset-0 flex items-center justify-center will-change-transform"
                  initial={{
                    opacity: 0,
                    scale: 0.68,
                    rotate: -18,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.72,
                    rotate: 16,
                  }}
                  transition={morphSpring}
                >
                  <ChatThreadOptionsMenu
                    {...threadMenu}
                    className={chatMobileHeaderButtonClass}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="account-menu"
                  className="absolute inset-0 flex items-center justify-center will-change-transform"
                  initial={{
                    opacity: 0,
                    scale: 0.68,
                    rotate: 18,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.72,
                    rotate: -16,
                  }}
                  transition={morphSpring}
                >
                  <ChatAccountMenu
                    onOpenNews={onOpenNews}
                    variant="mobile"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </header>
    </div>
  )
}

export { ChatMobileHeader }
