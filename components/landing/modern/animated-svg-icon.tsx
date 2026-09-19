"use client"

import { gsap } from "gsap"
import { useEffect, useRef, type ReactNode } from "react"

import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { LANDING_MOTION, prefersReducedMotion } from "@/lib/landing-motion"
import { cn } from "@/lib/utils"

type AnimatedSvgKind = "stroke" | "logo"

type AnimatedSvgIconProps = {
  className?: string
  kind?: AnimatedSvgKind
  scrollTrigger?: boolean
  play?: boolean
  replayOnHover?: boolean
  onComplete?: () => void
  children: ReactNode
}

const STROKE_SELECTOR = "path, circle, ellipse, line, rect, polyline, polygon"
const DURATION = 0.5
const STAGGER = DURATION / 10

function resetStrokeTargets(targets: SVGGeometryElement[]) {
  targets.forEach((shape) => {
    gsap.set(shape, { opacity: 1, strokeDashoffset: 0, clearProps: "strokeDasharray" })
  })
}

function collectStrokeTargets(scope: HTMLElement) {
  const targets: SVGGeometryElement[] = []

  scope.querySelectorAll(STROKE_SELECTOR).forEach((element) => {
    const shape = element as SVGGeometryElement
    if (typeof shape.getTotalLength !== "function") return

    const length = shape.getTotalLength()
    if (!length) return

    targets.push(shape)
    gsap.set(shape, {
      strokeDasharray: length,
      strokeDashoffset: length,
      opacity: 0,
    })
  })

  return targets
}

function buildScrollTrigger(scope: HTMLElement) {
  return {
    trigger: scope,
    start: LANDING_MOTION.start,
    once: true,
  }
}

export function AnimatedSvgIcon({
  className,
  kind = "stroke",
  scrollTrigger = false,
  play = true,
  replayOnHover = false,
  onComplete,
  children,
}: AnimatedSvgIconProps) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    const scope = scopeRef.current
    if (!scope) return

    if (prefersReducedMotion()) {
      if (kind === "logo") {
        const mark = scope.querySelector<SVGPathElement>("[data-logo-mark]")
        if (mark) gsap.set(mark, { opacity: 1, fill: "currentColor", strokeWidth: 0 })
      } else {
        resetStrokeTargets(Array.from(scope.querySelectorAll(STROKE_SELECTOR)) as SVGGeometryElement[])
      }
      return
    }

    ensureGsapScroll()
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        paused: true,
        onComplete,
        scrollTrigger: scrollTrigger ? buildScrollTrigger(scope) : undefined,
      })

      if (kind === "logo") {
        const mark = scope.querySelector<SVGPathElement>("[data-logo-mark]")
        if (!mark) return

        const length = mark.getTotalLength()
        gsap.set(mark, {
          fill: "transparent",
          stroke: "currentColor",
          strokeWidth: 1.15,
          strokeLinejoin: "round",
          strokeLinecap: "round",
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 1,
        })

        timeline
          .to(mark, {
            strokeDashoffset: 0,
            duration: 0.65,
            ease: "power2.inOut",
          })
          .to(
            mark,
            {
              fill: "currentColor",
              strokeWidth: 0,
              duration: 0.2,
              ease: "power2.out",
            },
            "-=0.12"
          )
      } else {
        const strokeTargets = collectStrokeTargets(scope)

        if (strokeTargets.length > 0) {
          timeline
            .to(strokeTargets, {
              strokeDashoffset: 0,
              duration: DURATION,
              ease: "power2.inOut",
              stagger: STAGGER,
            })
            .to(strokeTargets, { opacity: 1, duration: 0.1 }, "<")
        }
      }

      timelineRef.current = timeline
    }, scope)

    return () => {
      ctx.revert()
      timelineRef.current = null
    }
  }, [kind, scrollTrigger, onComplete])

  useEffect(() => {
    if (scrollTrigger || prefersReducedMotion()) return

    const timeline = timelineRef.current
    if (!timeline) return

    if (play) timeline.play(0)
    else timeline.reverse()
  }, [play, scrollTrigger])

  const replay = () => {
    if (prefersReducedMotion()) return
    timelineRef.current?.play(0)
  }

  return (
    <div
      ref={scopeRef}
      className={cn("relative size-[1em]", className)}
      onMouseEnter={replayOnHover ? replay : undefined}
      onTouchStart={replayOnHover ? replay : undefined}
    >
      {children}
    </div>
  )
}
