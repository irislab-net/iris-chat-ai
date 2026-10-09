"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useTranslations } from "next-intl"

import { AttentionPulseDot } from "@/components/app-shell/attention-pulse-dot"
import { ChatGeminiMenuIcon } from "@/components/app-shell/chat-gemini-menu-icon"
import { ChatGeminiNewChatIcon } from "@/components/app-shell/chat-gemini-new-chat-icon"

import {
  chatComposerLiquidSheetRowActiveClass,
  chatComposerLiquidSheetRowClass,
  chatMobileHeaderButtonClass,
  chatMobileHeaderModelPlainClass,
  chatMobileHeaderModelPrimaryClass,
  chatMobileHeaderModelSecondaryClass,
  chatMobileHeaderScrimClass,
  chatMobileHeaderShellClass,
  chatMobileSheetContentClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatAccountMenu } from "@/components/app-shell/chat-account-menu"
import { ChatMobileStakingButton } from "@/components/app-shell/chat-mobile-staking-button"
import { ChatThreadOptionsMenu } from "@/components/app-shell/chat-thread-toolbar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  const common = useTranslations("common")
  const reduceMotion = useReducedMotion()
  const showThreadChrome = Boolean(threadMenu)
  const trailingSpring = reduceMotion ? { duration: 0 } : HEADER_TRAILING_SPRING
  const morphSpring = reduceMotion ? { duration: 0 } : HEADER_MORPH_SPRING
  const [effortOpen, setEffortOpen] = React.useState(false)
  const effortValue = effort ?? "instant"
  const effortLabel = t(`effort.${effortValue}`)

  const effortTriggerClass = cn(
    chatMobileHeaderModelPlainClass,
    "leading-none"
  )

  const effortControl =
    onEffortChange && !hideEffort ? (
      <div className="flex h-11 shrink-0 items-center self-center">
        <Button
          type="button"
          variant="ghost"
          aria-label={t("effort.aria", { mode: effortLabel })}
          aria-haspopup="dialog"
          aria-expanded={effortOpen}
          className={effortTriggerClass}
          onClick={() => setEffortOpen(true)}
        >
          <span className="truncate leading-none">
            <span className={chatMobileHeaderModelPrimaryClass}>
              {common("brand")}
            </span>{" "}
            <span className={chatMobileHeaderModelSecondaryClass}>
              {effortLabel}
            </span>
          </span>
          <ChevronDownIcon
            className="size-3.5 shrink-0 self-center opacity-70"
            aria-hidden
          />
        </Button>
        <Sheet open={effortOpen} onOpenChange={setEffortOpen}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className={cn(
              chatMobileSheetContentClass,
              // Tall enough to feel roomy; max-height avoids a huge empty glass void.
              "flex max-h-[min(60dvh,32rem)] flex-col overflow-hidden rounded-t-[28px] pt-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))] data-[side=bottom]:max-h-[min(60dvh,32rem)]"
            )}
          >
            <div aria-hidden className={chatMobileSheetHandleClass} />
            <SheetHeader className={cn(chatMobileSheetHeaderClass, "pb-3")}>
              <SheetTitle className={chatMobileSheetTitleClass}>
                {t("effort.label")}
              </SheetTitle>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-4 pb-2">
              {CHAT_EFFORT_OPTIONS.map((item) => {
                const selected = effortValue === item.value
                return (
                  <Button
                    key={item.value}
                    type="button"
                    variant="ghost"
                    className={cn(
                      chatComposerLiquidSheetRowClass,
                      "h-auto min-h-16 justify-start gap-3 px-3.5 py-3 text-[15px] font-medium tracking-[-0.016em] hover:bg-white/58 dark:hover:bg-white/12",
                      selected && chatComposerLiquidSheetRowActiveClass
                    )}
                    onClick={() => {
                      onEffortChange(item.value)
                      setEffortOpen(false)
                    }}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
                      <span className="text-[15px] font-medium leading-5 tracking-[-0.016em] text-foreground">
                        {t(`effort.${item.value}`)}
                      </span>
                      <span className="text-[13px] font-normal leading-4.5 tracking-[-0.006em] text-muted-foreground">
                        {t(`effort.${item.value}Hint`)}
                      </span>
                    </span>
                    {selected ? (
                      <SelectionCheckBadge />
                    ) : (
                      <SelectionCheckSpacer />
                    )}
                  </Button>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    ) : null

  return (
    <div className={chatMobileHeaderShellClass}>
      <div aria-hidden className={chatMobileHeaderScrimClass} />
      <header
        className={cn(
          "app-mobile-safe-header relative z-1 flex items-center justify-between gap-2 bg-[var(--browser-chrome-top,var(--browser-chrome-color,var(--background)))] px-4 pb-2",
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
          className="flex h-11 shrink-0 items-center justify-end gap-2 overflow-visible"
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

          <ChatMobileStakingButton />

          <div className="relative size-11 shrink-0 overflow-visible">
            <AnimatePresence initial={false} mode="wait">
              {showThreadChrome && threadMenu ? (
                <motion.div
                  key="thread-options"
                  className="absolute inset-0 flex items-center justify-center overflow-visible will-change-transform"
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
                  className="absolute inset-0 flex items-center justify-center overflow-visible will-change-transform"
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
