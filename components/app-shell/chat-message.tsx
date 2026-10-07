"use client"

import * as React from "react"
import type { ReactNode } from "react"
import dynamic from "next/dynamic"

import { IrisMark } from "@/components/brand/iris-mark"
import { ChatMessageQuote } from "@/components/app-shell/chat-message-quote"
import { chatUserBubbleClass } from "@/components/app-shell/chat-turn-actions"
import { ChatThinkingTerminal } from "@/components/app-shell/chat-thinking-progress"
import type { ChatThinkingStep } from "@/lib/api/chat-sse"
import type { MessageQuote } from "@/lib/api/types"
import { parseServerMessageId } from "@/lib/chat-message-id"
import { formatChatTime } from "@/lib/chat-storage"
import { cn } from "@/lib/utils"
import { chatMobileAssistantClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { useLocale } from "next-intl"

const AIMessageRenderer = dynamic(
  () =>
    import("@/components/app-shell/ai-message-renderer").then((mod) => ({
      default: mod.AIMessageRenderer,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        data-ai-message-loading=""
        className="h-4 w-24 animate-pulse rounded bg-muted/40"
        aria-hidden
      />
    ),
  }
)

const ChatThinkingTrace = dynamic(
  () =>
    import("@/components/app-shell/chat-thinking-trace").then((mod) => ({
      default: mod.ChatThinkingTrace,
    })),
  { ssr: false }
)

function ChatUserBubble({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex w-full min-w-0 justify-end", className)}>
      <div
        dir="auto"
        className={cn(
          "max-w-[88%] min-w-0 overflow-hidden px-3.5 py-2.5 chat-bidi wrap-anywhere",
          chatUserBubbleClass
        )}
      >
        {children}
      </div>
    </div>
  )
}

function ChatAssistantTurn({
  messageId,
  content,
  createdAt,
  replyTo,
  waiting,
  thinkingTrace,
  reasoning,
  thinkingDurationSec,
  streaming,
  children,
  actions,
  toolbar,
  className,
  variant = "default",
}: {
  messageId?: string
  /** Assistant reply — rendered as GFM markdown (tables, lists, code). */
  content?: string
  createdAt?: string
  replyTo?: MessageQuote
  waiting?: boolean
  /** Live / persisted SSE thinking steps (reasoning + MCP tools). */
  thinkingTrace?: ChatThinkingStep[]
  reasoning?: string
  /** Frozen thinking duration in seconds for completed turns. */
  thinkingDurationSec?: number
  /** Live typewriter/stream — markdown still renders; updates may defer slightly. */
  streaming?: boolean
  compact?: boolean
  children?: ReactNode
  actions?: ReactNode
  toolbar?: ReactNode
  className?: string
  variant?: "default" | "gemini"
}) {
  const locale = useLocale()
  const isGemini = variant === "gemini"
  // Never defer live typewriter/stream text — deferred updates lag behind
  // scroll/layout work and the answer looks blank until a sudden paint.
  const renderContent = content
  const hasVisibleAnswer = Boolean(renderContent?.trim())
  // Keep live status until the answer is actually on screen.
  const statusLive =
    Boolean(waiting) || (Boolean(streaming) && !hasVisibleAnswer)
  const serverId = messageId ? parseServerMessageId(messageId) : null
  const anchorId = serverId != null ? `msg-${serverId}` : undefined
  const hasThinking =
    Boolean(thinkingTrace?.length) || Boolean(reasoning?.trim())
  const hasBody =
    waiting ||
    statusLive ||
    hasThinking ||
    hasVisibleAnswer ||
    Boolean(children) ||
    Boolean(replyTo)
  const timestamp = createdAt ? (
    <p className="min-w-0 truncate text-[11px] leading-3.25 tracking-[0.006em] text-muted-foreground/80">
      {formatChatTime(createdAt, locale)}
    </p>
  ) : null

  return (
    <div
      id={anchorId}
      className={cn(
        "w-full min-w-0",
        isGemini ? "px-0" : "px-2 sm:px-3",
        className
      )}
    >
      {hasBody ? (
        <div
          dir="auto"
          className={cn(
            "min-w-0 cursor-text chat-bidi select-text [&::selection]:bg-primary/20",
            isGemini
              ? chatMobileAssistantClass
              : "text-[15px] font-normal leading-5 tracking-[-0.016em] text-foreground/92"
          )}
          data-chat-assistant-bubble=""
        >
          {statusLive && !hasThinking ? <ChatThinkingTerminal /> : null}
          {hasThinking ? (
            <ChatThinkingTrace
              steps={thinkingTrace}
              reasoning={reasoning}
              live={statusLive}
              writing={Boolean(streaming) && !waiting && !hasVisibleAnswer}
              durationSec={thinkingDurationSec}
            />
          ) : null}
          {replyTo ? <ChatMessageQuote quote={replyTo} /> : null}
          {hasVisibleAnswer && renderContent ? (
            <AIMessageRenderer
              content={renderContent}
              streaming={streaming}
            />
          ) : null}
          {children}
        </div>
      ) : null}
      {timestamp || toolbar ? (
        <div className="mt-4 flex min-h-7 items-center justify-between gap-2 ps-5 pe-2">
          {timestamp ?? <span aria-hidden className="shrink-0" />}
          {toolbar}
        </div>
      ) : null}
      {actions ? (
        <div className="mt-3 flex w-full flex-col items-start gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

function ChatSystemNote({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode
  className?: string
  variant?: "default" | "gemini"
}) {
  if (variant === "gemini") {
    return (
      <div
        className={cn(
          "flex min-w-0 items-center gap-3 py-1 text-center",
          className
        )}
      >
        <div className="h-px min-w-0 flex-1 bg-border/70" aria-hidden />
        <p className="shrink-0 text-xs leading-5 text-muted-foreground">
          {children}
        </p>
        <div className="h-px min-w-0 flex-1 bg-border/70" aria-hidden />
      </div>
    )
  }

  return (
    <p
      className={cn(
        "min-w-0 overflow-hidden rounded-3 bg-muted/15 px-3 py-2 text-center text-[11px] leading-5 wrap-anywhere text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  )
}

export { ChatAssistantTurn, ChatSystemNote, ChatUserBubble, IrisMark }
