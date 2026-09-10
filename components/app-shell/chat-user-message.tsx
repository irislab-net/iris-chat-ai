"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, CopyIcon, PencilIcon } from "lucide-react"

import { chatTurnActionsClass } from "@/components/app-shell/chat-turn-actions"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { trackChatMessageCopied } from "@/lib/analytics"
import { cn } from "@/lib/utils"

const COLLAPSE_CHAR_LIMIT = 360

/** Dark bubble in light mode; soft elevated surface in dark mode (not pure white). */
const userBubbleClass =
  "rounded-xl border border-foreground/15 bg-foreground px-4 py-3 text-[14px] leading-[1.55] text-background dark:border-border/50 dark:bg-secondary dark:text-foreground sm:text-[13px] [&::selection]:bg-background/25 dark:[&::selection]:bg-foreground/15"

const userExpandToggleClass =
  "h-auto min-h-0 w-auto gap-0.5 px-1 py-0.5 text-xs font-normal text-background/60 underline-offset-2 hover:bg-background/10 hover:text-background hover:underline dark:text-muted-foreground dark:hover:bg-foreground/5 dark:hover:text-foreground"

const userTurnActionButtonClass =
  "size-7 text-background/55 hover:bg-background/10 hover:text-background dark:text-muted-foreground dark:hover:bg-foreground/5 dark:hover:text-foreground"

type ChatUserTurnProps = {
  messageId: string
  conversationId: string
  content: string
  onEdit?: () => void
  disabled?: boolean
  className?: string
}

function ChatUserTurn({
  messageId,
  conversationId,
  content,
  onEdit,
  disabled,
  className,
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
                userBubbleClass
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
                    className={userExpandToggleClass}
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
                    className={userTurnActionButtonClass}
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
                      className={userTurnActionButtonClass}
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
      <ContextMenuContent className="min-w-40">
        <ContextMenuItem
          disabled={disabled || !trimmed}
          onClick={() => void copyMessage(false)}
        >
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        {onEdit ? (
          <ContextMenuItem disabled={disabled} onClick={onEdit}>
            Edit message
          </ContextMenuItem>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  )
}

export { ChatUserTurn }
