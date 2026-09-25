"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

/** Cap how often typewriter paints — avoids React 19 nested-update false positives
 *  when each frame re-renders expensive chat chrome (markdown, scroll effects). */
const TYPEWRITER_MIN_EMIT_MS = 40
const TYPEWRITER_MIN_CHAR_STEP = 12

function TypingDots({ className }: { className?: string }) {
  const t = useTranslations("workspace")
  return (
    <span
      className={cn("chat-typing-dots inline-flex items-center gap-1 px-0.5", className)}
      aria-label={t("assistantTyping")}
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
  let lastCount = 0
  let lastEmitAt = 0

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
      const due =
        t >= 1 ||
        count - lastCount >= TYPEWRITER_MIN_CHAR_STEP ||
        now - lastEmitAt >= TYPEWRITER_MIN_EMIT_MS

      if (due && count !== lastCount) {
        lastCount = count
        lastEmitAt = now
        onUpdate(text.slice(0, count))
      }

      if (t < 1) {
        window.requestAnimationFrame(tick)
      } else {
        if (lastCount !== text.length) {
          onUpdate(text)
        }
        resolve()
      }
    }
    window.requestAnimationFrame(tick)
  })
}

export { TypingDots, typewriterReveal }
