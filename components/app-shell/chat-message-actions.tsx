"use client"

import * as React from "react"
import {
  CheckIcon,
  CopyIcon,
  ReplyIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatTurnActionButtonClass,
  chatTurnActionsClass,
} from "@/components/app-shell/chat-turn-actions"
import { ChatNoTradeShareDialog } from "@/components/app-shell/chat-no-trade-share-dialog"
import { ChatSignalShareDialog } from "@/components/app-shell/chat-signal-share-dialog"
import { IosShareIcon } from "@/components/icons/ios-share-icon"
import { Button } from "@/components/ui/button"
import {
  trackChatMessageCopied,
  trackChatMessageFeedback,
} from "@/lib/analytics"
import type { PaperTradeTicket } from "@/lib/chat/signal-ticket"
import type { ChatMessageFeedback } from "@/lib/chat-storage"
import { cn } from "@/lib/utils"

type ChatMessageActionsProps = {
  messageId: string
  conversationId: string
  content: string
  /** When set, Share opens the same image/text sheet as the signal card. */
  shareTicket?: PaperTradeTicket
  /** When set (and no ticket), Share opens the no-trade share sheet. */
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
  const [shareOpen, setShareOpen] = React.useState(false)
  const copyTimerRef = React.useRef(0)
  const isGemini = variant === "gemini"
  const canCopy = Boolean(content.trim())
  const noTradeReason = shareNoTradeReason?.trim() ?? ""
  const canShareSignal = Boolean(shareTicket)
  const canShareNoTrade = !canShareSignal && Boolean(noTradeReason)
  const canShareCard = canShareSignal || canShareNoTrade

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
      "size-8 rounded-full text-[#444746] hover:bg-[rgba(118,118,128,0.12)] dark:text-muted-foreground dark:hover:bg-[rgba(118,118,128,0.24)]"
  )

  return (
    <div className={cn(chatTurnActionsClass, "justify-start", className)}>
      {onReply ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={buttonClass}
          aria-label={t("replyToMessage")}
          title={t("reply")}
          disabled={disabled}
          onClick={onReply}
        >
          <ReplyIcon className={isGemini ? "size-4.5" : undefined} />
        </Button>
      ) : null}
      {canShareCard ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={buttonClass}
          aria-label={t("signalCardShare")}
          title={t("share")}
          disabled={disabled}
          onClick={() => setShareOpen(true)}
        >
          <IosShareIcon className={isGemini ? "size-4.5" : "size-4"} />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={buttonClass}
          aria-label={copied ? t("copiedResponse") : t("copyResponse")}
          title={copied ? t("copied") : t("copy")}
          disabled={disabled || !canCopy}
          onClick={() => void onCopy()}
        >
          {copied ? (
            <CheckIcon className={isGemini ? "size-4.5" : undefined} />
          ) : (
            <CopyIcon className={isGemini ? "size-4.5" : undefined} />
          )}
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={buttonClass}
        aria-label={t("helpfulResponse")}
        title={t("helpful")}
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
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={buttonClass}
        aria-label={t("unhelpfulResponse")}
        title={t("notHelpful")}
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
      {shareTicket ? (
        <ChatSignalShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          ticket={shareTicket}
        />
      ) : null}
      {canShareNoTrade ? (
        <ChatNoTradeShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          reason={noTradeReason}
        />
      ) : null}
    </div>
  )
}

export { ChatMessageActions }
