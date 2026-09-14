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
        "chat-gemini-bg pointer-events-none absolute inset-0 overflow-hidden",
        intro && "chat-gemini-bg-intro",
        active && "chat-gemini-bg-active",
        loading && "chat-gemini-bg-loading",
        className
      )}
    >
      <div className="absolute inset-0 bg-background" />
      <div className="chat-gemini-bg-top-fade absolute inset-x-0 top-0 h-[42%]" />
      <div
        className={cn("chat-gemini-mesh absolute inset-0", intro && "chat-gemini-mesh-intro")}
      >
        <div className="chat-gemini-orb chat-gemini-orb-a" />
        <div className="chat-gemini-orb chat-gemini-orb-b" />
        <div className="chat-gemini-orb chat-gemini-orb-c" />
        <div className="chat-gemini-orb chat-gemini-orb-d" />
      </div>
      <div className="chat-gemini-pattern absolute inset-x-0 bottom-0 h-[52%]">
        <div
          className={cn(
            "chat-gemini-grid absolute inset-0",
            active && "chat-gemini-grid-active",
            loading && "chat-gemini-grid-loading"
          )}
        />
        <div
          className={cn(
            "chat-gemini-dots absolute inset-0",
            active && "chat-gemini-dots-active",
            loading && "chat-gemini-dots-loading"
          )}
        />
      </div>
    </div>
  )
}

export { ChatMobileGeminiBackground }
