"use client"

import { gsap } from "gsap"
import * as React from "react"

import { ensureGsapScroll } from "@/lib/gsap-scroll"

/**
 * Single GSAP standard for the landing page.
 *
 * Reveals, nav scroll, the about expand, and the goals-story handoffs all
 * read from here so a timing change is one edit, not a hunt through sections.
 */
export const LANDING_MOTION = {
  ease: "power3.out",
  easeIn: "power3.in",
  easeInOut: "power3.inOut",
  duration: 0.9,
  durationIn: 0.45,
  durationFast: 0.5,
  /** Full-viewport expand / collapse of the about stage. */
  expand: 0.72,
  /** Travel distance, in px, for the upward fade. */
  y: 40,
  /** Delay between siblings in a staggered group. */
  stagger: 0.08,
  /** ScrollTrigger start — fires once the element is comfortably in view. */
  start: "top 88%",
  spyStart: "top 55%",
  spyEnd: "bottom 45%",
} as const

/** Back-compat alias — existing reveal call sites import this name. */
export const LANDING_REVEAL = LANDING_MOTION

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  )
}

/**
 * Reduced-motion preference, reactive to changes.
 *
 * Landing components use this rather than `motion/react` so the page depends
 * on one animation library. Returns `false` during SSR and the first client
 * render, which matches the GSAP reveals: they start hidden and are shown by
 * the effect either way.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY)
    queueMicrotask(() => setReduced(query.matches))

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  return reduced
}

/**
 * Smooth-scroll a landing section into view.
 *
 * Uses GSAP's ScrollToPlugin so the easing matches every other motion on the
 * page, and honours the section's `scroll-margin` (the sticky nav offset).
 */
export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return

  ensureGsapScroll()

  const offsetY = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0

  if (prefersReducedMotion()) {
    el.scrollIntoView({ behavior: "auto", block: "start" })
    return
  }

  gsap.to(window, {
    duration: LANDING_MOTION.duration,
    ease: LANDING_MOTION.easeInOut,
    overwrite: "auto",
    scrollTo: { y: el, offsetY, autoKill: true },
  })
}
