"use client"

import { gsap } from "gsap"
import { useLocale, useTranslations } from "next-intl"
import { useReducedMotion } from "@/lib/landing-motion"
import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { ArrowUpIcon, SquareIcon } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { ExurLogo } from "@/components/brand/exur-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  HERO_DEMO_AVATARS,
  HERO_DEMO_EXCHANGE_COUNT,
} from "@/lib/landing-modern-data"
import {
  landingGlassBlueSheen,
  landingGlassBubbleAi,
  landingGlassBubbleThinking,
  landingGlassBubbleUser,
  landingGlassOrb,
  landingGlassPill,
  landingGlassSheen,
  landingHeroComposeGrid,
} from "@/lib/landing-modern-styles"
import { buildLandingChatHref } from "@/lib/landing-chat-handoff"
import { localeDirection } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

const FPS = 60
const frames = (count: number) => count / FPS

const QUESTION_FRAMES_PER_CHAR = 2.25
const ANSWER_FRAMES_PER_CHAR = 1.3
const PRE_ROLL_FRAMES = 10
const PAUSE_BEFORE_SEND_FRAMES = 22
const BUBBLE_IN_FRAMES = 36
const AVATAR_IN_FRAMES = 28
const AVATAR_STAGGER_FRAMES = 6
const THINK_HOLD_FRAMES = 44
const SHOT_OUT_FRAMES = 20
const HOLD_FRAMES = 252
const FADE_FRAMES = 24
const SEND_PUNCH_FRAMES = 7
const DOT_CYCLE_FRAMES = 24
const CARET_CYCLE_FRAMES = 28

type DemoAxis = {
  userOrigin: string
  aiOrigin: string
  userFromX: number
  aiFromX: number
  userOutX: number
  aiOutX: number
}

function demoAxis(isRtl: boolean): DemoAxis {
  return isRtl
    ? {
        userOrigin: "0% 100%",
        aiOrigin: "100% 0%",
        userFromX: -14,
        aiFromX: 14,
        userOutX: -10,
        aiOutX: 8,
      }
    : {
        userOrigin: "100% 100%",
        aiOrigin: "0% 0%",
        userFromX: 14,
        aiFromX: -14,
        userOutX: 10,
        aiOutX: -8,
      }
}

type DemoPhase =
  "typing-question" | "thinking" | "typing-answer" | "hold" | "fading"

type DemoStartAt = "type" | "send"

type ChatShot = {
  bubble: HTMLElement
  avatar: HTMLElement
}

type DemoShotElements = {
  user: ChatShot
  thinking: ChatShot
  answer: ChatShot
  caret: HTMLElement
  dots: HTMLElement[]
  send: HTMLElement
}

function pickRandomScenarioIndex(exclude?: number) {
  const count = HERO_DEMO_EXCHANGE_COUNT
  if (count <= 1) return 0
  let index = Math.floor(Math.random() * count)
  while (index === exclude) {
    index = Math.floor(Math.random() * count)
  }
  return index
}

function GlassSheen({ className }: { className?: string }) {
  return <div aria-hidden className={cn(landingGlassSheen, className)} />
}

/** Dual-layer liquid-glass ring for hero chat avatars. */
function HeroGlassAvatar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        landingGlassPill,
        "inline-flex size-12 shrink-0 items-center justify-center rounded-full p-[3px] sm:size-[3.25rem]",
        "shadow-[0_14px_40px_rgba(15,23,42,0.1),inset_0_1px_1px_rgba(255,255,255,0.98),inset_0_-1px_2px_rgba(255,255,255,0.35)]",
        "dark:shadow-[0_14px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.16),inset_0_-1px_2px_rgba(255,255,255,0.05)]",
        className
      )}
    >
      <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
      <span
        aria-hidden
        className={cn(landingGlassBlueSheen, "rounded-full opacity-70")}
      />
      <span
        className={cn(
          landingGlassOrb,
          "relative z-10 flex size-full items-center justify-center overflow-hidden rounded-full bg-white/55 p-0.5 dark:bg-white/12"
        )}
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
        <span className="relative z-10 flex size-full items-center justify-center overflow-hidden rounded-full">
          {children}
        </span>
      </span>
    </span>
  )
}

