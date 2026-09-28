"use client"

import * as React from "react"
import type { ReactNode } from "react"
import dynamic from "next/dynamic"

import { ExurLogo } from "@/components/brand/exur-logo"
import { ChatMessageQuote } from "@/components/app-shell/chat-message-quote"
import { chatUserBubbleClass } from "@/components/app-shell/chat-turn-actions"
import { ChatThinkingTrace } from "@/components/app-shell/chat-thinking-trace"
import { TypingDots } from "@/components/app-shell/chat-typing"
import type { ChatThinkingStep } from "@/lib/api/chat-sse"
import type { MessageQuote } from "@/lib/api/types"
import { parseServerMessageId } from "@/lib/chat-message-id"
import { formatChatTime } from "@/lib/chat-storage"
import { EXUR_LOGO_MARK_PATH, EXUR_LOGO_VIEWBOX } from "@/lib/exur-logo-path"
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
  const gradientId = React.useId().replace(/:/g, "")

  if (!isHero) {
    return (
      <ExurLogo
        decorative
        variant="gradient"
        size={28}
        className={cn("size-7 overflow-hidden rounded-full", className)}
        imageClassName={imageClassName}
      />
    )
  }

  // Hero: current mark path + black gradient on liquid glass (no baked white disc).
  return (
    <span
      className={cn(
        "chat-empty-hero-mark relative inline-flex size-14 shrink-0 items-center justify-center rounded-full p-0.75",
        "border-0 bg-white/55 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_88%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_8%,transparent),0_1px_2px_color-mix(in_oklch,var(--foreground)_4%,transparent),0_14px_36px_-14px_color-mix(in_oklch,var(--foreground)_14%,transparent)]",
        "backdrop-blur-2xl backdrop-saturate-180 supports-backdrop-filter:bg-white/40",
        "dark:bg-[oklch(0.22_0_0_/0.88)] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_10%,transparent),0_14px_40px_-16px_color-mix(in_oklch,black_55%,transparent)] dark:supports-backdrop-filter:bg-[oklch(0.2_0_0_/0.72)]",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-full bg-foreground/10 blur-xl dark:bg-black/40"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-br from-white/90 via-white/25 to-transparent dark:from-white/12 dark:via-white/3 dark:to-transparent"
      />
      <span
        className={cn(
          "relative z-10 isolate flex size-full items-center justify-center overflow-hidden rounded-full p-[6%]",
          "bg-white/72 shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_90%,transparent),inset_0_0_0_1px_color-mix(in_oklch,var(--foreground)_6%,transparent)]",
          "backdrop-blur-md supports-backdrop-filter:bg-white/55",
          "dark:bg-[oklch(0.18_0_0_/0.92)] dark:shadow-[inset_0_1px_0_0_color-mix(in_oklch,white_8%,transparent),0_6px_18px_-10px_color-mix(in_oklch,black_50%,transparent)] dark:supports-backdrop-filter:bg-[oklch(0.16_0_0_/0.78)]"
        )}
      >
        <svg
          viewBox={EXUR_LOGO_VIEWBOX}
          className={cn("relative z-0 size-full overflow-visible", imageClassName)}
          fill="none"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`exur-mark-black-${gradientId}`}
              x1="33.15"
              y1="7"
              x2="33.15"
              y2="63"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#000000" />
              <stop offset="1" stopColor="#3F3F3F" />
            </linearGradient>
            <linearGradient
              id={`exur-mark-white-${gradientId}`}
              x1="33.15"
              y1="7"
              x2="33.15"
              y2="63"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#D4D4D4" />
            </linearGradient>
          </defs>
          <path
            className="dark:hidden"
            d={EXUR_LOGO_MARK_PATH}
            fill={`url(#exur-mark-black-${gradientId})`}
          />
          <path
            className="hidden dark:block"
            d={EXUR_LOGO_MARK_PATH}
            fill={`url(#exur-mark-white-${gradientId})`}
          />
        </svg>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]"
        >
          <span
            className={cn(
              "absolute inset-y-[-12%] left-0 w-[62%]",
              "bg-linear-to-r from-transparent via-white/55 to-transparent",
              "animate-exur-logo-shimmer will-change-transform",
              "dark:via-white/70"
            )}
          />
        </span>
      </span>
    </span>
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
  const deferredContent = React.useDeferredValue(content)
  const renderContent = streaming ? deferredContent : content
  const serverId = messageId ? parseServerMessageId(messageId) : null
  const anchorId = serverId != null ? `msg-${serverId}` : undefined
  const hasThinking =
    Boolean(thinkingTrace?.length) || Boolean(reasoning?.trim())
  const hasBody =
    waiting ||
    hasThinking ||
    Boolean(content?.trim()) ||
    Boolean(children) ||
    Boolean(replyTo)
  const timestamp = createdAt ? (
    <p className="min-w-0 truncate text-[10px] leading-none text-muted-foreground/80">
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
              : "text-sm leading-[1.6] text-foreground/92 sm:text-[13px]"
          )}
          data-chat-assistant-bubble=""
        >
          {waiting && !hasThinking ? (
            <TypingDots className="text-muted-foreground/70" />
          ) : null}
          {hasThinking || (waiting && hasThinking) ? (
            <ChatThinkingTrace
              steps={thinkingTrace}
              reasoning={reasoning}
              live={Boolean(waiting)}
            />
          ) : null}
          {waiting && hasThinking ? null : (
            <>
              {replyTo ? <ChatMessageQuote quote={replyTo} /> : null}
              {renderContent?.trim() ? (
                <AIMessageRenderer content={renderContent} />
              ) : null}
              {children}
            </>
          )}
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
        "min-w-0 overflow-hidden rounded-xl bg-muted/15 px-3 py-2 text-center text-[11px] leading-5 wrap-anywhere text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  )
}

export { ChatAssistantTurn, ChatSystemNote, ChatUserBubble, IrisMark }
