"use client"

import { cn } from "@/lib/utils"

type ChatMobileGeminiBackgroundProps = {
  visible?: boolean
  active?: boolean
  loading?: boolean
  intro?: boolean
  /** `hero` — landing hero card; fills the frame with the same dot mesh as chat. */
  variant?: "chat" | "hero"
  /** `blue` — liquid glass brand blue; watery wobble, no hue cycle. */
  tone?: "blue"
  className?: string
}

function ChatMobileGeminiBackground({
  visible = true,
  active = false,
  loading = false,
  intro = false,
  variant = "chat",
  tone,
  className,
}: ChatMobileGeminiBackgroundProps) {
  const isHero = variant === "hero"
  const isBlue = tone === "blue"
  const dotsActive = active || isHero

  return (
    <div
      aria-hidden
      className={cn(
        "chat-gemini-bg pointer-events-none absolute inset-0 overflow-hidden",
        isHero && "chat-gemini-bg-hero",
        isBlue && "chat-gemini-bg-blue",
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
            ? "bg-linear-to-b from-white via-[#FAFBFC] to-[#F1F5F9] dark:from-background dark:via-background dark:to-card"
            : "bg-[oklch(0.975_0_0)] dark:bg-background"
        )}
      />
      {isHero ? (
        <div
          className={cn(
            "absolute inset-x-0 top-0 bg-linear-to-b from-white via-white/85 to-transparent dark:from-background dark:via-background/80",
            isBlue ? "h-[24%] sm:h-[28%]" : "h-[28%] sm:h-[32%]"
          )}
        />
      ) : (
        <div className="chat-gemini-bg-top-fade absolute inset-x-0 top-0 h-[42%]" />
      )}
      <div
        className={cn(
          "chat-gemini-mesh absolute inset-0",
          intro && "chat-gemini-mesh-intro"
        )}
      >
        <div className="chat-gemini-orb chat-gemini-orb-a" />
        <div className="chat-gemini-orb chat-gemini-orb-b" />
        <div className="chat-gemini-orb chat-gemini-orb-c" />
        <div className="chat-gemini-orb chat-gemini-orb-d" />
        {isBlue ? (
          <>
            <div className="chat-gemini-orb chat-gemini-orb-e" />
            <div className="chat-gemini-orb chat-gemini-orb-f" />
          </>
        ) : null}
      </div>
      <div
        className={cn(
          "chat-gemini-pattern absolute",
          isHero ? "inset-0" : isBlue ? "inset-x-0 bottom-0 h-[58%]" : "inset-x-0 bottom-0 h-[52%]",
          dotsActive && "chat-gemini-pattern-active",
          loading && "chat-gemini-pattern-loading"
        )}
      >
        <div className="chat-gemini-dots chat-gemini-dots-layer-a absolute inset-0" />
        <div className="chat-gemini-dots chat-gemini-dots-layer-b absolute inset-0" />
        <div className="chat-gemini-dots chat-gemini-dots-layer-c absolute inset-0" />
      </div>
      {isBlue ? (
        <>
          <div className="chat-gemini-glass-plate absolute inset-0" />
          <div className="chat-gemini-glass-sheen absolute inset-y-0 left-[-20%] w-[55%]" />
          <div className="chat-gemini-glass-rim absolute inset-x-[12%] top-0 h-px" />
        </>
      ) : null}
      {isHero ? (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent via-white/70 to-white dark:via-background/70 dark:to-background",
            isBlue ? "h-[30%] sm:h-[34%]" : "h-[36%] sm:h-[40%]"
          )}
        />
      ) : (
        <div className="chat-gemini-bg-bottom-fade absolute inset-x-0 bottom-0 h-[40%]" />
      )}
    </div>
  )
}

export { ChatMobileGeminiBackground }
