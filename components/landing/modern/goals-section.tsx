"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useRef, useState } from "react"

import {
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
  landingInner,
  landingSection,
  landingTitleCardLg,
} from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const STEP_COUNT = FEATURE_SCROLL_STEPS.length

type MotionDistances = {
  enterY: number
  exitY: number
}

// Hold outgoing title, then fade while incoming rises — avoids v7 dead zones at ~4% opacity.
const CAPTION_EXIT_HOLD = 0.15
const CAPTION_EXIT_FADE = 0.38
const CAPTION_ENTER_START = -0.62

function captionBlockMotion(delta: number, { enterY, exitY }: MotionDistances) {
  if (delta >= 1) return { opacity: 0, y: -exitY, zIndex: 0, hidden: true }
  if (delta <= -1) return { opacity: 0, y: enterY, zIndex: 0, hidden: true }

  if (delta > 0) {
    if (delta <= CAPTION_EXIT_HOLD) {
      return { opacity: 1, y: 0, zIndex: 1, hidden: false }
    }

    const t = Math.min(
      1,
      (delta - CAPTION_EXIT_HOLD) / CAPTION_EXIT_FADE
    )
    return {
      opacity: Math.max(0, 1 - Math.pow(t, 0.92)),
      y: -t * exitY,
      zIndex: 1,
      hidden: false,
    }
  }

  if (delta < CAPTION_ENTER_START) {
    return { opacity: 0, y: enterY, zIndex: 0, hidden: false }
  }

  const span = -CAPTION_ENTER_START
  const t = Math.min(1, (delta - CAPTION_ENTER_START) / span)
  return {
    opacity: Math.pow(t, 0.78),
    y: (1 - t) * enterY,
    zIndex: 2,
    hidden: false,
  }
}

function captionDetailReveal(delta: number) {
  if (delta > 0) return 1
  if (delta <= -0.14) return 0
  return Math.min(1, (delta + 0.14) / 0.14)
}

function visualMotion(delta: number, enterY: number, exitY: number) {
  if (delta >= 1) return { opacity: 0, y: -exitY }
  if (delta <= -1) return { opacity: 0, y: enterY }

  if (delta > 0) {
    const t = Math.min(1, delta)
    return { opacity: Math.max(0, 1 - t * 1.2), y: -t * exitY }
  }

  const t = 1 + delta
  return {
    opacity: Math.max(0, Math.min(1, t)),
    y: (1 - t) * enterY,
  }
}

function getNavPinOffset() {
  return window.matchMedia("(min-width: 1024px)").matches ? 72 : 56
}

function isCoarsePointer() {
  return window.matchMedia("(pointer: coarse)").matches
}

function getScrollDistance() {
  const perStep = window.matchMedia("(min-width: 1024px)").matches ? 680 : 520
  return perStep * Math.max(STEP_COUNT - 1, 1)
}

/** Pinned step-swap everywhere; the stacked list is the reduced-motion fallback. */
function readGoalsLayoutMode(): "pinned" | "stacked" {
  if (typeof window === "undefined") return "pinned"
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "stacked"
    : "pinned"
}

function useGoalsLayoutMode() {
  const [mode, setMode] = useState<"pinned" | "stacked">("pinned")

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)")

    const sync = () => {
      setMode(readGoalsLayoutMode())
    }

    sync()
    motionMedia.addEventListener("change", sync)
    return () => {
      motionMedia.removeEventListener("change", sync)
    }
  }, [])

  return mode
}

