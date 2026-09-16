"use client"

import { cn } from "@/lib/utils"

type ChatMobileGeminiBackgroundProps = {
  visible?: boolean
  active?: boolean
  loading?: boolean
  intro?: boolean
  /** `hero` — landing hero card; fills the frame with the same dot mesh as chat. */
  variant?: "chat" | "hero"
  className?: string
}

function ChatMobileGeminiBackground({
  visible = true,
  active = false,
  loading = false,
  intro = false,
  variant = "chat",
  className,
}: ChatMobileGeminiBackgroundProps) {
  const isHero = variant === "hero"
  const dotsActive = active || isHero

  return (
    <div
      aria-hidden
      className={cn(
        "chat-gemini-bg pointer-events-none absolute inset-0 overflow-hidden",
        isHero && "chat-gemini-bg-hero",
        visible ? "chat-gemini-bg-visible" : "chat-gemini-bg-hidden",
        (active || isHero) && "chat-gemini-bg-active",
        loading && "chat-gemini-bg-loading",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          isHero
            ? "bg-linear-to-b from-white via-[#FAFBFC] to-[#F1F5F9]"
            : "bg-background"
        )}
      />
      {isHero ? (
        <div
          className="absolute inset-x-0 top-0 h-[42%] bg-linear-to-b from-white via-white/90 to-transparent"
        />
      ) : (
        <div className="chat-gemini-bg-top-fade absolute inset-x-0 top-0 h-[42%]" />
      )}
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
          "chat-gemini-pattern absolute",
          isHero ? "inset-0" : "inset-x-0 bottom-0 h-[52%]",
          dotsActive && "chat-gemini-pattern-active",
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
