import { gsap } from "gsap"

import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { LANDING_MOTION } from "@/lib/landing-motion"

export type SignalWaitScenario = "trade" | "hold"

export type SignalWaitDemoCallbacks = {
  onDraft: (value: string) => void
  onUserText: (value: string | null) => void
  onReplyText: (value: string | null) => void
  onScenario: (scenario: SignalWaitScenario) => void
  questionFor: (scenario: SignalWaitScenario) => string
  answerFor: (scenario: SignalWaitScenario) => string | null
}

export type SignalWaitDemoDom = {
  /** Element watched for viewport entry (usually the section). */
  observe: HTMLElement
  user: HTMLElement
  reply: HTMLElement
  tradeResult: HTMLElement
  holdResult: HTMLElement
  send: HTMLElement
}

const FPS = 60
const frames = (count: number) => count / FPS
const QUESTION_CHAR_FRAMES = 2.2
const ANSWER_CHAR_FRAMES = 1.4
/** Hold the default trade beat on screen, then continue the loop. */
const ENTER_DELAY_MS = 2800

function typeText(
  tl: gsap.core.Timeline,
  text: string,
  onFrame: (value: string) => void,
  framesPerChar: number,
  reduced: boolean
) {
  if (reduced) {
    tl.call(() => onFrame(text))
    return
  }

  const proxy = { n: 0 }
  let painted = 0
  tl.to(proxy, {
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

/**
 * Composer demo with fixed slots — opacity only (no layout shift).
 * Default beat: user already asked “Long ETH…?” and the signal card is visible.
 */
export function initSignalWaitDemo(
  dom: SignalWaitDemoDom,
  callbacks: SignalWaitDemoCallbacks,
  reducedMotion: boolean
) {
  ensureGsapScroll()

  const { observe, user, reply, tradeResult, holdResult, send } = dom
  const {
    onDraft,
    onUserText,
    onReplyText,
    onScenario,
    questionFor,
    answerFor,
  } = callbacks

  let timeline: gsap.core.Timeline | null = null
  let playing = false
  let startTimer: ReturnType<typeof setTimeout> | null = null
  let scenario: SignalWaitScenario = "trade"

  const clearStartTimer = () => {
    if (startTimer == null) return
    clearTimeout(startTimer)
    startTimer = null
  }

  /** Idle / entry state: user message + ETH signal card already on screen. */
  const showTradeDefault = () => {
    scenario = "trade"
    onScenario("trade")
    onDraft("")
    onUserText(questionFor("trade"))
    onReplyText(null)
    gsap.set([reply, holdResult], { autoAlpha: 0 })
    gsap.set([user, tradeResult], { autoAlpha: 1 })
  }

  const playScenario = (next: SignalWaitScenario) => {
    scenario = next
    onScenario(next)
    gsap.set([user, reply, tradeResult, holdResult], { autoAlpha: 0 })
    onDraft("")
    onUserText(null)
    onReplyText(null)

    const question = questionFor(next)
    const answer = answerFor(next)
    const resultEl = next === "trade" ? tradeResult : holdResult

    const tl = gsap.timeline({
      defaults: { ease: LANDING_MOTION.ease },
      onComplete: () => {
        if (!playing) return
        timeline = playScenario(scenario === "trade" ? "hold" : "trade")
      },
    })

    tl.to({}, { duration: 0.4 })
    typeText(tl, question, onDraft, QUESTION_CHAR_FRAMES, reducedMotion)
    tl.to({}, { duration: 0.35 })

    tl.call(() => {
      onDraft("")
      onUserText(question)
    })
    tl.to(send, {
      scale: reducedMotion ? 1 : 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: reducedMotion ? 0 : 1,
      ease: "power2.inOut",
    })
    tl.to({}, { duration: 0.04 })
    tl.to(user, {
      autoAlpha: 1,
      duration: LANDING_MOTION.durationFast,
    })

    tl.to({}, { duration: 0.4 })

    if (answer) {
      tl.to(reply, {
        autoAlpha: 1,
        duration: LANDING_MOTION.durationFast,
      })
      typeText(tl, answer, onReplyText, ANSWER_CHAR_FRAMES, reducedMotion)
      tl.to({}, { duration: 0.35 })
    }

    tl.to(resultEl, {
      autoAlpha: 1,
      duration: LANDING_MOTION.duration,
    })

    tl.to({}, { duration: answer ? 2.1 : 2.5 })

    const fadeTargets = answer ? [user, reply, resultEl] : [user, resultEl]
    tl.to(fadeTargets, {
      autoAlpha: 0,
      duration: LANDING_MOTION.durationIn,
      ease: LANDING_MOTION.easeIn,
      stagger: 0.04,
    })
    tl.call(() => {
      onUserText(null)
      onReplyText(null)
    })
    tl.to({}, { duration: 0.3 })

    return tl
  }

  /**
   * Trade beat is already showing — continue into hold, then loop
   * (trade typing → hold → …).
   */
  const play = () => {
    if (playing) return
    playing = true
    timeline?.kill()
    timeline = playScenario("hold")
  }

  const stop = () => {
    clearStartTimer()
    playing = false
    timeline?.kill()
    timeline = null
    showTradeDefault()
  }

  const onEnter = () => {
    if (playing || startTimer != null) return
    showTradeDefault()
    startTimer = setTimeout(() => {
      startTimer = null
      play()
    }, ENTER_DELAY_MS)
  }

  showTradeDefault()

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) onEnter()
      else stop()
    },
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  )
  io.observe(observe)

  if (typeof IntersectionObserver === "undefined") onEnter()

  return () => {
    io.disconnect()
    clearStartTimer()
    playing = false
    timeline?.kill()
    timeline = null
  }
}