function GoalsScrollStacked() {
  return (
    <section
      id="features"
      className={cn(landingSection, "relative scroll-mt-24 overflow-visible py-10 sm:py-16 lg:py-20")}
    >
      <div className={landingInner}>
        <SectionHeader
          title={FEATURES_SECTION.title}
          subtitle={FEATURES_SECTION.subtitle}
          className="[&_h2]:text-2xl [&_h2]:sm:text-4xl [&_p]:text-sm [&_p]:sm:text-lg"
        />

        <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-8 lg:space-y-10">
          {FEATURE_SCROLL_STEPS.map((step) => (
            <GoalsStackedCard key={step.id} step={step} />
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:mt-12">
          <SphereCta href={APP_NEWS_PATH}>Open application</SphereCta>
        </div>
      </div>
    </section>
  )
}

function GoalsStackedCard({ step }: { step: FeatureScrollStep }) {
  return (
    <article className={landingCard}>
      <div className="flex w-full flex-col">
        <div className="flex flex-col gap-3 px-4 py-5 sm:gap-4 sm:px-7 sm:py-7">
          <div className="flex items-center gap-2">
            <step.icon className="size-3.5 shrink-0 text-[#94A3B8]" strokeWidth={1.75} aria-hidden />
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#94A3B8] sm:tracking-[0.25em]">
              {step.step} · {step.label}
            </p>
          </div>
          <h3 className={landingTitleCardLg}>{step.title}</h3>
          <p className="text-sm leading-relaxed text-[#64748B] sm:text-base">{step.panelDesc}</p>
        </div>

        <div className="relative flex items-center justify-center overflow-visible border-t border-[#F1F5F9] bg-[#F8FAFC] px-3 py-5 sm:px-6 sm:py-7">
          <GoalsPanelBackdrop />
          <div className="relative z-10 flex w-full justify-center">
            <GoalsPanelVisual step={step} isActive={false} enableMotion={false} compact />
          </div>
        </div>
      </div>
    </article>
  )
}

function GoalsStepCaption({ step }: { step: FeatureScrollStep }) {
  return (
    <div className="flex w-full flex-col gap-3 sm:gap-4 lg:mx-auto lg:max-w-md lg:items-center lg:text-center">
      <div data-goals-caption-meta className="flex items-center gap-2">
        <step.icon className="size-3.5 text-[#94A3B8]" strokeWidth={1.75} aria-hidden />
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#94A3B8]">
          {step.step} · {step.label}
        </p>
      </div>
      <strong
        data-goals-caption-title
        className="block text-2xl leading-snug font-normal tracking-[-0.02em] text-[#0F172A] sm:text-3xl sm:leading-tight"
      >
        {step.title}
      </strong>
      <p
        data-goals-caption-body
        className="max-w-md text-sm leading-relaxed text-[#64748B] sm:text-base"
      >
        {step.panelDesc}
      </p>
    </div>
  )
}

export function GoalsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const captionClipRef = useRef<HTMLDivElement>(null)
  const layoutMode = useGoalsLayoutMode()
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (layoutMode !== "pinned") return

    const section = sectionRef.current
    const pin = pinRef.current
    const captionClip = captionClipRef.current
    if (!section || !pin || !captionClip) return

    const captions = gsap.utils.toArray<HTMLElement>("[data-goals-caption]", section)
    const visuals = gsap.utils.toArray<HTMLElement>("[data-goals-visual]", section)

    const getMotionDistances = (): MotionDistances => {
      const clipHeight = Math.max(captionClip.clientHeight, 160)
      return {
        enterY: Math.round(clipHeight * 0.75),
        exitY: Math.round(clipHeight * 0.62),
      }
    }

    const applyStepProgress = (progress: number) => {
      const virtualActive =
        STEP_COUNT <= 1 ? 0 : progress * (STEP_COUNT - 1)
      const index = Math.round(virtualActive)
      const distances = getMotionDistances()
      const visualEnterY = Math.round((visuals[0]?.parentElement?.clientHeight ?? 320) * 0.35)
      const visualExitY = Math.round(visualEnterY * 0.85)

      const captionPlans = captions.map((el, i) => {
        const delta = virtualActive - i
        const motion = captionBlockMotion(delta, distances)
        const titleOpacity = motion.hidden ? 0 : motion.opacity

        return {
          el,
          delta,
          motion,
          title: el.querySelector<HTMLElement>("[data-goals-caption-title]"),
          meta: el.querySelector<HTMLElement>("[data-goals-caption-meta]"),
          body: el.querySelector<HTMLElement>("[data-goals-caption-body]"),
          titleOpacity,
          suppressed: false,
        }
      })

      const dominantIndex = Math.min(
        STEP_COUNT - 1,
        Math.max(0, Math.round(virtualActive))
      )
      const dominantTitleOpacity = captionPlans[dominantIndex]?.titleOpacity ?? 0

      if (dominantTitleOpacity > 0.12) {
        captionPlans.forEach((plan, i) => {
          if (i !== dominantIndex && plan.titleOpacity > 0.08) {
            plan.suppressed = true
          }
        })
      } else {
        const strongest = captionPlans.reduce(
          (best, plan, i) =>
            plan.titleOpacity > best.opacity ? { i, opacity: plan.titleOpacity } : best,
          { i: -1, opacity: 0 }
        )

        if (strongest.i >= 0) {
          captionPlans.forEach((plan, i) => {
            if (i !== strongest.i && plan.titleOpacity > 0.08) {
              plan.suppressed = true
            }
          })
        }
      }

      captionPlans.forEach(({ el, delta, motion, title, meta, body, suppressed }) => {
        if (motion.hidden || suppressed) {
          gsap.set(el, {
            opacity: 0,
            y: motion.y,
            zIndex: 0,
            visibility: "hidden",
          })
          return
        }

        gsap.set(el, { visibility: "visible" })

        if (delta > 0) {
          if (motion.opacity < 0.05) {
            gsap.set(el, {
              opacity: 0,
              y: motion.y,
              zIndex: 0,
              visibility: "hidden",
            })
            return
          }

          gsap.set(el, {
            opacity: motion.opacity,
            y: motion.y,
            zIndex: motion.zIndex,
          })
          if (title) gsap.set(title, { opacity: 1, y: 0 })
          if (meta) gsap.set(meta, { opacity: 1, y: 0 })
          if (body) gsap.set(body, { opacity: 1, y: 0 })
          return
        }

        if (motion.opacity < 0.05) {
          gsap.set(el, {
            opacity: 0,
            y: motion.y,
            zIndex: 0,
            visibility: "hidden",
          })
          return
        }

        gsap.set(el, { opacity: 1, y: 0, zIndex: motion.zIndex })
        if (title) gsap.set(title, { opacity: motion.opacity, y: motion.y })

        const detailOpacity = captionDetailReveal(delta)
        const detailY = (1 - detailOpacity) * 10
        if (meta) gsap.set(meta, { opacity: detailOpacity, y: detailY })
        if (body) gsap.set(body, { opacity: detailOpacity, y: detailY })
      })

      visuals.forEach((el, i) => {
        const { opacity, y } = visualMotion(
          virtualActive - i,
          visualEnterY,
          visualExitY
        )
        gsap.set(el, { opacity, y })
      })

      setActiveIndex(index)
    }

    const ctx = gsap.context(() => {
      applyStepProgress(0)

      ScrollTrigger.create({
        trigger: section,
        start: () => `top top+=${getNavPinOffset()}`,
        end: () => `+=${getScrollDistance()}`,
        pin,
        pinSpacing: true,
        scrub: isCoarsePointer() ? 0.45 : 1,
        anticipatePin: isCoarsePointer() ? 0 : 1,
        invalidateOnRefresh: true,
        ...(STEP_COUNT > 1 && {
          snap: {
            snapTo: (progress: number) => {
              const step = 1 / (STEP_COUNT - 1)
              return Math.round(progress / step) * step
            },
            // Touch momentum keeps running after the finger lifts — wait for it
            // to settle, otherwise the snap yanks the page back mid-flick.
            duration: isCoarsePointer()
              ? { min: 0.2, max: 0.45 }
              : { min: 0.12, max: 0.22 },
            delay: isCoarsePointer() ? 0.12 : 0,
            inertia: false,
            ease: "power2.out",
          },
        }),
        onUpdate: (self) => {
          applyStepProgress(self.progress)
        },
      })
    }, section)

    const refresh = () => {
      ScrollTrigger.refresh()
      applyStepProgress(0)
    }

    window.addEventListener("load", refresh)
    window.addEventListener("resize", refresh)

    return () => {
      window.removeEventListener("load", refresh)
      window.removeEventListener("resize", refresh)
      ctx.revert()
    }
  }, [layoutMode])

  if (layoutMode === "stacked") {
    return <GoalsScrollStacked />
  }

  return (
    <section
      ref={sectionRef}
      id="features"
      className={cn(landingSection, "relative scroll-mt-24 overflow-visible py-4 lg:py-0")}
    >
      <div className={landingInner}>
        <div ref={pinRef} className="w-full lg:py-2">
          <SectionHeader
            title={FEATURES_SECTION.title}
            subtitle={FEATURES_SECTION.subtitle}
            className="mb-5 sm:mb-6 lg:mb-8 [&_h2]:text-2xl [&_h2]:sm:text-4xl [&_p]:text-sm [&_p]:sm:text-lg"
          />

          <div className="grid w-full items-center gap-5 sm:gap-7 lg:grid-cols-2 lg:gap-10 xl:gap-12">
            <div className="relative flex min-h-36 flex-col justify-center sm:min-h-44 lg:min-h-96">
              <div
                ref={captionClipRef}
                className="relative min-h-32 flex-1 overflow-hidden sm:min-h-40 lg:min-h-96"
              >
                {FEATURE_SCROLL_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    data-goals-caption={index}
                    className="absolute inset-x-0 top-0 flex w-full items-start will-change-transform lg:inset-0 lg:items-center lg:justify-center"
                  >
                    <GoalsStepCaption step={step} />
                  </div>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "relative isolate overflow-hidden rounded-[1.75rem] bg-[#F8FAFC]",
                "min-h-80 sm:min-h-84 lg:min-h-96"
              )}
            >
              <GoalsPanelBackdrop />
              {FEATURE_SCROLL_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  data-goals-visual={index}
                  className={cn(
                    "flex items-center justify-center p-4 sm:p-6 lg:p-8",
                    index === 0 ? "relative" : "absolute inset-0"
                  )}
                >
                  <GoalsPanelVisual
                    step={step}
                    isActive={activeIndex === index}
                    enableMotion={activeIndex === index}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-8 pb-8 sm:pt-10 sm:pb-12">
          <SphereCta href={APP_NEWS_PATH}>Open application</SphereCta>
        </div>
      </div>
    </section>
  )
}
