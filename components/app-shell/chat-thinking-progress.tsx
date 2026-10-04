"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import {
  chatThinkingDotsClass,
  chatThinkingLabelClass,
  chatThinkingRowClass,
  chatThinkingShellClass,
  chatThinkingShimmerClass,
} from "@/components/app-shell/chat-thinking-styles"
import { TypingDots } from "@/components/app-shell/chat-typing"
import {
  CHAT_MOTION,
  loadChatGsap,
  prefersChatReducedMotion,
} from "@/lib/chat-motion"
import { cn } from "@/lib/utils"

export const THINKING_TERMINAL_LINE_KEYS = [
  "orderBooks",
  "headlines",
  "atr",
  "rewardRisk",
] as const

export type ThinkingTerminalLineKey =
  (typeof THINKING_TERMINAL_LINE_KEYS)[number]

/** Cadence between GSAP line crossfades — readable, not twitchy. */
const LINE_ROTATE_MS = 1600
const LINE_OUT_DURATION = 0.22
const LINE_IN_DURATION = 0.34
const LINE_SHIFT_Y = 10

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
 * Pre-trace waiting UI — same shell as Thought process, with a GSAP
 * crossfade of cosmetic status lines until SSE thinking steps arrive.
 */
function ChatThinkingTerminal({ className }: ChatThinkingTerminalProps) {
  const t = useTranslations("workspace.thinkingTerminal")
  const shellRef = React.useRef<HTMLDivElement>(null)
  const outgoingRef = React.useRef<HTMLSpanElement>(null)
  const incomingRef = React.useRef<HTMLSpanElement>(null)
  const orderRef = React.useRef<ThinkingTerminalLineKey[]>([])
  const orderAtRef = React.useRef(0)
  const tweenRef = React.useRef<{ kill: () => void } | null>(null)
  const startedAtRef = React.useRef(0)
  const [activeKey, setActiveKey] = React.useState<ThinkingTerminalLineKey>(
    THINKING_TERMINAL_LINE_KEYS[0]
  )
  const [elapsedSec, setElapsedSec] = React.useState(1)

  const labelFor = React.useCallback(
    (key: ThinkingTerminalLineKey) => t(`lines.${key}`),
    [t]
  )

  React.useEffect(() => {
    startedAtRef.current = Date.now()
    const id = window.setInterval(() => {
      setElapsedSec(
        Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
      )
    }, 250)
    return () => window.clearInterval(id)
  }, [])

  React.useEffect(() => {
    orderRef.current = shuffleLineKeys()
    orderAtRef.current = 0
    const first = orderRef.current[0] ?? THINKING_TERMINAL_LINE_KEYS[0]
    setActiveKey(first)

    const outgoing = outgoingRef.current
    const incoming = incomingRef.current
    if (outgoing) outgoing.textContent = labelFor(first)
    if (incoming) incoming.textContent = ""

    if (prefersChatReducedMotion()) {
      const timer = window.setInterval(() => {
        orderAtRef.current =
          (orderAtRef.current + 1) % orderRef.current.length
        const next =
          orderRef.current[orderAtRef.current] ?? THINKING_TERMINAL_LINE_KEYS[0]
        setActiveKey(next)
        if (outgoingRef.current) {
          outgoingRef.current.textContent = labelFor(next)
        }
      }, LINE_ROTATE_MS)
      return () => window.clearInterval(timer)
    }

    let cancelled = false
    let rotateTimer = 0
    let startTimer = 0

    void loadChatGsap().then((gsap) => {
      if (cancelled) return

      const outEl = outgoingRef.current
      const inEl = incomingRef.current
      if (!outEl || !inEl) return

      gsap.set(outEl, { y: 0, autoAlpha: 1, force3D: true })
      gsap.set(inEl, { y: LINE_SHIFT_Y, autoAlpha: 0, force3D: true })

      const crossfade = () => {
        const out = outgoingRef.current
        const inn = incomingRef.current
        if (!out || !inn) return

        orderAtRef.current =
          (orderAtRef.current + 1) % orderRef.current.length
        const next =
          orderRef.current[orderAtRef.current] ?? THINKING_TERMINAL_LINE_KEYS[0]
        const nextLabel = labelFor(next)

        inn.textContent = nextLabel
        gsap.set(inn, { y: LINE_SHIFT_Y, autoAlpha: 0 })

        tweenRef.current?.kill()
        const tl = gsap.timeline({
          defaults: { force3D: true, overwrite: "auto" },
          onComplete: () => {
            out.textContent = nextLabel
            gsap.set(out, { y: 0, autoAlpha: 1 })
            gsap.set(inn, { y: LINE_SHIFT_Y, autoAlpha: 0 })
            inn.textContent = ""
            setActiveKey(next)
          },
        })

        tl.to(
          out,
          {
            y: -LINE_SHIFT_Y,
            autoAlpha: 0,
            duration: LINE_OUT_DURATION,
            ease: CHAT_MOTION.easeIn,
          },
          0
        )
        tl.to(
          inn,
          {
            y: 0,
            autoAlpha: 1,
            duration: LINE_IN_DURATION,
            ease: CHAT_MOTION.ease,
          },
          0.06
        )

        tweenRef.current = tl
      }

      // First swap after a beat so the initial line can be read.
      startTimer = window.setTimeout(() => {
        if (cancelled) return
        crossfade()
        rotateTimer = window.setInterval(crossfade, LINE_ROTATE_MS)
      }, LINE_ROTATE_MS)
    })

    return () => {
      cancelled = true
      window.clearTimeout(startTimer)
      window.clearInterval(rotateTimer)
      tweenRef.current?.kill()
      tweenRef.current = null
    }
  }, [labelFor])

  React.useEffect(() => {
    const shell = shellRef.current
    if (!shell || prefersChatReducedMotion()) return

    let cancelled = false
    void loadChatGsap().then((gsap) => {
      if (cancelled || !shellRef.current) return
      gsap.fromTo(
        shellRef.current,
        { autoAlpha: 0, y: 6 },
        {
          autoAlpha: 1,
          y: 0,
          duration: CHAT_MOTION.threadDuration,
          ease: CHAT_MOTION.ease,
          overwrite: true,
        }
      )
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      ref={shellRef}
      className={cn(chatThinkingShellClass, className)}
      role="status"
      aria-live="polite"
      aria-label={t("aria")}
      data-thinking-terminal=""
    >
      <div className={chatThinkingRowClass}>
        <TypingDots decorative className={chatThinkingDotsClass} />
        <span className="relative block min-h-5 min-w-0 flex-1 overflow-hidden">
          <span
            ref={outgoingRef}
            className={cn(
              chatThinkingLabelClass,
              chatThinkingShimmerClass,
              "absolute inset-x-0 top-0"
            )}
          >
            {labelFor(activeKey)}
          </span>
          <span
            ref={incomingRef}
            className={cn(
              chatThinkingLabelClass,
              chatThinkingShimmerClass,
              "absolute inset-x-0 top-0"
            )}
            aria-hidden
          />
          {/* Reserve layout height while labels are absolutely positioned. */}
          <span className={cn(chatThinkingLabelClass, "invisible")} aria-hidden>
            {labelFor(activeKey)}
          </span>
        </span>
        <span
          className="shrink-0 tabular-nums text-[12px] text-muted-foreground/70"
          aria-hidden
        >
          {elapsedSec}s
        </span>
      </div>
    </div>
  )
}

/** @deprecated Prefer ChatThinkingTerminal — kept for any stale imports. */
const ChatThinkingProgress = ChatThinkingTerminal

export { ChatThinkingTerminal, ChatThinkingProgress }
