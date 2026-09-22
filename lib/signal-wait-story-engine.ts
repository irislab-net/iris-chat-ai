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
  root: HTMLElement
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
 */
export function initSignalWaitDemo(
  dom: SignalWaitDemoDom,
  callbacks: SignalWaitDemoCallbacks,
  reducedMotion: boolean
) {
  ensureGsapScroll()

  const { root, user, reply, tradeResult, holdResult, send } = dom
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
  let scenario: SignalWaitScenario = "trade"

  const resetVisuals = () => {
    gsap.set([user, reply, tradeResult, holdResult], { autoAlpha: 0 })
    onDraft("")
    onUserText(null)
    onReplyText(null)
  }

  const playScenario = (next: SignalWaitScenario) => {
    scenario = next
    onScenario(next)
    resetVisuals()

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

    const fadeTargets = answer
      ? [user, reply, resultEl]
      : [user, resultEl]
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

  const play = () => {
    if (playing) return
    playing = true
    timeline?.kill()
    timeline = playScenario("trade")
  }

  const pause = () => {
    playing = false
    timeline?.pause()
  }

  const resume = () => {
    if (!timeline) {
      play()
      return
    }
    playing = true
    timeline.resume()
  }

  resetVisuals()
  onScenario("trade")

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) resume()
      else pause()
    },
    { threshold: 0.35 }
  )
  io.observe(root)

  if (typeof IntersectionObserver === "undefined") play()

  return () => {
    io.disconnect()
    timeline?.kill()
    timeline = null
    playing = false
  }
}