function DemoUserAvatar({ src, initials }: { src: string; initials: string }) {
  return (
    <HeroGlassAvatar>
      <Avatar size="lg" className="size-full after:hidden">
        <AvatarImage src={src} alt="" loading="lazy" className="object-cover" />
        <AvatarFallback className="bg-white/45 text-[10px] font-medium tracking-wide text-muted-foreground dark:bg-white/10">
          {initials}
        </AvatarFallback>
      </Avatar>
    </HeroGlassAvatar>
  )
}

function DemoSystemAvatar() {
  return (
    <HeroGlassAvatar className="mt-0.5">
      <span className="flex size-full items-center justify-center rounded-full bg-white/25 p-0 dark:bg-white/8">
        <ExurLogo
          variant="auto"
          size={44}
          className="size-9 sm:size-10"
          decorative
        />
      </span>
    </HeroGlassAvatar>
  )
}

function requiredEl(root: HTMLElement, selector: string) {
  return root.querySelector<HTMLElement>(selector)
}

function collectDemoShots(root: HTMLElement): DemoShotElements | null {
  const userBubble = requiredEl(root, "[data-demo-user-bubble]")
  const userAvatar = requiredEl(root, "[data-demo-user-avatar]")
  const thinkingBubble = requiredEl(root, "[data-demo-thinking-bubble]")
  const thinkingAvatar = requiredEl(root, "[data-demo-thinking-avatar]")
  const answerBubble = requiredEl(root, "[data-demo-answer-bubble]")
  const answerAvatar = requiredEl(root, "[data-demo-answer-avatar]")
  const caret = requiredEl(root, "[data-demo-caret]")
  const send = requiredEl(root, "[data-demo-send]")
  const dots = gsap.utils.toArray<HTMLElement>("[data-think-dot]", root)

  if (
    !userBubble ||
    !userAvatar ||
    !thinkingBubble ||
    !thinkingAvatar ||
    !answerBubble ||
    !answerAvatar ||
    !caret ||
    !send
  ) {
    return null
  }

  return {
    user: { bubble: userBubble, avatar: userAvatar },
    thinking: { bubble: thinkingBubble, avatar: thinkingAvatar },
    answer: { bubble: answerBubble, avatar: answerAvatar },
    caret,
    dots,
    send,
  }
}

function hideShot(shot: ChatShot, origin: string, fromX: number) {
  gsap.set(shot.bubble, {
    autoAlpha: 0,
    x: fromX,
    y: 16,
    scale: 0.82,
    transformOrigin: origin,
  })
  gsap.set(shot.avatar, {
    autoAlpha: 0,
    x: fromX * 0.35,
    y: 10,
    scale: 0.68,
    transformOrigin: "50% 50%",
  })
}

function resetDemoShots(elements: DemoShotElements, axis: DemoAxis) {
  hideShot(elements.user, axis.userOrigin, axis.userFromX)
  hideShot(elements.thinking, axis.aiOrigin, axis.aiFromX)
  hideShot(elements.answer, axis.aiOrigin, axis.aiFromX)
  gsap.set(elements.caret, { autoAlpha: 0 })
  gsap.set(elements.dots, { y: 0, opacity: 1 })
  gsap.set(elements.send, { scale: 1, transformOrigin: "50% 50%" })
}

function typeOnTicker(
  timeline: gsap.core.Timeline,
  text: string,
  framesPerChar: number,
  onFrame: (value: string) => void
) {
  const proxy = { n: 0 }
  let painted = 0

  timeline.to(proxy, {
    n: text.length,
    duration: frames(text.length * framesPerChar),
    ease: "none",
    snap: { n: 1 },
    onUpdate: () => {
      if (proxy.n === painted) return
      painted = proxy.n
      onFrame(text.slice(0, painted))
    },
    onComplete: () => onFrame(text),
  })
}

