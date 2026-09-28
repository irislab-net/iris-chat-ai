"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

/** ~60fps paints — plain text while streaming stays cheap. */
const TYPEWRITER_MIN_EMIT_MS = 16
/** Cap per frame: fast catch-up without dumping a whole paragraph. */
const TYPEWRITER_MAX_CHARS_PER_FRAME = 14

function TypingDots({ className }: { className?: string }) {
  const t = useTranslations("workspace")
  return (
    <span
      className={cn(
        "chat-typing-dots inline-flex items-center gap-1 px-0.5",
        className
      )}
      aria-label={t("assistantTyping")}
      role="status"
    >
      <span />
      <span />
      <span />
    </span>
  )
}

/** Near-linear with a tiny ease — quick and even, no opening burst. */
function easeType(t: number) {
  return t * (2 - t) * 0.15 + t * 0.85
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

  // Fast: ~5.5ms/char, short floor, hard ceiling for long answers.
  const targetMs = Math.min(1800, Math.max(280, text.length * 5.5))
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

      const elapsed = now - start
      const t = Math.min(1, elapsed / targetMs)
      const idealCount =
        t >= 1
          ? text.length
          : Math.max(1, Math.floor(easeType(t) * text.length))

      const remaining = Math.max(0, text.length - lastCount)
      const remainingMs = Math.max(
        TYPEWRITER_MIN_EMIT_MS,
        t >= 1
          ? TYPEWRITER_MIN_EMIT_MS * Math.max(1, remaining)
          : targetMs - elapsed
      )
      const framesLeft = Math.max(1, remainingMs / TYPEWRITER_MIN_EMIT_MS)
      const adaptiveStep = Math.min(
        TYPEWRITER_MAX_CHARS_PER_FRAME,
        Math.max(1, Math.ceil(remaining / framesLeft))
      )

      const count = Math.min(
        text.length,
        Math.max(lastCount, Math.min(idealCount, lastCount + adaptiveStep))
      )

      if (
        count > lastCount &&
        (lastEmitAt === 0 || now - lastEmitAt >= TYPEWRITER_MIN_EMIT_MS)
      ) {
        lastCount = count
        lastEmitAt = now
        onUpdate(text.slice(0, count))
      }

      if (lastCount < text.length) {
        window.requestAnimationFrame(tick)
      } else {
        resolve()
      }
    }
    window.requestAnimationFrame(tick)
  })
}

export { TypingDots, typewriterReveal }
