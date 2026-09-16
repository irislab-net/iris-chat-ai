"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useRef, useState } from "react"

import {
  GoalsAskBubble,
  GoalsPanelBackdrop,
  GoalsPanelVisual,
} from "@/components/landing/modern/goals-panel-visual"
import { SectionHeader, SphereCta } from "@/components/landing/modern/sphere-ui"
import {
  FEATURE_SCROLL_STEPS,
  FEATURES_SECTION,
  type FeatureScrollStep,
} from "@/lib/landing-modern-data"
import {
  landingCard,
  landingGlassSheen,
  landingInner,
  landingSection,
} from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const STEP_COUNT = FEATURE_SCROLL_STEPS.length
const CARD_STACK_MIN_H =
  "min-h-[calc(100dvh-14rem)] sm:min-h-[calc(100dvh-13rem)] lg:min-h-96 xl:min-h-96"

const DECK_LAYOUT = {
  peek: 22,
  peekLg: 28,
  exitLift: 72,
  widthStep: 0.034,
  minScaleX: 0.86,
  behindOpacityStep: 0.065,
}

const GOALS_STACK_CARD_BASE =
  "absolute inset-0 isolate rounded-[1.75rem] [transform-origin:50%_0%]"

type StackRole = "front" | "behind" | "exit"

const GOALS_STACK_CARD_CHROME: Record<StackRole, string> = {
  front:
    "bg-white shadow-[0_20px_56px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.85),inset_0_1px_0_0_rgba(255,255,255,0.95)]",
  behind:
    "bg-[#FAFBFC] shadow-[0_4px_14px_rgba(15,23,42,0.04),0_0_0_1px_rgba(255,255,255,0.65),inset_0_1px_0_0_rgba(255,255,255,0.88)]",
  exit: "bg-white shadow-none",
}

function getStackRole(depth: number): StackRole {
  if (depth < 0) return "exit"
  if (depth < 1) return "front"
  return "behind"
}

function applyStackCardChrome(card: HTMLElement, depth: number) {
  const role = getStackRole(depth)
  if (card.dataset.stackRole === role) return

  card.dataset.stackRole = role
  card.classList.remove(
    GOALS_STACK_CARD_CHROME.front,
    GOALS_STACK_CARD_CHROME.behind,
    GOALS_STACK_CARD_CHROME.exit
  )
  card.classList.add(GOALS_STACK_CARD_CHROME[role])

  const sheen = card.querySelector<HTMLElement>("[data-goals-sheen]")
  if (sheen) sheen.style.opacity = role === "front" ? "1" : "0"
}

function getNavPinOffset() {
  return window.matchMedia("(min-width: 1024px)").matches ? 72 : 56
}

function getDeckPeek() {
  return window.matchMedia("(min-width: 1024px)").matches
    ? DECK_LAYOUT.peekLg
    : DECK_LAYOUT.peek
}

function getStackPadding(virtualActive: number) {
  const cardsBehind = Math.max(0, STEP_COUNT - 1 - virtualActive)
  const peekPadding = cardsBehind * getDeckPeek()
  const shadowBleed = cardsBehind === 0 ? 12 : 0
  return peekPadding + shadowBleed
}

function getCardStackTransform(index: number, virtualActive: number) {
  const peekStep = getDeckPeek()
  const depth = index - virtualActive

  if (depth < 0) {
    const exit = Math.min(1, Math.abs(depth))
    return {
      y: depth * DECK_LAYOUT.exitLift,
      scaleX: 1 - exit * 0.03,
      opacity: Math.max(0, 1 + depth * 1.1),
      zIndex: 8,
      depth,
    }
  }

  const y = depth * peekStep
  const scaleX = Math.max(
    DECK_LAYOUT.minScaleX,
    1 - depth * DECK_LAYOUT.widthStep
  )
  const zIndex = depth < 1 ? 120 : Math.round(96 - depth * 10)
  const opacity =
    depth < 1
      ? 1
      : Math.max(0.82, 1 - depth * DECK_LAYOUT.behindOpacityStep)

  return { y, scaleX, opacity, zIndex, depth }
}