function revealShot(
  timeline: gsap.core.Timeline,
  shot: ChatShot,
  {
    origin,
    fromX,
    at,
    vis,
  }: {
    origin: string
    fromX: number
    at: string
    vis: (count: number) => number
  }
) {
  timeline.fromTo(
    shot.bubble,
    {
      autoAlpha: 0,
      x: fromX,
      y: 16,
      scale: 0.82,
      transformOrigin: origin,
    },
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: vis(BUBBLE_IN_FRAMES),
      ease: "heroDemo",
      immediateRender: false,
    },
    at
  )
  timeline.fromTo(
    shot.avatar,
    {
      autoAlpha: 0,
      x: fromX * 0.35,
      y: 10,
      scale: 0.68,
      transformOrigin: "50% 50%",
    },
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: vis(AVATAR_IN_FRAMES),
      ease: "heroDemo",
      immediateRender: false,
    },
    `${at}+=${vis(AVATAR_STAGGER_FRAMES)}`
  )
}

function dismissShot(
  timeline: gsap.core.Timeline,
  shot: ChatShot,
  {
    toX,
    toY,
    at,
    vis,
  }: {
    toX: number
    toY: number
    at: string
    vis: (count: number) => number
  }
) {
  timeline.to(
    shot.bubble,
    {
      autoAlpha: 0,
      x: toX,
      y: toY,
      scale: 0.92,
      duration: vis(SHOT_OUT_FRAMES),
      ease: "power2.in",
    },
    at
  )
  timeline.to(
    shot.avatar,
    {
      autoAlpha: 0,
      x: toX * 0.4,
      y: toY * 0.7,
      scale: 0.84,
      duration: vis(16),
      ease: "power2.in",
    },
    `${at}+=${vis(3)}`
  )
}

function playHeroComposeTimeline({
  elements,
  question,
  answer,
  reducedMotion,
  startAt,
  axis,
  onDraft,
  onAnswer,
  onPhase,
  onUserText,
  onComplete,
  onDotsTween,
  onCaretTween,
}: {
  elements: DemoShotElements
  question: string
  answer: string
  reducedMotion: boolean
  startAt: DemoStartAt
  axis: DemoAxis
  onDraft: (value: string) => void
  onAnswer: (value: string) => void
  onPhase: (phase: DemoPhase) => void
  onUserText: (value: string) => void
  onComplete: () => void
  onDotsTween: (tween: gsap.core.Tween | null) => void
  onCaretTween: (tween: gsap.core.Tween | null) => void
}) {
  const vis = (count: number) => (reducedMotion ? 0 : frames(count))
  const timeline = gsap.timeline({
    defaults: {
      ease: "heroDemo",
      overwrite: "auto",
    },
    onComplete,
  })

  resetDemoShots(elements, axis)
  onUserText(question)
  onAnswer("")
  onDraft("")
  onPhase("typing-question")

  if (startAt === "type") {
    timeline.to({}, { duration: frames(PRE_ROLL_FRAMES) })

    if (reducedMotion) {
      timeline.call(() => onDraft(question))
    } else {
      typeOnTicker(timeline, question, QUESTION_FRAMES_PER_CHAR, onDraft)
    }

    timeline.to({}, { duration: frames(PAUSE_BEFORE_SEND_FRAMES) })
  }

  timeline.addLabel("send")
  timeline.call(() => {
    onDraft("")
    onUserText(question)
    onPhase("thinking")
  })
  timeline.to(
    elements.send,
    {
      scale: reducedMotion ? 1 : 0.88,
      duration: vis(SEND_PUNCH_FRAMES),
      yoyo: true,
      repeat: reducedMotion ? 0 : 1,
      ease: "power2.inOut",
    },
    "send"
  )
  revealShot(timeline, elements.user, {
    origin: axis.userOrigin,
    fromX: axis.userFromX,
    at: "send",
    vis,
  })

  timeline.addLabel("think", `send+=${vis(12)}`)
  revealShot(timeline, elements.thinking, {
    origin: axis.aiOrigin,
    fromX: axis.aiFromX,
    at: "think",
    vis,
  })
  timeline.call(
    () => {
      if (reducedMotion || elements.dots.length === 0) {
        onDotsTween(null)
        return
      }

      onDotsTween(
        gsap.to(elements.dots, {
          y: -3,
          opacity: 0.38,
          duration: frames(DOT_CYCLE_FRAMES),
          ease: "sine.inOut",
          stagger: { each: frames(8), repeat: -1, yoyo: true },
        })
      )
    },
    undefined,
    "think"
  )
  timeline.to({}, { duration: frames(THINK_HOLD_FRAMES) })

  timeline.addLabel("answer")
  timeline.call(() => {
    onDotsTween(null)
    gsap.set(elements.dots, { y: 0, opacity: 1 })
    onPhase("typing-answer")
  })
  dismissShot(timeline, elements.thinking, {
    toX: axis.aiOutX,
    toY: -12,
    at: "answer",
    vis,
  })
  revealShot(timeline, elements.answer, {
    origin: axis.aiOrigin,
    fromX: axis.aiFromX,
    at: `answer+=${vis(6)}`,
    vis,
  })
  timeline.call(
    () => {
      if (reducedMotion) {
        onCaretTween(null)
        return
      }

      gsap.set(elements.caret, { autoAlpha: 1 })
      onCaretTween(
        gsap.to(elements.caret, {
          autoAlpha: 0,
          duration: frames(CARET_CYCLE_FRAMES),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        })
      )
    },
    undefined,
    `answer+=${vis(6)}`
  )

  if (reducedMotion) {
    timeline.call(() => onAnswer(answer))
  } else {
    typeOnTicker(timeline, answer, ANSWER_FRAMES_PER_CHAR, onAnswer)
  }

  timeline.addLabel("hold")
  timeline.call(() => {
    onCaretTween(null)
    gsap.set(elements.caret, { autoAlpha: 0 })
    onPhase("hold")
  })
  timeline.to({}, { duration: frames(HOLD_FRAMES) })

  timeline.addLabel("fade")
  timeline.call(() => onPhase("fading"))
  dismissShot(timeline, elements.user, {
    toX: axis.userOutX,
    toY: -12,
    at: "fade",
    vis,
  })
  dismissShot(timeline, elements.answer, {
    toX: axis.aiOutX,
    toY: -12,
    at: `fade+=${vis(5)}`,
    vis,
  })
  timeline.to({}, { duration: vis(FADE_FRAMES) })

  return timeline
}

