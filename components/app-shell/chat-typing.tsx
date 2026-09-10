"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function TypingDots({ className }: { className?: string }) {
  return (
    <span
      className={cn("chat-typing-dots inline-flex items-center gap-1 px-0.5", className)}
      aria-label="Assistant is typing"
      role="status"
    >
      <span />
      <span />
      <span />
    </span>
  )
}

async function typewriterReveal(
  text: string,
  onUpdate: (partial: string) => void,
  signal?: AbortSignal
) {
  if (!text) {
    onUpdate(text)
    return
  }

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  if (reduced || signal?.aborted) {
    onUpdate(text)
    return
  }

  // Keep long answers readable without waiting forever
  const targetMs = Math.min(4200, Math.max(900, text.length * 10))
  const start = performance.now()

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      if (signal?.aborted) {
        onUpdate(text)
        resolve()
        return
      }
      const t = Math.min(1, (now - start) / targetMs)
      const eased = 1 - (1 - t) * (1 - t)
      const count = Math.max(1, Math.floor(eased * text.length))
      onUpdate(text.slice(0, count))
      if (t < 1) {
        window.requestAnimationFrame(tick)
      } else {
        onUpdate(text)
        resolve()
      }
    }
    window.requestAnimationFrame(tick)
  })
}

export { TypingDots, typewriterReveal }
