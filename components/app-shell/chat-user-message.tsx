"use client"

import * as React from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  PencilIcon,
  ReplyIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import {
  chatContextMenuContentClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
} from "@/components/app-shell/chat-context-menu-styles"
import { ChatMessageQuote } from "@/components/app-shell/chat-message-quote"
import { chatMobileUserBubbleInteractiveClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import {
  chatTurnActionsClass,
  chatUserBubbleClass,
  chatUserBubbleExpandToggleClass,
  chatUserBubbleInlineActionClass,
  chatUserTurnActionsRevealClass,
} from "@/components/app-shell/chat-turn-actions"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { trackChatMessageCopied } from "@/lib/analytics"
import type { MessageQuote } from "@/lib/api/types"
import { parseServerMessageId } from "@/lib/chat-message-id"
import { formatChatTime } from "@/lib/chat-storage"
import { cn } from "@/lib/utils"

const COLLAPSE_CHAR_LIMIT = 360

type ChatUserTurnProps = {
  messageId: string
  conversationId: string
  content: string
  createdAt?: string
  replyTo?: MessageQuote
  onEdit?: () => void
  onReply?: () => void
  disabled?: boolean
  className?: string
  variant?: "default" | "gemini"
}

function ChatUserTurn({
  messageId,
  conversationId,
  content,
  createdAt,
  replyTo,
  onEdit,
  onReply,
  disabled,
  className,
  variant = "default",
}: ChatUserTurnProps) {
  const t = useTranslations("workspace")
  const locale = useLocale()
  const [copied, setCopied] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const copyTimerRef = React.useRef(0)
  const isGemini = variant === "gemini"
  const serverId = parseServerMessageId(messageId)
  const anchorId = serverId != null ? `msg-${serverId}` : undefined

  const trimmed = content.trim()
  const collapsible = trimmed.length > COLLAPSE_CHAR_LIMIT
  const displayText =
    collapsible && !expanded
      ? `${trimmed.slice(0, COLLAPSE_CHAR_LIMIT).trimEnd()}…`
      : trimmed

  React.useEffect(() => {
    return () => window.clearTimeout(copyTimerRef.current)
  }, [])

  async function copyMessage(preferSelection = true) {
    if (!trimmed || disabled) return
    const selection = preferSelection
      ? window.getSelection()?.toString().trim()
      : ""
    const text = selection || trimmed
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      trackChatMessageCopied({
        conversation_id: conversationId,
        message_id: messageId,
      })
      window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1_600)
    } catch {
      setCopied(false)
    }
  }

  const expandToggle = collapsible ? (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className={chatUserBubbleExpandToggleClass}
      onClick={() => setExpanded((value) => !value)}
    >
      {expanded ? t("showLess") : t("showMore")}
      <ChevronDownIcon
        className={cn(
          "size-3.5 transition-transform",
          expanded && "rotate-180"
        )}
      />
    </Button>
  ) : null

  const actionButtons = (
    <div className={cn(chatTurnActionsClass, "shrink-0")}>
      {onReply ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={chatUserBubbleInlineActionClass}
          aria-label={t("replyToMessage")}
          title={t("reply")}
          disabled={disabled}
          onClick={onReply}
        >
          <ReplyIcon />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={chatUserBubbleInlineActionClass}
        aria-label={copied ? t("copiedMessage") : t("copyMessage")}
        title={copied ? t("copied") : t("copy")}
        disabled={disabled || !trimmed}
        onClick={() => void copyMessage()}
      >
        {copied ? (
          <CheckIcon className="text-emerald-400 dark:text-emerald-600" />
        ) : (
          <CopyIcon />
        )}
      </Button>
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={chatUserBubbleInlineActionClass}
          aria-label={t("editMessage")}
          title={t("edit")}
          disabled={disabled}
          onClick={onEdit}
        >
          <PencilIcon />
        </Button>
      ) : null}
    </div>
  )

  const timestamp = createdAt ? (
    <p className="min-w-0 truncate text-[10px] leading-none text-muted-foreground/80">
      {formatChatTime(createdAt, locale)}
    </p>
  ) : null

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            id={anchorId}
            className={cn(
              "group/user-turn w-full min-w-0",
              isGemini && "flex justify-end",
              className
            )}
          >
            {isGemini ? (
              <div className="flex w-full max-w-[88%] flex-col items-stretch gap-1">
                <div
                  dir="auto"
                  tabIndex={0}
                  className={cn(
                    "chat-bidi min-w-0 cursor-text select-text overflow-hidden wrap-anywhere",
                    chatMobileUserBubbleInteractiveClass
                  )}
                >
                  {replyTo ? <ChatMessageQuote quote={replyTo} /> : null}
                  <span className="block min-w-0 whitespace-pre-wrap wrap-anywhere">
                    {displayText}
                  </span>
                  {expandToggle ? (
                    <div className="mt-1.5 flex justify-start">{expandToggle}</div>
                  ) : null}
                </div>
                <div className="flex min-h-7 items-center justify-between gap-2 px-1">
                  {timestamp ?? <span aria-hidden className="shrink-0" />}
                  {actionButtons}
                </div>
              </div>
            ) : (
              <div className="flex w-full min-w-0 flex-col">
                <div
                  dir="auto"
                  tabIndex={0}
                  className={cn(
                    "chat-bidi min-w-0 w-full cursor-text select-text overflow-hidden wrap-anywhere outline-none",
                    chatUserBubbleClass
                  )}
                >
                  {replyTo ? <ChatMessageQuote quote={replyTo} /> : null}
                  <span className="block min-w-0 whitespace-pre-wrap wrap-anywhere">
                    {displayText}
                  </span>
                  <div
                    className={cn(
                      chatTurnActionsClass,
                      chatUserTurnActionsRevealClass,
                      "mt-2 w-full justify-between"
                    )}
                  >
                    {expandToggle ?? <span aria-hidden className="shrink-0" />}
                    {actionButtons}
                  </div>
                </div>
                {timestamp ? (
                  <div className="mt-1.5 px-1">{timestamp}</div>
                ) : null}
              </div>
            )}
          </div>
        }
      />
      <ContextMenuContent
        sideOffset={8}
        className={chatContextMenuContentClass}
      >
        {onReply ? (
          <ContextMenuItem
            className={chatContextMenuItemClass}
            disabled={disabled}
            onClick={onReply}
          >
            <ReplyIcon className={chatContextMenuIconClass} />
            {t("reply")}
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem
          className={chatContextMenuItemClass}
          disabled={disabled || !trimmed}
          onClick={() => void copyMessage(false)}
        >
          <CopyIcon className={chatContextMenuIconClass} />
          {t("copy")}
        </ContextMenuItem>
        {onEdit ? (
          <ContextMenuItem
            className={chatContextMenuItemClass}
            disabled={disabled}
            onClick={onEdit}
          >
            <PencilIcon className={chatContextMenuIconClass} />
            {t("edit")}
          </ContextMenuItem>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  )
}

export { ChatUserTurn }
