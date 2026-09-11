"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"

import { chatUserBubbleClass } from "@/components/app-shell/chat-turn-actions"
import { TypingDots } from "@/components/app-shell/chat-typing"
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
  variant = "default",
}: {
  className?: string
  /** Large empty-state mark — requests a sharper src than the inline default. */
  variant?: "default" | "hero"
}) {
  const isHero = variant === "hero"

  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/50",
        className
      )}
    >
      <Image
        src="/Logo.png"
        alt=""
        width={isHero ? 144 : 24}
        height={isHero ? 144 : 24}
        priority={isHero}
        sizes={isHero ? "4.5rem" : "1.75rem"}
        className={cn(
          "object-contain",
          isHero ? "size-full" : "size-[65%]"
        )}
      />
    </div>
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
  content,
  waiting,
  children,
  actions,
  toolbar,
  className,
  variant = "default",
}: {
  /** Assistant reply — rendered as GFM markdown (tables, lists, code). */
  content?: string
  waiting?: boolean
  compact?: boolean
  children?: ReactNode
  actions?: ReactNode
  toolbar?: ReactNode
  className?: string
  variant?: "default" | "gemini"
}) {
  const isGemini = variant === "gemini"
  const hasBody =
    waiting || Boolean(content?.trim()) || Boolean(children)

  return (
    <div className={cn("w-full min-w-0", isGemini ? "px-0" : "px-2 sm:px-3", className)}>
      {hasBody ? (
        <div
          dir="auto"
          className={cn(
            "min-w-0 cursor-text select-text chat-bidi [&::selection]:bg-primary/20",
            isGemini
              ? chatMobileAssistantClass
              : "text-[14px] leading-[1.6] text-foreground/92 sm:text-[13px]"
          )}
          data-chat-assistant-bubble=""
        >
          {waiting ? (
            <TypingDots className="text-muted-foreground/70" />
          ) : (
            <>
              {content?.trim() ? (
                <AIMessageRenderer content={content} />
              ) : null}
              {children}
            </>
          )}
        </div>
      ) : null}
      {toolbar ? <div className={cn(isGemini ? "mt-0.5" : "mt-1")}>{toolbar}</div> : null}
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
        <p className="shrink-0 text-[12px] leading-5 text-muted-foreground">
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