function GoalsStepCopy({ step }: { step: FeatureScrollStep }) {
  return (
    <div className="flex h-full flex-col justify-between gap-6 px-6 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8 lg:px-9 lg:pb-9">
      <div>
        <div className="flex items-center gap-2">
          <step.icon className="size-3.5 text-[#94A3B8]" strokeWidth={1.75} aria-hidden />
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#94A3B8]">
            {step.step} · {step.label}
          </p>
        </div>
        <h3 className="mt-3 font-(family-name:--font-display) text-2xl font-semibold leading-tight tracking-tight text-[#0F172A] sm:text-[1.75rem]">
          {step.title}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#64748B] sm:text-base">
          {step.panelDesc}
        </p>
      </div>

      <GoalsAskBubble>{step.ask}</GoalsAskBubble>
    </div>
  )
}

function GoalsStepVisualPanel({
  step,
  isActive,
}: {
  step: FeatureScrollStep
  isActive: boolean
}) {
  return (
    <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#F8FAFC] p-6 sm:p-8 lg:p-10">
      <GoalsPanelBackdrop />
      <div className="relative z-10 flex w-full justify-center">
        <GoalsPanelVisual step={step} isActive={isActive} />
      </div>
    </div>
  )
}

function GoalsStepCard({
  step,
  isActive,
}: {
  step: FeatureScrollStep
  isActive: boolean
}) {
  return (
    <div className="grid h-full min-h-0 w-full lg:grid-cols-2">
      <GoalsStepCopy step={step} />
      <GoalsStepVisualPanel step={step} isActive={isActive} />
    </div>
  )
}

