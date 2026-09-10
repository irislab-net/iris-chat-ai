"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react"

import {
  chatTurnActionButtonClass,
  chatTurnActionsClass,
} from "@/components/app-shell/chat-turn-actions"
import { Button } from "@/components/ui/button"
import {
  trackChatMessageCopied,
  trackChatMessageFeedback,
} from "@/lib/analytics"
import type { ChatMessageFeedback } from "@/lib/chat-storage"
import { cn } from "@/lib/utils"

type ChatMessageActionsProps = {
  messageId: string
  conversationId: string
  content: string
  feedback?: ChatMessageFeedback
  onFeedbackChange: (feedback: ChatMessageFeedback | undefined) => void
  disabled?: boolean
  className?: string
}

function ChatMessageActions({
  messageId,
  conversationId,
  content,
  feedback,
  onFeedbackChange,
  disabled,
  className,
}: ChatMessageActionsProps) {
  const [copied, setCopied] = React.useState(false)
  const copyTimerRef = React.useRef(0)

  React.useEffect(() => {
    return () => window.clearTimeout(copyTimerRef.current)
  }, [])

  async function onCopy() {
    const text = content.trim()
    if (!text || disabled) return
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

  function onReaction(next: ChatMessageFeedback) {
    if (disabled) return
    const value = feedback === next ? undefined : next
    onFeedbackChange(value)
    trackChatMessageFeedback({
      conversation_id: conversationId,
      message_id: messageId,
      feedback: value ?? "cleared",
    })
  }

  return (
    <div className={cn(chatTurnActionsClass, "justify-start", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={chatTurnActionButtonClass}
        aria-label="Helpful response"
        title="Helpful"
        aria-pressed={feedback === "up"}
        disabled={disabled}
        onClick={() => onReaction("up")}
      >
        <ThumbsUpIcon
          className={feedback === "up" ? "text-foreground" : undefined}
          fill={feedback === "up" ? "currentColor" : "none"}
        />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={chatTurnActionButtonClass}
        aria-label="Unhelpful response"
        title="Not helpful"
        aria-pressed={feedback === "down"}
        disabled={disabled}
        onClick={() => onReaction("down")}
      >
        <ThumbsDownIcon
          className={feedback === "down" ? "text-foreground" : undefined}
          fill={feedback === "down" ? "currentColor" : "none"}
        />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={chatTurnActionButtonClass}
        aria-label={copied ? "Copied response" : "Copy response"}
        title={copied ? "Copied" : "Copy"}
        disabled={disabled || !content.trim()}
        onClick={() => void onCopy()}
      >
        {copied ? (
          <CheckIcon className="text-emerald-600" />
        ) : (
          <CopyIcon />
        )}
      </Button>
    </div>
  )
}

export { ChatMessageActions }
