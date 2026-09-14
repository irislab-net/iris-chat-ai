"use client"

import { cn } from "@/lib/utils"

type ChatMobileGeminiBackgroundProps = {
  visible?: boolean
  active?: boolean
  loading?: boolean
  intro?: boolean
  className?: string
}

function ChatMobileGeminiBackground({
  visible = true,
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
        visible ? "chat-gemini-bg-visible" : "chat-gemini-bg-hidden",
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
      <div
        className={cn(
          "chat-gemini-pattern absolute inset-x-0 bottom-0 h-[52%]",
          active && "chat-gemini-pattern-active",
          loading && "chat-gemini-pattern-loading"
        )}
      >
        <div className="chat-gemini-dots chat-gemini-dots-layer-a absolute inset-0" />
        <div className="chat-gemini-dots chat-gemini-dots-layer-b absolute inset-0" />
        <div className="chat-gemini-dots chat-gemini-dots-layer-c absolute inset-0" />
      </div>
    </div>
  )
}

export { ChatMobileGeminiBackground }
