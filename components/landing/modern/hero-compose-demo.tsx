"use client"

import { useReducedMotion } from "motion/react"
import { ArrowUpIcon, SquareIcon } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HERO, HERO_DEMO_EXCHANGES } from "@/lib/landing-modern-data"
import {
  landingGlassBubbleAi,
  landingGlassBubbleThinking,
  landingGlassBubbleUser,
  landingGlassPill,
  landingHeroComposeGrid,
} from "@/lib/landing-modern-styles"
import { buildLandingChatHref } from "@/lib/landing-chat-handoff"
import { cn } from "@/lib/utils"

const QUESTION_CHAR_MS = 38
const ANSWER_CHAR_MS = 22
const PAUSE_BEFORE_SEND_MS = 360
const PAUSE_BEFORE_ANSWER_MS = 720
const HOLD_AFTER_ANSWER_MS = 4200
const FADE_OUT_MS = 420

type DemoPhase =
  | "typing-question"
  | "thinking"
  | "typing-answer"
  | "hold"
  | "fading"

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function pickRandomScenarioIndex(exclude?: number) {
  const count = HERO_DEMO_EXCHANGES.length
  if (count <= 1) return 0
  let index = Math.floor(Math.random() * count)
  while (index === exclude) {
    index = Math.floor(Math.random() * count)
  }
  return index
}

function GlassSheen({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.18)_38%,rgba(255,255,255,0.04)_62%,rgba(255,255,255,0)_100%)]",
        className
      )}
    />
  )
}

