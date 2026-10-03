"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  ReplyIcon,
  Share2Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatTurnActionButtonClass,
  chatTurnActionsClass,
} from "@/components/app-shell/chat-turn-actions"
import { ActionTooltip } from "@/components/ui/action-tooltip"
import { Button } from "@/components/ui/button"
import {
  trackChatMessageCopied,
  trackChatMessageFeedback,
} from "@/lib/analytics"
import {
  buildNoTradeShareText,
  buildSignalShareText,
} from "@/lib/chat/signal-share"
import type { PaperTradeTicket } from "@/lib/chat/signal-ticket"
import { shareTextOrCopy } from "@/lib/chat/transcript"
import type { ChatMessageFeedback } from "@/lib/chat-storage"
import { cn } from "@/lib/utils"

type ChatMessageActionsProps = {
  messageId: string
  conversationId: string
  content: string
  shareTicket?: PaperTradeTicket
  shareNoTradeReason?: string
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
  shareTicket,
  shareNoTradeReason,
  feedback,
  onFeedbackChange,
  onReply,
  disabled,
  className,
  variant = "default",
}: ChatMessageActionsProps) {
  const t = useTranslations("workspace")
  const [copied, setCopied] = React.useState(false)
  const [shared, setShared] = React.useState(false)
  const flashTimerRef = React.useRef(0)
  const isGemini = variant === "gemini"
  const canCopy = Boolean(content.trim())
  const noTradeReason = shareNoTradeReason?.trim() ?? ""
  const canShareSignal = Boolean(shareTicket)
  const canShareNoTrade = !canShareSignal && Boolean(noTradeReason)
  const canShareCard = canShareSignal || canShareNoTrade

  React.useEffect(() => {
    return () => window.clearTimeout(flashTimerRef.current)
  }, [])

  function flash(kind: "copied" | "shared") {
    if (kind === "copied") setCopied(true)
    else setShared(true)
    window.clearTimeout(flashTimerRef.current)
    flashTimerRef.current = window.setTimeout(() => {
      setCopied(false)
      setShared(false)
    }, 1_600)
  }

  async function onCopy() {
    const text = content.trim()
    if (!text || disabled) return
    try {
      await navigator.clipboard.writeText(text)
      flash("copied")
      trackChatMessageCopied({
        conversation_id: conversationId,
        message_id: messageId,
      })
    } catch {
      setCopied(false)
    }
  }

  async function onShareCard() {
    if (disabled) return
    let text = ""
    if (shareTicket) {
      text = buildSignalShareText(shareTicket, {
        entry: t("signalCardEntry"),
        stopLoss: t("signalCardStopLoss"),
        target: t("signalShareTarget"),
      })
    } else if (noTradeReason) {
      text = buildNoTradeShareText(noTradeReason, {
        title: t("noTradeTitle"),
        badge: t("noTradeBadge"),
        capitalProtected: t("noTradeCapitalProtected"),
        reasonHeading: t("noTradeReasonHeading"),
      })
    }
    if (!text) return
    const result = await shareTextOrCopy(text)
    if (!result) return
    flash("shared")
    trackChatMessageCopied({
      conversation_id: conversationId,
      message_id: messageId,
    })
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
      "size-8 rounded-full text-[#444746] hover:bg-[rgba(118,118,128,0.12)] dark:text-muted-foreground dark:hover:bg-[rgba(118,118,128,0.24)]"
  )

  return (
    <div className={cn(chatTurnActionsClass, "justify-start", className)}>
      {onReply ? (
        <ActionTooltip label={t("reply")}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={buttonClass}
            aria-label={t("replyToMessage")}
            disabled={disabled}
            onClick={onReply}
          >
            <ReplyIcon className={isGemini ? "size-4.5" : undefined} />
          </Button>
        </ActionTooltip>
      ) : null}
      {canShareCard ? (
        <ActionTooltip label={t("share")}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={buttonClass}
            aria-label={t("signalCardShare")}
            disabled={disabled}
            onClick={() => void onShareCard()}
          >
            {shared ? (
              <CheckIcon className={isGemini ? "size-4.5" : undefined} />
            ) : (
              <Share2Icon className={isGemini ? "size-4.5" : undefined} />
            )}
          </Button>
        </ActionTooltip>
      ) : (
        <ActionTooltip label={copied ? t("copied") : t("copy")}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={buttonClass}
            aria-label={copied ? t("copiedResponse") : t("copyResponse")}
            disabled={disabled || !canCopy}
            onClick={() => void onCopy()}
          >
            {copied ? (
              <CheckIcon className={isGemini ? "size-4.5" : undefined} />
            ) : (
              <CopyIcon className={isGemini ? "size-4.5" : undefined} />
            )}
          </Button>
        </ActionTooltip>
      )}
      <ActionTooltip label={t("helpful")}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={buttonClass}
          aria-label={t("helpfulResponse")}
          aria-pressed={feedback === "up"}
          disabled={disabled}
          onClick={() => onReaction("up")}
        >
          <ThumbsUpIcon
            className={cn(
              isGemini && "size-4.5",
              feedback === "up" ? "text-foreground" : undefined
            )}
            fill={feedback === "up" ? "currentColor" : "none"}
          />
        </Button>
      </ActionTooltip>
      <ActionTooltip label={t("notHelpful")}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={buttonClass}
          aria-label={t("unhelpfulResponse")}
          aria-pressed={feedback === "down"}
          disabled={disabled}
          onClick={() => onReaction("down")}
        >
          <ThumbsDownIcon
            className={cn(
              isGemini && "size-4.5",
              feedback === "down" ? "text-foreground" : undefined
            )}
            fill={feedback === "down" ? "currentColor" : "none"}
          />
        </Button>
      </ActionTooltip>
    </div>
  )
}

export { ChatMessageActions }
