"use client"

import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"

import "@/app/styles/chat-gemini.css"

/** Gemini dot mesh + orbs — same system as chat, clipped to the hero card. */
export function HeroLiquidGlassBg({
  /** `blue` — liquid glass brand blue; watery wobble, no hue cycle. */
  tone,
}: {
  tone?: "blue"
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
    >
      <ChatMobileGeminiBackground
        variant="hero"
        visible
        active
        intro
        tone={tone}
      />
      {/*
        Soft frost wash only — no second backdrop-filter.
        The outer hero shell already blurs; stacking another blur + 1px rim
        was painting hard fringes and “cut” corners on mobile.
      */}
      <div className="absolute inset-0 bg-white/8 dark:bg-black/12" />
    </div>
  )
}
