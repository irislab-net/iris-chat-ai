"use client"

import { cn } from "@/lib/utils"

type ChatMobileGeminiBackgroundProps = {
  active?: boolean
  loading?: boolean
  intro?: boolean
  className?: string
}

function ChatMobileGeminiBackground({
  active = false,
  loading = false,
  intro = false,
  className,
}: ChatMobileGeminiBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-white dark:bg-background" />
      <div
        className={cn(
          "chat-gemini-glow absolute inset-x-[-12%] bottom-[-8%] h-[62%]",
          active ? "chat-gemini-glow-active" : "chat-gemini-glow-idle",
          intro && "chat-gemini-glow-intro",
          loading && "chat-gemini-glow-loading"
        )}
      />
      <div
        className={cn(
          "chat-gemini-dots absolute inset-x-0 bottom-0 h-[48%]",
          active && "chat-gemini-dots-active"
        )}
      />
    </div>
  )
}

export { ChatMobileGeminiBackground }
