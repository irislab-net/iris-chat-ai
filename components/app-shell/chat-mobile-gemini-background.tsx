"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const GEMINI_BG_PALETTES = ["mint", "sky", "aqua"] as const

type GeminiBgPalette = (typeof GEMINI_BG_PALETTES)[number]

function pickGeminiPalette(): GeminiBgPalette {
  return GEMINI_BG_PALETTES[
    Math.floor(Math.random() * GEMINI_BG_PALETTES.length)
  ]!
}

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
  const [palette] = React.useState<GeminiBgPalette>(pickGeminiPalette)

  return (
    <div
      aria-hidden
      data-gemini-palette={palette}
      className={cn(
        "chat-gemini-bg pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-background" />
      <div className="chat-gemini-bg-top-fade absolute inset-x-0 top-0 h-[42%]" />
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
          "chat-gemini-dots absolute inset-x-0 bottom-0 h-[48%]",
          active && "chat-gemini-dots-active",
          loading && "chat-gemini-dots-loading"
        )}
      />
    </div>
  )
}

export { ChatMobileGeminiBackground }
