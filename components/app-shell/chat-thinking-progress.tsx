"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

export const THINKING_TERMINAL_LINE_KEYS = [
  "orderBooks",
  "headlines",
  "atr",
  "rewardRisk",
] as const

export type ThinkingTerminalLineKey =
  (typeof THINKING_TERMINAL_LINE_KEYS)[number]

/** Cosmetic pre-trace cadence — fast enough to feel live, slow enough to read. */
const LINE_ROTATE_MS = 600
const MAX_VISIBLE_LINES = 3

function shuffleLineKeys(): ThinkingTerminalLineKey[] {
  const keys = [...THINKING_TERMINAL_LINE_KEYS]
  for (let i = keys.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = keys[i]!
    keys[i] = keys[j]!
    keys[j] = a
  }
  return keys
}

type ChatThinkingTerminalProps = {
  className?: string
}

/**
 * Pre-trace waiting UI — cosmetic terminal lines while SSE thinking steps
 * have not arrived yet. Parent must unmount when `hasThinking` becomes true.
 */
type TerminalLine = {
  id: number
  key: ThinkingTerminalLineKey
}

function ChatThinkingTerminal({ className }: ChatThinkingTerminalProps) {
  const t = useTranslations("workspace.thinkingTerminal")
  const [lines, setLines] = React.useState<TerminalLine[]>(() => [
    { id: 0, key: THINKING_TERMINAL_LINE_KEYS[0] },
  ])
  const orderRef = React.useRef<ThinkingTerminalLineKey[]>([])
  const orderAtRef = React.useRef(0)
  const lineIdRef = React.useRef(0)

  React.useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    orderRef.current = shuffleLineKeys()
    orderAtRef.current = 0
    lineIdRef.current = 0
    const first = orderRef.current[0] ?? THINKING_TERMINAL_LINE_KEYS[0]
    setLines([{ id: 0, key: first }])

    if (reduced) return

    const timer = window.setInterval(() => {
      orderAtRef.current =
        (orderAtRef.current + 1) % orderRef.current.length
      const next =
        orderRef.current[orderAtRef.current] ?? THINKING_TERMINAL_LINE_KEYS[0]
      lineIdRef.current += 1
      const entry: TerminalLine = { id: lineIdRef.current, key: next }
      setLines((prev) => [...prev, entry].slice(-MAX_VISIBLE_LINES))
    }, LINE_ROTATE_MS)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className={cn(
        "flex h-[4.125rem] w-full max-w-xs flex-col justify-end gap-1 overflow-hidden py-0.5",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={t("aria")}
    >
      {lines.map((line, index) => {
        const isLatest = index === lines.length - 1
        return (
          <p
            key={line.id}
            className={cn(
              "flex min-h-5 items-center gap-1.5 truncate font-mono text-[12px] leading-5 tracking-tight",
              isLatest
                ? "text-muted-foreground/75"
                : "text-muted-foreground/40",
              isLatest &&
                "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300"
            )}
          >
            <span
              className={cn(
                "shrink-0 select-none",
                isLatest ? "text-sky-500/70 dark:text-sky-400/65" : "opacity-50"
              )}
              aria-hidden
            >
              ›
            </span>
            <span className="min-w-0 truncate">{t(`lines.${line.key}`)}</span>
          </p>
        )
      })}
    </div>
  )
}

/** @deprecated Prefer ChatThinkingTerminal — kept for any stale imports. */
const ChatThinkingProgress = ChatThinkingTerminal

export { ChatThinkingTerminal, ChatThinkingProgress }