export function HeroComposeDemo() {
  const tHero = useTranslations("modern.hero")
  const locale = useLocale()
  const textDir = localeDirection(locale)
  const isRtl = textDir === "rtl"
  const axis = useMemo(() => demoAxis(isRtl), [isRtl])
  const router = useRouter()
  const reducedMotion = Boolean(useReducedMotion())

  const rootRef = useRef<HTMLDivElement>(null)
  const playDemoRef = useRef<(startAt: DemoStartAt, question?: string) => void>(
    () => {}
  )
  const composerDraftRef = useRef("")
  const dotsTweenRef = useRef<gsap.core.Tween | null>(null)
  const caretTweenRef = useRef<gsap.core.Tween | null>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  const [userQuery, setUserQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [composerDraft, setComposerDraft] = useState("")
  const [userBubbleText, setUserBubbleText] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [phase, setPhase] = useState<DemoPhase>("typing-question")
  const [scenarioIndex, setScenarioIndex] = useState(0)

  const demoActive = !isFocused && userQuery.length === 0
  const question = tHero(`exchanges.${scenarioIndex}.q`)
  const answer = tHero(`exchanges.${scenarioIndex}.a`)
  const demoAvatar = HERO_DEMO_AVATARS[scenarioIndex % HERO_DEMO_AVATARS.length]

  const isStreaming =
    phase === "thinking" || phase === "typing-answer" || phase === "hold"
  const userRevealed =
    phase === "thinking" || phase === "typing-answer" || phase === "hold"
  const thinkingRevealed = phase === "thinking"
  const answerRevealed = phase === "typing-answer" || phase === "hold"

  const composerValue = demoActive
    ? phase === "typing-question"
      ? composerDraft
      : ""
    : userQuery

  const killDemoMotion = useCallback(() => {
    dotsTweenRef.current?.kill()
    caretTweenRef.current?.kill()
    timelineRef.current?.kill()
    dotsTweenRef.current = null
    caretTweenRef.current = null
    timelineRef.current = null
  }, [])

  const hideDemoShots = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const elements = collectDemoShots(root)
    if (elements) resetDemoShots(elements, axis)
  }, [axis])

  const enterInteractiveMode = useCallback(() => {
    killDemoMotion()
    hideDemoShots()
    composerDraftRef.current = ""
    setComposerDraft("")
    setUserBubbleText(null)
    setAnswerText("")
    setPhase("typing-question")
  }, [hideDemoShots, killDemoMotion])

  const stopDemo = useCallback(() => {
    enterInteractiveMode()
    setScenarioIndex((current) => pickRandomScenarioIndex(current))
  }, [enterInteractiveMode])

  const handleSend = useCallback(() => {
    const q = (demoActive ? composerDraftRef.current : userQuery).trim()
    if (!q) return

    if (!demoActive) {
      router.push(buildLandingChatHref(q))
      return
    }

    playDemoRef.current("send", q)
  }, [demoActive, router, userQuery])

  const handleAction = useCallback(() => {
    if (isStreaming) {
      stopDemo()
      return
    }
    handleSend()
  }, [handleSend, isStreaming, stopDemo])

  useLayoutEffect(() => {
    ensureGsapScroll()

    const root = rootRef.current
    if (!root) return

    const assignDots = (tween: gsap.core.Tween | null) => {
      dotsTweenRef.current?.kill()
      dotsTweenRef.current = tween
    }
    const assignCaret = (tween: gsap.core.Tween | null) => {
      caretTweenRef.current?.kill()
      caretTweenRef.current = tween
    }

    const playDemo = (startAt: DemoStartAt, sendQuestion?: string) => {
      try {
        const elements = collectDemoShots(root)
        if (!elements) return

        killDemoMotion()

        const nextQuestion = sendQuestion ?? question

        timelineRef.current = playHeroComposeTimeline({
          elements,
          question: nextQuestion,
          answer,
          reducedMotion,
          startAt,
          axis,
          onDraft: (value) => {
            composerDraftRef.current = value
            setComposerDraft(value)
          },
          onAnswer: setAnswerText,
          onPhase: setPhase,
          onUserText: setUserBubbleText,
          onDotsTween: assignDots,
          onCaretTween: assignCaret,
          onComplete: () => {
            setScenarioIndex((current) => pickRandomScenarioIndex(current))
          },
        })
      } catch {
        killDemoMotion()
        hideDemoShots()
        setPhase("typing-question")
        setComposerDraft("")
        setUserBubbleText(null)
        setAnswerText("")
      }
    }

    playDemoRef.current = playDemo

    if (!demoActive) {
      killDemoMotion()
      hideDemoShots()
      return
    }

    playDemo("type")

    return () => {
      playDemoRef.current = () => {}
      killDemoMotion()
    }
  }, [
    answer,
    axis,
    demoActive,
    hideDemoShots,
    killDemoMotion,
    question,
    reducedMotion,
  ])

  return (
    <div
      ref={rootRef}
      dir={textDir}
      className="mx-auto w-full max-w-lg lg:max-w-2xl"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className={cn(landingHeroComposeGrid, "isolate overflow-visible")}>
        <div className="flex h-full min-h-0 items-end justify-end overflow-visible px-1 pt-1 pb-1">
          <div
            className="pointer-events-none flex max-w-full min-w-0 items-end gap-2 sm:max-w-[90%] sm:gap-2.5"
            aria-hidden={!userRevealed}
          >
            <div
              data-demo-user-bubble
              className={cn(
                "min-w-0 px-4 py-2.5 opacity-0 will-change-transform sm:px-5 sm:py-3",
                landingGlassBubbleUser
              )}
            >
              <GlassSheen />
              <p className="relative z-10 line-clamp-2 text-start text-[0.9375rem] leading-snug font-normal text-foreground sm:text-lg sm:leading-snug">
                {userBubbleText ?? "\u00A0"}
              </p>
            </div>
            <span
              data-demo-user-avatar
              className="inline-flex shrink-0 opacity-0 will-change-transform"
            >
              <DemoUserAvatar
                src={demoAvatar.src}
                initials={demoAvatar.initials}
              />
            </span>
          </div>
        </div>

        <div className="relative isolate h-full min-h-0 overflow-visible px-1 py-0.5">
          <div
            className="pointer-events-none absolute inset-0 z-0 flex items-start gap-2 overflow-visible sm:gap-3"
            aria-hidden={!thinkingRevealed}
          >
            <span
              data-demo-thinking-avatar
              className="inline-flex shrink-0 opacity-0 will-change-transform"
            >
              <DemoSystemAvatar />
            </span>
            <div className="min-w-0 flex-1">
              <div
                data-demo-thinking-bubble
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2.5 opacity-0 will-change-transform sm:px-4 sm:py-3",
                  landingGlassBubbleThinking
                )}
              >
                <GlassSheen />
                <span
                  data-think-dot
                  className="relative z-10 size-1.5 rounded-full bg-muted-foreground/80"
                />
                <span
                  data-think-dot
                  className="relative z-10 size-1.5 rounded-full bg-muted-foreground/80"
                />
                <span
                  data-think-dot
                  className="relative z-10 size-1.5 rounded-full bg-muted-foreground/80"
                />
              </div>
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-start gap-2 overflow-visible sm:gap-3"
            aria-hidden={!answerRevealed}
          >
            <span
              data-demo-answer-avatar
              className="inline-flex shrink-0 opacity-0 will-change-transform"
            >
              <DemoSystemAvatar />
            </span>
            <div className="min-w-0 flex-1">
              <div
                data-demo-answer-bubble
                className={cn(
                  "w-full px-4 py-2.5 opacity-0 will-change-transform sm:px-5 sm:py-3",
                  landingGlassBubbleAi
                )}
              >
                <GlassSheen />
                <p className="relative z-10 mb-0.5 font-mono text-[9px] font-medium tracking-[0.25em] text-muted-foreground uppercase sm:mb-1">
                  Exur
                </p>
                <p className="relative z-10 line-clamp-4 text-start text-[0.9375rem] leading-snug font-normal text-muted-foreground sm:text-lg sm:leading-relaxed">
                  {answerText}
                  <span
                    data-demo-caret
                    className="ms-0.5 inline-block h-[1.1em] w-0.5 bg-muted-foreground align-[-2px] opacity-0"
                    aria-hidden
                  />
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "relative z-30 flex h-full min-h-0 shrink-0 items-center gap-2 overflow-visible px-2 py-2 sm:gap-2 sm:px-3 sm:py-2",
            landingGlassPill
          )}
        >
          <GlassSheen className="rounded-full" />
          <Input
            type="search"
            enterKeyHint="send"
            autoComplete="off"
            dir={textDir}
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
            placeholder={tHero("inputPlaceholder")}
            aria-label={tHero("inputPlaceholder")}
            readOnly={demoActive && phase !== "typing-question"}
            className="relative z-10 h-10 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-foreground shadow-none placeholder:text-muted-foreground/90 read-only:cursor-default focus-visible:ring-0 sm:px-3 sm:text-base"
          />

          <span data-demo-send className="relative z-10 inline-flex shrink-0">
            <Button
              type="button"
              size="icon"
              onClick={handleAction}
              className={cn(
                "size-10 shrink-0 rounded-full text-white shadow-[0_8px_24px_rgba(37,99,235,0.32)] transition-colors duration-300",
                isStreaming
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-[#2563EB] hover:bg-[#1D4ED8]"
              )}
              aria-label={isStreaming ? "Stop" : "Ask Exur"}
            >
              {isStreaming ? (
                <SquareIcon className="size-3.5 fill-current" />
              ) : (
                <ArrowUpIcon className="size-4" />
              )}
            </Button>
          </span>
        </div>
      </div>
    </div>
  )
}
