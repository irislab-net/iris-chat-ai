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
          "chat-gemini-mesh absolute inset-0",
          intro && "chat-gemini-mesh-intro",
          active && "chat-gemini-mesh-active",
          loading && "chat-gemini-mesh-loading"
        )}
      >
        <div className="chat-gemini-orb chat-gemini-orb-a" />
        <div className="chat-gemini-orb chat-gemini-orb-b" />
        <div className="chat-gemini-orb chat-gemini-orb-c" />
        <div className="chat-gemini-orb chat-gemini-orb-d" />
      </div>
      <div
        className={cn(
          "chat-gemini-dots absolute inset-x-0 bottom-0 h-[52%]",
          active && "chat-gemini-dots-active",
          loading && "chat-gemini-dots-loading"
        )}
      />
    </div>
  )
}

export { ChatMobileGeminiBackground }
