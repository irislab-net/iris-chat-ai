"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"

import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { ChatMessageQuote } from "@/components/app-shell/chat-message-quote"
import { chatUserBubbleClass } from "@/components/app-shell/chat-turn-actions"
import { TypingDots } from "@/components/app-shell/chat-typing"
import type { MessageQuote } from "@/lib/api/types"
import { parseServerMessageId } from "@/lib/chat-message-id"
import { formatChatTime } from "@/lib/chat-storage"
import { cn } from "@/lib/utils"
import { chatMobileAssistantClass } from "@/components/app-shell/chat-mobile-gemini-styles"

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

function IrisMark({
  className,
  imageClassName,
  variant = "default",
}: {
  className?: string
  imageClassName?: string
  /** Large empty-state mark — requests a sharper src than the inline default. */
  variant?: "default" | "hero"
}) {
  const isHero = variant === "hero"

  return (
    <IrisLabLogo
      decorative
      variant="gradient"
      size={isHero ? 64 : 28}
      priority={isHero}
      className={cn(
        "overflow-hidden",
        isHero ? "size-16 rounded-2xl" : "size-7 rounded-full",
        className
      )}
      imageClassName={imageClassName}
    />
  )
}

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
          "chat-bidi max-w-[88%] min-w-0 overflow-hidden wrap-anywhere px-3.5 py-2.5",
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
  /** While typewriter/stream paints, skip markdown parse (cheap plain text). */
  streaming?: boolean
  compact?: boolean
  children?: ReactNode
  actions?: ReactNode
  toolbar?: ReactNode
  className?: string
  variant?: "default" | "gemini"
}) {
  const isGemini = variant === "gemini"
  const serverId = messageId ? parseServerMessageId(messageId) : null
  const anchorId = serverId != null ? `msg-${serverId}` : undefined
  const hasBody =
    waiting || Boolean(content?.trim()) || Boolean(children) || Boolean(replyTo)
  const timestamp = createdAt ? (
    <p className="min-w-0 truncate text-[10px] leading-none text-muted-foreground/80">
      {formatChatTime(createdAt)}
    </p>
  ) : null

  return (
    <div
      id={anchorId}
      className={cn("w-full min-w-0", isGemini ? "px-0" : "px-2 sm:px-3", className)}
    >
      {hasBody ? (
        <div
          dir="auto"
          className={cn(
            "min-w-0 cursor-text select-text chat-bidi [&::selection]:bg-primary/20",
            isGemini
              ? chatMobileAssistantClass
              : "text-sm leading-[1.6] text-foreground/92 sm:text-[13px]"
          )}
          data-chat-assistant-bubble=""
        >
          {waiting ? (
            <TypingDots className="text-muted-foreground/70" />
          ) : (
            <>
              {replyTo ? <ChatMessageQuote quote={replyTo} /> : null}
              {content?.trim() ? (
                streaming ? (
                  <div className="whitespace-pre-wrap wrap-anywhere">
                    {content}
                  </div>
                ) : (
                  <AIMessageRenderer content={content} />
                )
              ) : null}
              {children}
              {!isGemini && timestamp ? (
                <div className="mt-1.5">{timestamp}</div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      {isGemini && (timestamp || toolbar) ? (
        <div className="mt-1 flex min-h-7 items-center justify-between gap-2">
          {timestamp ?? <span aria-hidden className="shrink-0" />}
          {toolbar}
        </div>
      ) : toolbar ? (
        <div className="mt-1">{toolbar}</div>
      ) : null}
      {actions ? (
        <div className="mt-3 flex w-full flex-col items-start gap-2">{actions}</div>
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
        "min-w-0 overflow-hidden wrap-anywhere rounded-xl bg-muted/15 px-3 py-2 text-center text-[11px] leading-5 text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  )
}

export { ChatAssistantTurn, ChatSystemNote, ChatUserBubble, IrisMark }
