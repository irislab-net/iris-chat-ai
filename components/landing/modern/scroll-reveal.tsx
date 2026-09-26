"use client"

import { gsap } from "gsap"
import * as React from "react"
import type { ReactNode } from "react"

import { ensureGsapScroll } from "@/lib/gsap-scroll"
import { LANDING_REVEAL } from "@/lib/landing-motion"
import { cn } from "@/lib/utils"

type RevealOptions = {
  delay: number
  y: number
  stagger: number
  /** Animate direct children individually instead of the wrapper itself. */
  group: boolean
}

/**
 * Shared reveal driver for both `ScrollReveal` and `ScrollRevealGroup`.
 *
 * Reduced motion is handled with `gsap.matchMedia()` rather than a one-off
 * `matchMedia` check, so the preference is honoured live and GSAP reverts the
 * right branch on cleanup.
 */
function useScrollReveal(
  ref: React.RefObject<HTMLDivElement | null>,
  { delay, y, stagger, group }: RevealOptions
) {
  React.useEffect(() => {
    const root = ref.current
    if (!root) return

    ensureGsapScroll()

    let mm: ReturnType<typeof gsap.matchMedia> | undefined

    // Wait a frame so grouped children exist and layout has settled before we
    // measure them for the trigger.
    const frame = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return

      const targets = group ? (Array.from(el.children) as HTMLElement[]) : [el]
      if (targets.length === 0) return

      mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Hide the targets, then unhide the wrapper, both synchronously — the
        // wrapper's `invisible` class is what prevents a flash before this runs.
        gsap.set(targets, { y, autoAlpha: 0 })
        if (group) gsap.set(el, { autoAlpha: 1 })

        gsap.to(targets, {
          y: 0,
          autoAlpha: 1,
          duration: LANDING_REVEAL.duration,
          ease: LANDING_REVEAL.ease,
          delay,
          stagger: group ? stagger : 0,
          overwrite: true,
          // A settled reveal must not keep a transform: any non-`none`
          // transform makes this element the containing block for
          // `position: fixed` descendants.
          onComplete: () => {
            gsap.set(targets, {
              clearProps: "transform,translate,rotate,scale",
            })
          },
          scrollTrigger: {
            trigger: el,
            start: LANDING_REVEAL.start,
            once: true,
          },
        })
      })

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([el, ...targets], { autoAlpha: 1, y: 0 })
      })
    })

    return () => {
      cancelAnimationFrame(frame)
      mm?.revert()
    }
  }, [delay, group, ref, stagger, y])
}

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}

/** Fades one block up as it scrolls into view. */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = LANDING_REVEAL.y,
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  useScrollReveal(ref, { delay, y, stagger: 0, group: false })

  return (
    <div ref={ref} className={cn("invisible motion-reduce:visible", className)}>
      {children}
    </div>
  )
}

type ScrollRevealGroupProps = ScrollRevealProps & {
  stagger?: number
}

/**
 * Fades direct children up one after another.
 *
 * Prefer this over mapping `ScrollReveal` with hand-computed delays: one
 * trigger drives the whole set, so the cadence stays even no matter how many
 * items there are, and adding an item needs no arithmetic.
 */
export function ScrollRevealGroup({
  children,
  className,
  delay = 0,
  y = LANDING_REVEAL.y,
  stagger = LANDING_REVEAL.stagger,
}: ScrollRevealGroupProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  useScrollReveal(ref, { delay, y, stagger, group: true })

  return (
    <div ref={ref} className={cn("invisible motion-reduce:visible", className)}>
      {children}
    </div>
  )
}
