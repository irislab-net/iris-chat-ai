"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export const THINKING_STATUS_KEYS = [
  "thinking",
  "analyzing",
  "weighing",
  "synthesizing",
  "concluding",
] as const

export type ThinkingStatusKey = (typeof THINKING_STATUS_KEYS)[number]

/** Minimum time the thinking UI stays up so fast replies still feel deliberate. */
const MIN_THINKING_MS = 2200
const STATUS_ROTATE_MS = 2000
const COMPLETE_HOLD_MS = 280

function shuffleStatusKeys(): ThinkingStatusKey[] {
  const keys = [...THINKING_STATUS_KEYS]
  for (let i = keys.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = keys[i]!
    keys[i] = keys[j]!
    keys[j] = a
  }
  return keys
}

type ChatThinkingProgressProps = {
  /** True once the model reply is ready — bar finishes, then onComplete. */
  ready: boolean
  onComplete: () => void
  className?: string
}

function ChatThinkingProgress({
  ready,
  onComplete,
  className,
}: ChatThinkingProgressProps) {
  const t = useTranslations("workspace.thinkingProgress")
  const [value, setValue] = React.useState(5)
  const [statusKey, setStatusKey] =
    React.useState<ThinkingStatusKey>("thinking")
  const onCompleteRef = React.useRef(onComplete)
  const readyRef = React.useRef(ready)

  React.useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  React.useEffect(() => {
    readyRef.current = ready
  }, [ready])

  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0
    let startRotateTimer = 0
    let rotateTimer = 0
    let completeTimer = 0
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      window.cancelAnimationFrame(raf)
      window.clearTimeout(startRotateTimer)
      window.clearInterval(rotateTimer)
      setValue(100)
      completeTimer = window.setTimeout(() => {
        onCompleteRef.current()
      }, reduced ? 0 : COMPLETE_HOLD_MS)
    }

    if (reduced) {
      completeTimer = window.setTimeout(finish, 0)
      return () => {
        finished = true
        window.clearTimeout(completeTimer)
      }
    }

    const order = shuffleStatusKeys()
    let orderAt = 0
    const start = performance.now()

    startRotateTimer = window.setTimeout(() => {
      setStatusKey(order[0] ?? "thinking")
      rotateTimer = window.setInterval(() => {
        if (finished || readyRef.current) return
        orderAt = (orderAt + 1) % order.length
        setStatusKey(order[orderAt] ?? "thinking")
      }, STATUS_ROTATE_MS)
    }, 0)

    const tick = (now: number) => {
      if (finished) return
      const elapsed = now - start
      const isReady = readyRef.current

      if (isReady && elapsed >= MIN_THINKING_MS) {
        finish()
        return
      }

      if (isReady) {
        const progress = Math.min(1, elapsed / MIN_THINKING_MS)
        setValue(Math.round(12 + progress * 86))
      } else {
        const progress = 1 - Math.exp(-elapsed / 11_000)
        setValue(Math.round(5 + progress * 85))
      }

      raf = window.requestAnimationFrame(tick)
    }

    raf = window.requestAnimationFrame(tick)

    return () => {
      finished = true
      window.cancelAnimationFrame(raf)
      window.clearTimeout(startRotateTimer)
      window.clearInterval(rotateTimer)
      window.clearTimeout(completeTimer)
    }
  }, [])

  return (
    <div
      className={cn("flex w-full max-w-xs flex-col gap-2.5 py-0.5", className)}
      role="status"
      aria-live="polite"
      aria-label={t("aria")}
    >
      <p className="min-h-5 text-sm leading-5 text-muted-foreground">
        {t(`statuses.${statusKey}`)}
      </p>
      <Progress value={value} className="w-full gap-0" />
    </div>
  )
}

export { ChatThinkingProgress }
