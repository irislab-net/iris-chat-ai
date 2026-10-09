"use client"

import * as React from "react"

import { syncBrowserChromeTheme } from "@/lib/browser-chrome"
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

  // Retint iOS Safari / Android chrome as soon as the wash mounts — layout-level
  // BrowserChromeSync often runs before this node exists and leaves a white bar.
  React.useLayoutEffect(() => {
    if (!visible || isHero) return
    syncBrowserChromeTheme(undefined)
  }, [visible, isHero, tone])

  if (!isHero) {
    return (
      <div
        aria-hidden
        className={cn(
          "chat-gemini-bg pointer-events-none absolute inset-0 overflow-hidden",
          isBlue && "chat-gemini-bg-blue",
          visible ? "chat-gemini-bg-visible" : "chat-gemini-bg-hidden",
          active && "chat-gemini-bg-active",
          loading && "chat-gemini-bg-loading",
          className
        )}
      >
        <div className="absolute inset-0 bg-background" />
        <div className="chat-gemini-horizon">
          <div
            className={cn(
              "chat-gemini-horizon-rise",
              intro && "chat-gemini-horizon-intro"
            )}
          >
            {/* Soft full-bleed wash — no circular dome rim / seam. */}
            <div className="chat-gemini-horizon-dome" />
            <div className="chat-gemini-horizon-glow" />
            <div className="chat-gemini-horizon-sheen" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      aria-hidden
      className={cn(
        "chat-gemini-bg chat-gemini-bg-hero pointer-events-none absolute inset-0 overflow-hidden",
        isBlue && "chat-gemini-bg-blue",
        visible ? "chat-gemini-bg-visible" : "chat-gemini-bg-hidden",
        "chat-gemini-bg-active",
        loading && "chat-gemini-bg-loading",
        className
      )}
    >
      <div className="absolute inset-0 bg-linear-to-b from-white via-[#FAFBFC] to-[#F1F5F9] dark:from-background dark:via-background dark:to-card" />
      <div
        className={cn(
          "absolute inset-x-0 top-0 bg-linear-to-b from-white via-white/85 to-transparent dark:from-background dark:via-background/80",
          isBlue ? "h-[24%] sm:h-[28%]" : "h-[28%] sm:h-[32%]"
        )}
      />
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
          "chat-gemini-pattern absolute inset-0",
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
        </>
      ) : null}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent via-white/70 to-white dark:via-background/70 dark:to-background",
          isBlue ? "h-[30%] sm:h-[34%]" : "h-[36%] sm:h-[40%]"
        )}
      />
    </div>
  )
}

export { ChatMobileGeminiBackground }
