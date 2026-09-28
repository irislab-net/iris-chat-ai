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
  loadChatGsap,
  prefersChatReducedMotion,
} from "@/lib/chat-motion"
import { CHAT_EFFORT_OPTIONS, type ChatEffort } from "@/lib/chat-effort"
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
  const showThreadChrome = Boolean(threadMenu)
  const effortValue = effort ?? "instant"
  const effortLabel = t(`effort.${effortValue}`)

  const newChatRef = React.useRef<HTMLDivElement>(null)
  const optionsRef = React.useRef<HTMLDivElement>(null)
  const accountRef = React.useRef<HTMLDivElement>(null)
  const prevChromeRef = React.useRef<boolean | null>(null)
  const tweenRef = React.useRef<{ kill: () => void } | null>(null)

  React.useEffect(() => {
    const newChat = newChatRef.current
    const options = optionsRef.current
    const account = accountRef.current
    if (!newChat || !options || !account) return

    const reduced = prefersChatReducedMotion()
    const prev = prevChromeRef.current
    prevChromeRef.current = showThreadChrome

    const applyInstant = () => {
      newChat.style.width = showThreadChrome ? "40px" : "0px"
      newChat.style.marginInlineEnd = showThreadChrome ? "8px" : "0px"
      newChat.style.opacity = showThreadChrome ? "1" : "0"
      newChat.style.transform = "none"
      newChat.style.pointerEvents = showThreadChrome ? "auto" : "none"
      options.style.opacity = showThreadChrome ? "1" : "0"
      options.style.transform = "none"
      options.style.filter = "none"
      options.style.pointerEvents = showThreadChrome ? "auto" : "none"
      account.style.opacity = showThreadChrome ? "0" : "1"
      account.style.transform = "none"
      account.style.filter = "none"
      account.style.pointerEvents = showThreadChrome ? "none" : "auto"
    }

    if (prev === null || prev === showThreadChrome || reduced) {
      applyInstant()
      return
    }

    let cancelled = false
    void loadChatGsap().then((gsap) => {
      if (cancelled) return
      tweenRef.current?.kill()

      const tl = gsap.timeline({
        defaults: { ease: "power3.out", overwrite: "auto" },
      })
      tweenRef.current = tl

      if (showThreadChrome) {
        tl.fromTo(
          newChat,
          { width: 0, marginInlineEnd: 0, opacity: 0, scale: 0.55, x: 10 },
          {
            width: 40,
            marginInlineEnd: 8,
            opacity: 1,
            scale: 1,
            x: 0,
            duration: 0.42,
            pointerEvents: "auto",
          },
          0
        )
        tl.fromTo(
          account,
          { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" },
          {
            opacity: 0,
            scale: 0.72,
            rotate: -16,
            filter: "blur(8px)",
            duration: 0.34,
            pointerEvents: "none",
          },
          0
        )
        tl.fromTo(
          options,
          {
            opacity: 0,
            scale: 0.68,
            rotate: -18,
            filter: "blur(8px)",
          },
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            filter: "blur(0px)",
            duration: 0.4,
            pointerEvents: "auto",
          },
          0.06
        )
      } else {
        tl.to(
          newChat,
          {
            width: 0,
            marginInlineEnd: 0,
            opacity: 0,
            scale: 0.55,
            x: 14,
            duration: 0.36,
            pointerEvents: "none",
          },
          0
        )
        tl.fromTo(
          options,
          { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" },
          {
            opacity: 0,
            scale: 0.72,
            rotate: 16,
            filter: "blur(8px)",
            duration: 0.34,
            pointerEvents: "none",
          },
          0
        )
        tl.fromTo(
          account,
          {
            opacity: 0,
            scale: 0.68,
            rotate: 18,
            filter: "blur(8px)",
          },
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            filter: "blur(0px)",
            duration: 0.4,
            pointerEvents: "auto",
          },
          0.06
        )
      }
    })

    return () => {
      cancelled = true
      tweenRef.current?.kill()
      tweenRef.current = null
    }
  }, [showThreadChrome])

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
            <p className="px-2.5 pt-1.5 pb-1 text-start text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
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
          "app-mobile-safe-header relative z-1 flex items-center justify-between gap-2 bg-transparent px-6 pb-2",
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
                <AttentionPulseDot className="inset-e-1 -top-0.5" />
              ) : null}
            </Button>
          ) : null}
          {effortControl}
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <div
            ref={newChatRef}
            className="overflow-hidden will-change-transform"
            style={{
              width: showThreadChrome ? 40 : 0,
              marginInlineEnd: showThreadChrome ? 8 : 0,
              transformOrigin: "inline-end center",
            }}
            aria-hidden={!showThreadChrome}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={chatMobileHeaderButtonClass}
              aria-label={t("newChat")}
              disabled={sending || !showThreadChrome}
              tabIndex={showThreadChrome ? 0 : -1}
              onClick={onNewChat}
            >
              <ChatGeminiNewChatIcon strokeWidth={1.5} />
            </Button>
          </div>

          <div className="relative size-12 shrink-0">
            <div
              ref={optionsRef}
              className="absolute inset-0 flex items-center justify-center will-change-transform"
              aria-hidden={!showThreadChrome}
            >
              {threadMenu ? (
                <ChatThreadOptionsMenu
                  {...threadMenu}
                  className={chatMobileHeaderButtonClass}
                />
              ) : null}
            </div>
            <div
              ref={accountRef}
              className="absolute inset-0 flex items-center justify-center will-change-transform"
              aria-hidden={showThreadChrome}
            >
              <ChatAccountMenu onOpenNews={onOpenNews} variant="mobile" />
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

export { ChatMobileHeader }