function GoalsScrollStacked() {
  return (
    <section
      id="features"
      className={cn(landingSection, "relative scroll-mt-24 overflow-visible py-16 sm:py-20")}
    >
      <div className={landingInner}>
        <SectionHeader
          title={FEATURES_SECTION.title}
          subtitle={FEATURES_SECTION.subtitle}
        />

        <div className="mt-10 space-y-8 sm:mt-12 sm:space-y-10">
          {FEATURE_SCROLL_STEPS.map((step) => (
            <article key={step.id} className={cn("overflow-hidden", landingCard)}>
              <GoalsStepCard step={step} isActive />
            </article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <SphereCta href={APP_NEWS_PATH}>Meet Exur</SphereCta>
        </div>
      </div>
    </section>
  )
}

export function GoalsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const activeIndexRef = useRef(0)

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotion = () => setReducedMotion(motionMedia.matches)
    syncMotion()
    motionMedia.addEventListener("change", syncMotion)
    return () => motionMedia.removeEventListener("change", syncMotion)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    const section = sectionRef.current
    const pin = pinRef.current
    const stack = stackRef.current
    if (!section || !pin || !stack) return

    const cards = gsap.utils.toArray<HTMLElement>("[data-goals-card]", stack)
    if (cards.length === 0) return

    const syncActiveIndex = (virtualActive: number) => {
      const next =
        STEP_COUNT <= 1
          ? 0
          : Math.min(STEP_COUNT - 1, Math.max(0, Math.round(virtualActive)))
      if (next === activeIndexRef.current) return
      activeIndexRef.current = next
      setActiveIndex(next)
    }

    const cardMotion = cards.map((card) => ({
      card,
      x: gsap.quickSetter(card, "x", "px"),
      y: gsap.quickSetter(card, "y", "px"),
      scaleX: gsap.quickSetter(card, "scaleX"),
      opacity: gsap.quickSetter(card, "opacity"),
    }))

    let stackPadding = getStackPadding(0)

    const applyStackTransforms = (virtualActive: number) => {
      const nextPadding = getStackPadding(virtualActive)
      if (nextPadding !== stackPadding) {
        stackPadding = nextPadding
        stack.style.paddingBottom = `${nextPadding}px`
      }

      cardMotion.forEach(({ card, x, y, scaleX, opacity }, index) => {
        const { y: ty, scaleX: sx, opacity: op, zIndex } = getCardStackTransform(
          index,
          virtualActive
        )

        x(0)
        y(ty)
        scaleX(sx)
        opacity(op)

        const z = String(zIndex)
        if (card.style.zIndex !== z) card.style.zIndex = z
      })
    }

    const applyStackChrome = (virtualActive: number) => {
      cards.forEach((card, index) => {
        const { depth } = getCardStackTransform(index, virtualActive)
        applyStackCardChrome(card, depth)
      })
    }

    const ctx = gsap.context(() => {
      gsap.set(cards, {
        x: 0,
        scaleY: 1,
        transformOrigin: "50% 0%",
        force3D: true,
      })

      applyStackTransforms(0)
      applyStackChrome(0)
      syncActiveIndex(0)

      ScrollTrigger.create({
        trigger: section,
        start: () => `top top+=${getNavPinOffset()}`,
        end: () =>
          `+=${window.innerHeight * Math.max(STEP_COUNT - 1, 1)}`,
        pin,
        pinSpacing: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        ...(STEP_COUNT > 1 && {
          snap: {
            snapTo: (progress: number) => {
              const step = 1 / (STEP_COUNT - 1)
              return Math.round(progress / step) * step
            },
            duration: { min: 0.22, max: 0.42 },
            delay: 0.02,
            ease: "power3.out",
          },
        }),
        onUpdate: (self) => {
          const virtualActive =
            STEP_COUNT <= 1 ? 0 : self.progress * (STEP_COUNT - 1)
          applyStackTransforms(virtualActive)
          applyStackChrome(virtualActive)
        },
        onSnapComplete: (self) => {
          const virtualActive =
            STEP_COUNT <= 1 ? 0 : self.progress * (STEP_COUNT - 1)
          applyStackTransforms(virtualActive)
          applyStackChrome(virtualActive)
          syncActiveIndex(virtualActive)
        },
      })
    }, section)

    let refreshFrame = 0
    const refresh = () => {
      cancelAnimationFrame(refreshFrame)
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh())
    }

    window.addEventListener("load", refresh)
    const resizeObserver = new ResizeObserver(refresh)
    resizeObserver.observe(section)

    return () => {
      cancelAnimationFrame(refreshFrame)
      window.removeEventListener("load", refresh)
      resizeObserver.disconnect()
      ctx.revert()
    }
  }, [reducedMotion])

  if (reducedMotion) {
    return <GoalsScrollStacked />
  }

  return (
    <section
      ref={sectionRef}
      id="features"
      className={cn(landingSection, "relative scroll-mt-24 overflow-visible")}
    >
      <div className={landingInner}>
        <div
          ref={pinRef}
          className="flex min-h-[calc(100dvh-3.5rem)] flex-col justify-center py-6 sm:py-8"
        >
          <div className="shrink-0">
            <SectionHeader
              title={FEATURES_SECTION.title}
              subtitle={FEATURES_SECTION.subtitle}
            />
          </div>

          <div className="relative mt-6 sm:mt-8">
            <div ref={stackRef} className="relative w-full overflow-visible">
              <div className={cn("relative overflow-visible", CARD_STACK_MIN_H)}>
                {FEATURE_SCROLL_STEPS.map((step, index) => (
                  <article
                    key={step.id}
                    data-goals-card
                    className={cn(
                      GOALS_STACK_CARD_BASE,
                      GOALS_STACK_CARD_CHROME[index === 0 ? "front" : "behind"]
                    )}
                    data-stack-role={index === 0 ? "front" : "behind"}
                  >
                    <div
                      data-goals-sheen
                      aria-hidden
                      className={cn(
                        landingGlassSheen,
                        "pointer-events-none absolute inset-0 rounded-[1.75rem] transition-opacity duration-200",
                        index === 0 ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="relative z-10 size-full overflow-hidden rounded-[1.75rem]">
                      <GoalsStepCard step={step} isActive={activeIndex === index} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center py-10 sm:py-12 lg:py-16">
          <SphereCta href={APP_NEWS_PATH}>Meet Exur</SphereCta>
        </div>
      </div>
    </section>
  )
}
