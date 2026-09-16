"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useRef, useState, type ReactNode } from "react"

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
import { landingCard, landingInner, landingSection } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const STEP_COUNT = FEATURE_SCROLL_STEPS.length
const STEP_STAGE_MIN_H =
  "min-h-[calc(100dvh-14rem)] sm:min-h-[calc(100dvh-13rem)] lg:min-h-[22rem] xl:min-h-96"

function getNavPinOffset() {
  return window.matchMedia("(min-width: 1024px)").matches ? 72 : 56
}

function GoalsStepCopy({
  step,
  inScroll = false,
}: {
  step: FeatureScrollStep
  inScroll?: boolean
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between gap-6 px-6 pb-6 sm:px-8 sm:pb-8 lg:px-9 lg:pb-9",
        inScroll ? "pt-2 sm:pt-3" : "pt-6 sm:pt-8 lg:pt-9"
      )}
    >
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
  isActive = true,
}: {
  step: FeatureScrollStep
  isActive?: boolean
}) {
  return (
    <div className="relative flex h-full min-h-56 items-center justify-center overflow-hidden bg-[#F8FAFC] p-6 sm:p-8 lg:min-h-0 lg:p-10">
      <GoalsPanelBackdrop />
      <div className="relative z-10 flex w-full justify-center">
        <GoalsPanelVisual step={step} isActive={isActive} />
      </div>
    </div>
  )
}

function GoalsStepContent({ step }: { step: FeatureScrollStep }) {
  return (
    <div className="grid lg:grid-cols-2 lg:min-h-80 xl:min-h-96">
      <GoalsStepCopy step={step} />
      <GoalsStepVisualPanel step={step} />
    </div>
  )
}

function GoalsStepStage({ step }: { step: FeatureScrollStep }) {
  return (
    <article className={cn("overflow-hidden", landingCard)}>
      <GoalsStepContent step={step} />
    </article>
  )
}

function GoalsScrollLayer({
  children,
  side,
}: {
  children: ReactNode
  side: "copy" | "visual"
}) {
  return (
    <div
      data-goals-layer={side}
      className="absolute inset-0 will-change-[opacity,transform]"
    >
      {children}
    </div>
  )
}

function GoalsStepProgress({
  activeIndex,
  className,
}: {
  activeIndex: number
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} aria-hidden>
      {FEATURE_SCROLL_STEPS.map((step, index) => (
        <span
          key={step.id}
          className={cn(
            "h-1 rounded-full transition-all duration-500",
            index === activeIndex ? "w-7 bg-[#0F172A]" : "w-1.5 bg-[#CBD5E1]"
          )}
        />
      ))}
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
          badge={FEATURES_SECTION.badge}
          title={FEATURES_SECTION.title}
          subtitle={FEATURES_SECTION.subtitle}
        />

        <div className="mt-10 space-y-8 sm:mt-12 sm:space-y-10">
          {FEATURE_SCROLL_STEPS.map((step) => (
            <GoalsStepStage key={step.id} step={step} />
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
    if (!section || !pin) return

    const copyLayers = gsap.utils.toArray<HTMLElement>("[data-goals-layer='copy']", pin)
    const visualLayers = gsap.utils.toArray<HTMLElement>("[data-goals-layer='visual']", pin)
    if (copyLayers.length === 0 || visualLayers.length === 0) return

    const syncActiveIndex = (progress: number) => {
      const next = STEP_COUNT <= 1 ? 0 : Math.round(progress * (STEP_COUNT - 1))
      if (next === activeIndexRef.current) return
      activeIndexRef.current = next
      setActiveIndex(next)
    }

    const ctx = gsap.context(() => {
      gsap.set([...copyLayers, ...visualLayers], { autoAlpha: 0, y: 16 })
      gsap.set([copyLayers[0], visualLayers[0]], { autoAlpha: 1, y: 0 })

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut", duration: 0.45 },
        scrollTrigger: {
          trigger: section,
          start: () => `top top+=${getNavPinOffset()}`,
          end: () => `+=${window.innerHeight * Math.max(STEP_COUNT - 1, 1)}`,
          pin,
          pinSpacing: true,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          ...(STEP_COUNT > 1 && {
            snap: {
              snapTo: (value: number) => {
                const step = 1 / (STEP_COUNT - 1)
                return Math.round(value / step) * step
              },
              duration: 0.22,
              ease: "power2.inOut",
            },
          }),
          onUpdate: (self) => syncActiveIndex(self.progress),
        },
      })

      for (let index = 1; index < STEP_COUNT; index++) {
        timeline
          .to([copyLayers[index - 1], visualLayers[index - 1]], { autoAlpha: 0, y: -12 })
          .to([copyLayers[index], visualLayers[index]], { autoAlpha: 1, y: 0 }, "<0.08")
          .to({}, { duration: 0.55 })
      }
    }, section)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener("load", refresh)
    const resizeObserver = new ResizeObserver(refresh)
    resizeObserver.observe(section)

    return () => {
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
          className="flex min-h-[calc(100dvh-3.5rem)] flex-col justify-center py-6 sm:py-8 will-change-transform"
        >
          <div className="shrink-0">
            <SectionHeader
              badge={FEATURES_SECTION.badge}
              title={FEATURES_SECTION.title}
              subtitle={FEATURES_SECTION.subtitle}
            />
          </div>

          <article className={cn("mt-6 overflow-hidden sm:mt-8", landingCard)}>
            <div className={cn("grid lg:grid-cols-2 lg:min-h-80 xl:min-h-96", STEP_STAGE_MIN_H)}>
              <div className="flex min-h-0 flex-col">
                <div className="shrink-0 px-6 pt-5 pb-5 sm:px-8 sm:pt-6 sm:pb-6 lg:px-9">
                  <GoalsStepProgress activeIndex={activeIndex} />
                </div>
                <div className="relative min-h-56 flex-1 lg:min-h-0">
                  {FEATURE_SCROLL_STEPS.map((step) => (
                    <GoalsScrollLayer key={`${step.id}-copy`} side="copy">
                      <GoalsStepCopy step={step} inScroll />
                    </GoalsScrollLayer>
                  ))}
                </div>
              </div>

              <div className="relative min-h-56 lg:min-h-0">
                {FEATURE_SCROLL_STEPS.map((step, index) => (
                  <GoalsScrollLayer key={`${step.id}-visual`} side="visual">
                    <GoalsStepVisualPanel step={step} isActive={activeIndex === index} />
                  </GoalsScrollLayer>
                ))}
              </div>
            </div>
          </article>
        </div>

        <div className="flex justify-center py-10 sm:py-12 lg:py-16">
          <SphereCta href={APP_NEWS_PATH}>Meet Exur</SphereCta>
        </div>
      </div>
    </section>
  )
}
