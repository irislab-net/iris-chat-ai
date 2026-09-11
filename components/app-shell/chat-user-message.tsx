"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, CopyIcon, PencilIcon } from "lucide-react"

import {
  chatContextMenuContentClass,
  chatContextMenuIconClass,
  chatContextMenuItemClass,
} from "@/components/app-shell/chat-context-menu-styles"
import {
  chatMobileUserBubbleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import {
  chatTurnActionsClass,
  chatUserBubbleClass,
  chatUserBubbleExpandToggleClass,
  chatUserBubbleInlineActionClass,
} from "@/components/app-shell/chat-turn-actions"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { trackChatMessageCopied } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const COLLAPSE_CHAR_LIMIT = 360

type ChatUserTurnProps = {
  messageId: string
  conversationId: string
  content: string
  onEdit?: () => void
  disabled?: boolean
  className?: string
  variant?: "default" | "gemini"
}

function ChatUserTurn({
  messageId,
  conversationId,
  content,
  onEdit,
  disabled,
  className,
  variant = "default",
}: ChatUserTurnProps) {
  const [copied, setCopied] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const copyTimerRef = React.useRef(0)

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

  if (variant === "gemini") {
    return (
      <div className={cn("flex w-full min-w-0 justify-end", className)}>
        <div
          dir="auto"
          className={cn(
            "chat-bidi min-w-0 overflow-hidden wrap-anywhere",
            chatMobileUserBubbleClass
          )}
        >
          <span className="block min-w-0 whitespace-pre-wrap wrap-anywhere">
            {trimmed}
          </span>
        </div>
      </div>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            className={cn("group/user-turn w-full min-w-0", className)}
          >
            <div
              dir="auto"
              className={cn(
                "chat-bidi w-full min-w-0 cursor-text select-text wrap-anywhere",
                chatUserBubbleClass
              )}
            >
              <span className="block min-w-0 whitespace-pre-wrap wrap-anywhere">
                {displayText}
              </span>
              <div
                className={cn(
                  chatTurnActionsClass,
                  "mt-2 w-full justify-between"
                )}
              >
                {collapsible ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className={chatUserBubbleExpandToggleClass}
                    onClick={() => setExpanded((value) => !value)}
                  >
                    {expanded ? "Show less" : "Show more"}
                    <ChevronDownIcon
                      className={cn(
                        "size-3.5 transition-transform",
                        expanded && "rotate-180"
                      )}
                    />
                  </Button>
                ) : (
                  <span aria-hidden className="shrink-0" />
                )}
                <div className={cn(chatTurnActionsClass, "shrink-0")}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className={chatUserBubbleInlineActionClass}
                    aria-label={copied ? "Copied message" : "Copy message"}
                    title={copied ? "Copied" : "Copy"}
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
                      aria-label="Edit message"
                      title="Edit"
                      disabled={disabled}
                      onClick={onEdit}
                    >
                      <PencilIcon />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        }
      />
      <ContextMenuContent
        sideOffset={8}
        className={chatContextMenuContentClass}
      >
        <ContextMenuItem
          className={chatContextMenuItemClass}
          disabled={disabled || !trimmed}
          onClick={() => void copyMessage(false)}
        >
          <CopyIcon className={chatContextMenuIconClass} />
          Copy text
        </ContextMenuItem>
        {onEdit ? (
          <ContextMenuItem
            className={chatContextMenuItemClass}
            disabled={disabled}
            onClick={onEdit}
          >
            <PencilIcon className={chatContextMenuIconClass} />
            Edit
          </ContextMenuItem>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  )
}

export { ChatUserTurn }