export function HeroComposeDemo() {
  const router = useRouter()
  const reducedMotion = useReducedMotion()

  const [userQuery, setUserQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [composerDraft, setComposerDraft] = useState("")
  const [userBubbleText, setUserBubbleText] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [phase, setPhase] = useState<DemoPhase>("typing-question")
  const [scenarioIndex, setScenarioIndex] = useState(() => pickRandomScenarioIndex())
  const runIdRef = useRef(0)

  const demoActive = !isFocused && userQuery.length === 0
  const exchange = HERO_DEMO_EXCHANGES[scenarioIndex]

  const isStreaming =
    phase === "thinking" || phase === "typing-answer" || phase === "hold"
  const showUserBubble = userBubbleText !== null
  const showAnswerBubble =
    (phase === "typing-answer" || phase === "hold") && answerText.length > 0
  const showChat = phase !== "fading"
  const showThinking = phase === "thinking"
  const isTypingAnswer = phase === "typing-answer" && answerText.length < exchange.answer.length

  const composerValue = demoActive
    ? phase === "typing-question"
      ? composerDraft
      : ""
    : userQuery

  const enterInteractiveMode = useCallback(() => {
    runIdRef.current += 1
    setComposerDraft("")
    setUserBubbleText(null)
    setAnswerText("")
    setPhase("typing-question")
  }, [])

  const stopDemo = useCallback(() => {
    enterInteractiveMode()
    setScenarioIndex((current) => pickRandomScenarioIndex(current))
  }, [enterInteractiveMode])

  const handleSend = useCallback(() => {
    const q = composerValue.trim()
    if (!q) return

    if (!demoActive) {
      router.push(buildLandingChatHref(q))
      return
    }

    setUserBubbleText(q)
    setComposerDraft("")
    setAnswerText("")
    setPhase("thinking")
  }, [composerValue, demoActive, router])

  const handleAction = useCallback(() => {
    if (isStreaming) {
      stopDemo()
      return
    }
    handleSend()
  }, [handleSend, isStreaming, stopDemo])

  useEffect(() => {
    if (!demoActive) return

    const runId = ++runIdRef.current
    const isStale = () => runId !== runIdRef.current

    async function runDemo() {
      setComposerDraft("")
      setUserBubbleText(null)
      setAnswerText("")
      setPhase("typing-question")

      if (reducedMotion) {
        setComposerDraft(exchange.question)
        await sleep(PAUSE_BEFORE_SEND_MS)
        if (isStale()) return
        setUserBubbleText(exchange.question)
        setComposerDraft("")
        setPhase("thinking")
        await sleep(PAUSE_BEFORE_ANSWER_MS)
        if (isStale()) return
        setPhase("typing-answer")
        setAnswerText(exchange.answer)
        setPhase("hold")
        await sleep(HOLD_AFTER_ANSWER_MS)
        if (isStale()) return
        setPhase("fading")
        await sleep(FADE_OUT_MS)
        if (isStale()) return
        setScenarioIndex((current) => pickRandomScenarioIndex(current))
        return
      }

      for (let i = 1; i <= exchange.question.length; i++) {
        if (isStale()) return
        setComposerDraft(exchange.question.slice(0, i))
        await sleep(QUESTION_CHAR_MS)
      }

      await sleep(PAUSE_BEFORE_SEND_MS)
      if (isStale()) return
      setUserBubbleText(exchange.question)
      setComposerDraft("")
      setPhase("thinking")

      await sleep(PAUSE_BEFORE_ANSWER_MS)
      if (isStale()) return
      setPhase("typing-answer")

      for (let i = 1; i <= exchange.answer.length; i++) {
        if (isStale()) return
        setAnswerText(exchange.answer.slice(0, i))
        await sleep(ANSWER_CHAR_MS)
      }

      setPhase("hold")
      await sleep(HOLD_AFTER_ANSWER_MS)
      if (isStale()) return

      setPhase("fading")
      await sleep(FADE_OUT_MS)
      if (isStale()) return

      setScenarioIndex((current) => pickRandomScenarioIndex(current))
    }

    void runDemo()

    return () => {
      runIdRef.current += 1
    }
  }, [demoActive, exchange, reducedMotion, scenarioIndex])

  const userVisible = showChat && showUserBubble && Boolean(userBubbleText)
  const thinkingVisible = showChat && showThinking
  const answerVisible = showChat && showAnswerBubble

  return (
    <div
      className="mx-auto w-full max-w-lg lg:max-w-2xl"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className={cn(landingHeroComposeGrid, "isolate overflow-visible")}>
        {/* Slot 1 — user (fixed height, opacity only) */}
        <div className="flex h-full min-h-0 items-end justify-end overflow-visible px-1 pb-1 pt-1">
          <div
            className={cn(
              "min-w-0 max-w-full transition-opacity duration-300 sm:max-w-[85%]",
              userVisible ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            aria-hidden={!userVisible}
          >
            <div className={cn("px-4 py-2.5 sm:px-5 sm:py-3", landingGlassBubbleUser)}>
              <GlassSheen />
              <p className="relative z-10 line-clamp-2 text-left text-[0.8125rem] font-normal leading-snug text-[#0F172A] sm:text-base">
                {userBubbleText ?? "\u00A0"}
              </p>
            </div>
          </div>
        </div>

        {/* Slot 2 — thinking + answer share one fixed box */}
        <div className="relative isolate h-full min-h-0 overflow-visible px-1 py-0.5">
          <div
            className={cn(
              "absolute inset-0 z-0 flex items-start gap-2 overflow-visible transition-opacity duration-300 sm:gap-3",
              thinkingVisible
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            )}
            aria-hidden={!thinkingVisible}
          >
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-[#94A3B8]" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className={cn("inline-flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3", landingGlassBubbleThinking)}>
                <GlassSheen />
                <span className="relative z-10 size-1.5 animate-pulse rounded-full bg-[#94A3B8]/80 [animation-delay:0ms]" />
                <span className="relative z-10 size-1.5 animate-pulse rounded-full bg-[#94A3B8]/80 [animation-delay:150ms]" />
                <span className="relative z-10 size-1.5 animate-pulse rounded-full bg-[#94A3B8]/80 [animation-delay:300ms]" />
              </div>
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 z-10 flex items-start gap-2 overflow-visible transition-opacity duration-300 sm:gap-3",
              answerVisible
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            )}
            aria-hidden={!answerVisible}
          >
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-[#94A3B8]" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className={cn("w-full px-4 py-2.5 sm:px-5 sm:py-3", landingGlassBubbleAi)}>
                <GlassSheen />
                <p className="relative z-10 mb-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.25em] text-[#94A3B8] sm:mb-1">
                  Exur
                </p>
                <p className="relative z-10 line-clamp-4 text-left text-[0.8125rem] font-normal leading-snug text-[#64748B] sm:text-base sm:leading-relaxed">
                  {answerText}
                  {isTypingAnswer && (
                    <span
                      className="ml-0.5 inline-block h-[1.1em] w-0.5 animate-pulse bg-[#94A3B8] align-[-2px]"
                      aria-hidden
                    />
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Slot 3 — composer (fixed height) */}
        <div
          className={cn(
            "relative z-30 flex h-full min-h-0 shrink-0 items-center gap-2 overflow-visible px-2 py-2 sm:gap-2 sm:px-3 sm:py-2",
            landingGlassPill
          )}
        >
        <GlassSheen className="rounded-full" />
        <Input
          value={composerValue}
          onChange={(e) => {
            if (demoActive) enterInteractiveMode()
            setIsFocused(true)
            setUserQuery(e.target.value)
          }}
          onFocus={() => {
            setIsFocused(true)
            if (demoActive) enterInteractiveMode()
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return
            e.preventDefault()
            handleAction()
          }}
          placeholder={HERO.inputPlaceholder}
          readOnly={demoActive && phase !== "typing-question"}
          className="relative z-10 h-10 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-[#0F172A] shadow-none placeholder:text-[#94A3B8]/90 focus-visible:ring-0 read-only:cursor-default sm:px-3 sm:text-base"
        />

        <Button
          type="button"
          size="icon"
          onClick={handleAction}
          className={cn(
            "relative z-10 size-10 shrink-0 rounded-full text-white shadow-[0_8px_24px_rgba(37,99,235,0.32)] transition-[background-color,transform] duration-300",
            isStreaming
              ? "bg-[#0F172A] hover:bg-[#1E293B]"
              : "bg-[#2563EB] hover:bg-[#1D4ED8]"
          )}
          aria-label={isStreaming ? "Stop" : "Ask Exur"}
        >
          <span className="flex items-center justify-center transition-transform duration-200">
            {isStreaming ? (
              <SquareIcon className="size-3.5 fill-current" />
            ) : (
              <ArrowUpIcon className="size-4" />
            )}
          </span>
        </Button>
        </div>
      </div>
    </div>
  )
}
