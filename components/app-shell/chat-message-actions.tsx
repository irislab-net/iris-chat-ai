"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  ReplyIcon,
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
  onReply?: () => void
  disabled?: boolean
  className?: string
  variant?: "default" | "gemini"
}

function ChatMessageActions({
  messageId,
  conversationId,
  content,
  feedback,
  onFeedbackChange,
  onReply,
  disabled,
  className,
  variant = "default",
}: ChatMessageActionsProps) {
  const [copied, setCopied] = React.useState(false)
  const copyTimerRef = React.useRef(0)
  const isGemini = variant === "gemini"

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

  const buttonClass = cn(
    chatTurnActionButtonClass,
    isGemini &&
      "size-8 rounded-full text-[#444746] hover:bg-black/[0.04] dark:text-muted-foreground dark:hover:bg-white/[0.06]"
  )

  return (
    <div className={cn(chatTurnActionsClass, "justify-start", className)}>
      {onReply ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={buttonClass}
          aria-label="Reply to message"
          title="Reply"
          disabled={disabled}
          onClick={onReply}
        >
          <ReplyIcon className={isGemini ? "size-[18px]" : undefined} />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={buttonClass}
        aria-label={copied ? "Copied response" : "Copy response"}
        title={copied ? "Copied" : "Copy"}
        disabled={disabled || !content.trim()}
        onClick={() => void onCopy()}
      >
        {copied ? (
          <CheckIcon className={cn("text-emerald-600", isGemini && "size-[18px]")} />
        ) : (
          <CopyIcon className={isGemini ? "size-[18px]" : undefined} />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={buttonClass}
        aria-label="Helpful response"
        title="Helpful"
        aria-pressed={feedback === "up"}
        disabled={disabled}
        onClick={() => onReaction("up")}
      >
        <ThumbsUpIcon
          className={cn(
            isGemini && "size-[18px]",
            feedback === "up" ? "text-foreground" : undefined
          )}
          fill={feedback === "up" ? "currentColor" : "none"}
        />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={buttonClass}
        aria-label="Unhelpful response"
        title="Not helpful"
        aria-pressed={feedback === "down"}
        disabled={disabled}
        onClick={() => onReaction("down")}
      >
        <ThumbsDownIcon
          className={cn(
            isGemini && "size-[18px]",
            feedback === "down" ? "text-foreground" : undefined
          )}
          fill={feedback === "down" ? "currentColor" : "none"}
        />
      </Button>
    </div>
  )
}

export { ChatMessageActions }
